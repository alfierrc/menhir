import { openModalForItem } from "../../modal/index.js";
import { createCardHeader } from "./CardHeader.js";

export function createProductCard(item) {
  // define wrapper
  const wrap = document.createElement("div");
  wrap.dataset.key = `${(item.type || "unknown").toLowerCase()}:${
    item.slug || item.title || Math.random().toString(36).slice(2)
  }`;
  wrap.dataset.type = (item.type || "").toLowerCase();
  wrap.className = "wrapper";

  // cursor hover
  wrap.style.cursor = "pointer"; // nice affordance
  wrap.dataset.item = JSON.stringify(item); // stash for click handler

  // create header
  const header = createCardHeader(item);
  wrap.appendChild(header);

  // create image card
  const card = document.createElement("article");
  card.className = "card";
  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");

  media.appendChild(img);

  // Create and add the price box if a price exists
  if (item.price) {
    const priceBox = document.createElement("div");
    priceBox.className = "price-box";
    // Change this line
    priceBox.textContent = `${item.currency || "$"}${item.price}`;
    media.appendChild(priceBox);
  }

  card.appendChild(media);
  wrap.appendChild(card);

  if (item.image && window.api?.getImagePath) {
    const markLoaded = () => img.classList.add("is-loaded");
    img.onload = markLoaded;
    img.onerror = markLoaded;
    window.api
      .getImagePath(item.folder, item.thumbnail || item.image)
      .then((src) => {
        img.src = src;
        if (img.complete)
          "decode" in img
            ? img.decode().then(markLoaded).catch(markLoaded)
            : markLoaded();
      });
  }

  // listen for click
  wrap.addEventListener("click", () => openModalForItem(item));
  wrap.dataset.type = "product";

  return wrap;
}
