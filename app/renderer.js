import { renderGrid } from "../features/card-grid/index.js";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const grid = document.getElementById("grid");
    const items = await window.api.loadVault();
    console.log("[renderer] items:", items.length);

    await renderGrid(grid, items); // wait for images so heights are final

    new MiniMasonry({
      container: ".grid",
    });
  } catch (e) {
    console.error("[renderer] load failed", e);
  }
});
