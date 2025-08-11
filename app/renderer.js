import { renderGrid } from "../features/card-grid/index.js";

// --- layout mode toggle ---
const LAYOUT_MODE = "catalog"; // 'catalog' | 'masonry'

// data caches
let allItems = [];
let filteredItems = [];

// keep your debounce + waitForImages helpers if you have them
// (assuming debounce + waitForImages are still globally available)

window.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  const spinner = document.getElementById("spinner");
  const filtersEl = document.getElementById("filters"); // ✅ container for filter buttons

  try {
    // load + sort
    allItems = await window.api.loadVault();
    allItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));
    filteredItems = [...allItems];

    // toggle catalog class
    if (LAYOUT_MODE === "catalog") grid.classList.add("catalog");

    // initial render
    await renderGrid(grid, filteredItems);

    if (LAYOUT_MODE === "masonry") {
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

    // ✅ filter button click handler
    if (filtersEl) {
      filtersEl.addEventListener("click", async (e) => {
        if (!e.target.matches("button")) return;

        const filter = e.target.getAttribute("data-filter");

        if (filter === "all") {
          filteredItems = [...allItems];
        } else {
          filteredItems = allItems.filter((item) => item.type === filter);
        }

        await renderGrid(grid, filteredItems);

        if (LAYOUT_MODE === "masonry") {
          await waitForImages(grid, { timeout: 8000 });
          const masonry = new MiniMasonry({ container: ".grid" });
          masonry.layout();
        }
      });
    }

    if (spinner) spinner.setAttribute("aria-hidden", "true");
  } catch (e) {
    console.error(e);
    if (spinner) spinner.setAttribute("aria-hidden", "true");
  }
});
