import { renderGrid } from "../features/card-grid/index.js";

// tiny debounce
function debounce(fn, ms = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// wait for all images currently in the grid to complete (load or error)
function waitForImages(container, { timeout = 8000 } = {}) {
  return new Promise((resolve) => {
    // ensure <img> elements exist first
    requestAnimationFrame(() => {
      const imgs = Array.from(container.querySelectorAll("img"));
      if (imgs.length === 0) return resolve();

      let remaining = imgs.length;
      const done = () => {
        if (--remaining <= 0) resolve();
      };

      imgs.forEach((img) => {
        // handle cached images immediately (and decode when possible)
        if (img.complete) {
          if ("decode" in img) {
            img.decode().then(done).catch(done);
          } else {
            done();
          }
          return;
        }
        img.onload = img.onerror = done;
      });

      // safety net: never wait forever
      setTimeout(() => resolve(), timeout);
    });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  const spinner = document.getElementById("spinner");

  try {
    grid.classList.add("prelayout");

    let items = await window.api.loadVault();
    console.log("[renderer] items:", items.length);

    // sort: newest first
    items.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));

    await renderGrid(grid, items);
    await waitForImages(grid, { timeout: 8000 });

    grid.classList.remove("prelayout");

    // const masonry = new MiniMasonry({
    //   container: ".grid",
    // });

    if (spinner) spinner.setAttribute("aria-hidden", "true");

    const relayout = debounce(() => masonry.layout(), 120);
    grid.addEventListener(
      "load",
      (e) => {
        if (e.target && e.target.tagName === "IMG") relayout();
      },
      true
    );
  } catch (e) {
    console.error("[renderer] load failed", e);
    if (spinner) spinner.setAttribute("aria-hidden", "true");
    grid.insertAdjacentHTML(
      "beforeend",
      '<div class="empty">Could not load vault.</div>'
    );
  }
});
