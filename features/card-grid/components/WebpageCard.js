import { openModalForItem } from "../../modal/index.js";

export function createWebpageCard(item) {
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

  // creat header
  const header = document.createElement("div");
  header.className = "item-header";

  // create and append meta to header
  const logMeta = document.createElement("div");
  logMeta.className = "log-meta";
  const title = document.createElement("div");
  title.textContent = item.title || item.slug;
  const date = document.createElement("div");
  date.textContent = item.date;
  logMeta.append(title, date);
  header.appendChild(logMeta);

  // create and append type icon to header
  // const type = document.createElement("div");
  // type.className = "type-icon";
  // type.style.placeItems = "center";
  // type.style.aspectRatio = "1 / 1";
  // type.style.background = "#e75d07ff";
  // type.style.overflow = "hidden";
  // type.style.borderRadius = "100%";
  // header.appendChild(type);

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
    // You can format the price here, for example, by adding a currency symbol
    priceBox.textContent = `$${item.price}`;
    media.appendChild(priceBox);
  }

  card.appendChild(media);
  wrap.appendChild(card);

  if (item.image && window.api?.getImagePath) {
    const markLoaded = () => img.classList.add("is-loaded");
    img.onload = markLoaded;
    img.onerror = markLoaded;
    window.api.getImagePath(item.folder, item.image).then((src) => {
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
