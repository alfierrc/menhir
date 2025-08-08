import { renderGrid } from "../features/card-grid/index.js";
import { openImageModal } from "../features/modal/index.js";

window.modalAPI = { openImageModal }; // simple global for now

window.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  const items = await window.api.loadVault();
  console.log("[renderer] items:", items.length);

  await renderGrid(grid, items);

  new MiniMasonry({
    container: ".grid",
  });
});
