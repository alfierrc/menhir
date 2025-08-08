import { renderGrid } from '../features/card-grid/index.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const grid = document.getElementById('grid');

    // 1) Load items from the vault
    const items = await window.api.loadVault();
    console.log('[renderer] items:', items.length);

    // 2) Render cards into the grid
    renderGrid(grid, items);

    // 3) Once cards are in the DOM, run MiniMasonry
    // MiniMasonry is available globally because we load vendor/minimasonry.min.js in index.html
    new MiniMasonry({
      container: '.grid',
    });

  } catch (e) {
    console.error('[renderer] load failed', e);
  }
});
