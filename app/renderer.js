import { renderGrid } from "../features/card-grid/index.js";

// --- add this flag ---
const LAYOUT_MODE = "catalog"; // 'catalog' | 'masonry'

// keep your debounce + waitForImages helpers if you have them

window.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  const spinner = document.getElementById("spinner");

  try {
    // load + sort (keep your current sort)
    let items = await window.api.loadVault();
    items.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));

    // toggle catalog class
    if (LAYOUT_MODE === "catalog") grid.classList.add("catalog");

    await renderGrid(grid, items);

    if (LAYOUT_MODE === "masonry") {
      // your existing wait + MiniMasonry path
      await waitForImages(grid, { timeout: 8000 });
      const masonry = new MiniMasonry({
        container: ".grid",
      });
      const relayout = debounce(() => masonry.layout(), 120);
      grid.addEventListener(
        "load",
        (e) => {
          if (e.target?.tagName === "IMG") relayout();
        },
        true
      );
    }

    if (spinner) spinner.setAttribute("aria-hidden", "true");
  } catch (e) {
    console.error(e);
    if (spinner) spinner.setAttribute("aria-hidden", "true");
  }
});
