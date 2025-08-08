import { renderGrid } from '../features/card-grid/index.js';

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const grid = document.getElementById('grid');
    const items = await window.api.loadVault();
    console.log('[renderer] items:', items.length);
    renderGrid(grid, items);
  } catch (e) {
    console.error('[renderer] load failed', e);
  }
});
