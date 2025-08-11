import { openModalForItem } from "../../modal/index.js";

export function createImageCard(item) {
  // define wrapper
  const wrap = document.createElement("div");
  wrap.className = "wrapper";

  // cursor hover
  wrap.style.cursor = "pointer"; // nice affordance
  wrap.dataset.item = JSON.stringify(item); // stash for click handler

  // create and append meta
  const logMeta = document.createElement("div");
  logMeta.className = "log-meta";
  const title = document.createElement("div");
  title.textContent = item.title || item.slug;
  const date = document.createElement("div");
  date.textContent = item.date;
  logMeta.append(title, date);
  wrap.appendChild(logMeta);

  // create image card
  const card = document.createElement("article");
  card.className = "card";
  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");

  media.appendChild(img);
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

  return wrap;
}
