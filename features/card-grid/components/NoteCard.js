import { createShell } from "../../modal/shell.js";
import { MODAL_VIEWS } from "../../modal/registry.js";
import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";

  const card = document.createElement("article");
  card.className = "card";

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug || "Note";
  body.appendChild(title);

  if (item.content) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = item.content.slice(0, 120).trim();
    body.appendChild(meta);
  }

  wrap.addEventListener("click", () => openModalForItem(item));

  card.appendChild(body);
  wrap.appendChild(card);
  return wrap;
}
