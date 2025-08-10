import { createShell } from "../../modal/shell.js";
import { MODAL_VIEWS } from "../../modal/registry.js";
import { openModalForItem } from "../../modal/index.js";

export function createImageCard(item) {
  // inside createImageCard
  const card = document.createElement("article");
  card.className = "card";

  // ensure we have a media wrapper in case it's not there yet
  const media = document.createElement("div");
  media.className = "card-media";
  const img = document.createElement("img");

  media.appendChild(img);
  card.appendChild(media);
  wrap.appendChild(card);

  // caption
  const cap = document.createElement("div");
  cap.className = "card-caption";
  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug;
  cap.appendChild(title);

  // Use a sensible meta: tags, author, source, etc.
  if (item.author || (item.tags && item.tags.length)) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = item.author || item.tags.join(", ");
    cap.appendChild(meta);
  }
  wrap.appendChild(cap);

  // async image src remains the same
}
