import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";
  wrap.style.cursor = "pointer";

  const card = document.createElement("article");
  card.className = "card note";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug || "Note";
  card.appendChild(title);

  if (item.content) {
    const ex = document.createElement("div");
    ex.className = "excerpt";
    ex.textContent = item.content.trim().replace(/\s+/g, " ").slice(0, 280);
    card.appendChild(ex);
  }

  wrap.appendChild(card);

  // open modal on click
  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    openModalForItem(item);
  });

  return wrap;
}
