import { renderGrid } from '../features/card-grid/index.js';

window.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  const loader = document.getElementById('loader');

  const items = await window.api.loadVault();

  // Render cards
  renderGrid(grid, items, window.api.getImagePath);

  // const images = document.getElementsByTagName('img');

  //wait until all images are fully loaded
  const images = grid.querySelectorAll('img');
  const promises = Array.from(images).map(img =>
    img.complete
      ? Promise.resolve()
      : new Promise(resolve => {
          img.onload = img.onerror = resolve;
        })
  );

  Promise.all(promises).then(() => {
    // Hide spinner
    loader.style.display = 'none';

    // Run MiniMasonry
    const masonry = new MiniMasonry({
      container: '.grid',
    });
  });
});
