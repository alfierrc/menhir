import { createNoteCard } from './components/NoteCard.js';
import { createImageCard } from './components/ImageCard.js';
import { createProductCard } from './components/ProductCard.js';
import { createUnknownCard } from './components/UnknownCard.js';

export function renderGrid(container, items, getImagePath) {
  container.innerHTML = ''; // clear previous content

  // You could sort items here if needed
  const sorted = [...items].sort((a, b) => {
    const da = new Date(a.date || 0);
    const db = new Date(b.date || 0);
    return db - da; // newest first
  });

  sorted.forEach(item => {
     let card;

      switch (item.type) {
        case 'note':
          card = createNoteCard(item);
          break;
        case 'image':
          card = createImageCard(item, getImagePath);
          break;
        case 'product':
          card = createProductCard(item, getImagePath);
          break;
        default:
          card = createUnknownCard(item);
      }

      container.appendChild(card);
  });
}