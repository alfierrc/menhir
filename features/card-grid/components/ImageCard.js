import { openModalForItem } from "../../modal/index.js";

export function createImageCard(item) {
  // define wrapper
  const wrap = document.createElement("div");
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
  // type.style.background = "#b78dacff";
  // type.style.overflow = "hidden";
  // type.style.borderRadius = "2px";
  // header.appendChild(type);

  wrap.appendChild(header);

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
