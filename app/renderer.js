import { renderGrid } from '../features/card-grid/index.js';

window.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');

  // 1) Load data
  const items = await window.api.loadVault();

  // 2) Render cards
  //    If you have thumbnails wired, prefer window.api.getThumbnail
  const getSrc = window.api.getThumbnail || window.api.getImagePath;
  renderGrid(grid, items, getSrc);

  // 3) Wait for ALL images in the grid
  await new Promise(requestAnimationFrame); // ensure <img>s exist in DOM
  const images = Array.from(grid.querySelectorAll('img'));
  await Promise.all(
    images.map(img =>
      img.complete ? Promise.resolve() :
      new Promise(resolve => { img.onload = img.onerror = resolve; })
    )
  );

  // 4) Init MiniMasonry AFTER images are ready
  new MiniMasonry({
    container: document.querySelector('.grid') ? '.grid' : '#grid',
  });
});
