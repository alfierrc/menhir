import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";
  wrap.style.cursor = "pointer";

  const card = document.createElement("article");
  card.className = "card";

  // pseudo-cover for notes (light gray)
  const media = document.createElement("div");
  media.className = "card-media";
  media.style.display = "grid";
  media.style.placeItems = "center";
  const stub = document.createElement("div");
  stub.style.fontSize = "13px";
  stub.style.color = "#666";
  stub.style.padding = "0 8px";
  stub.style.textAlign = "center";
  stub.style.lineHeight = "1.3";
  stub.textContent = item.title || item.slug || "Note";
  media.appendChild(stub);

  card.appendChild(media);
  wrap.appendChild(card);

  // caption
  const cap = document.createElement("div");
  cap.className = "card-caption";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug || "Note";
  cap.appendChild(title);

  if (item.tags && item.tags.length) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = item.tags.join(", ");
    cap.appendChild(meta);
  }

  wrap.appendChild(cap);

  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    openModalForItem(item);
  });

  return wrap;
}
