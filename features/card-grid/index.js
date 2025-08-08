import { createImageCard } from './components/ImageCard.js';

export function renderGrid(container, items) {
  container.innerHTML = '';
  const fr = document.createDocumentFragment();
  items.forEach(item => {
    let node;
    if (item.type === 'image') node = createImageCard(item);
    else node = createImageCard(item); // temporary: one template for all
    fr.appendChild(node);
  });
  container.appendChild(fr);

  // Masonry after images had a chance to attach
  requestAnimationFrame(() => {
    // If you want to wait for images: scan and listen, but for v0 we place now.
    new MiniMasonry({ container: '.grid' });
  });
}
