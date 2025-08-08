import { createImageCard } from "./components/ImageCard.js";
import { createProductCard } from "./components/ProductCard.js";
import { createNoteCard } from "./components/NoteCard.js";

export function renderGrid(container, items) {
  container.innerHTML = "";
  const fr = document.createDocumentFragment();

  items.forEach((item) => {
    let node;
    if (item.type === "image") node = createImageCard(item);
    else if (item.type === "product") node = createProductCard(item);
    else node = createNoteCard(item);
    fr.appendChild(node);
  });

  container.appendChild(fr);

  // Return a promise that resolves when all images in the grid have settled
  return new Promise((resolve) => {
    // wait a frame for <img> elements to be in the DOM
    requestAnimationFrame(() => {
      const imgs = Array.from(container.querySelectorAll("img"));
      if (imgs.length === 0) return resolve(); // nothing to wait for
      let remaining = imgs.length;
      const done = () => {
        if (--remaining <= 0) resolve();
      };
      imgs.forEach((img) => {
        if (img.complete) return done();
        img.onload = img.onerror = done;
      });
    });
  });
}
