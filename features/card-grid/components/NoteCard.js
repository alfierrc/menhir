import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  // define wrapper and card
  const wrap = document.createElement("div");
  // stash the item so the grid updater can keep this fresh via dataset.item
  try {
    wrap.dataset.item = JSON.stringify(item);
  } catch {}
  wrap.dataset.key = `${(item.type || "unknown").toLowerCase()}:${
    item.slug || item.title || Math.random().toString(36).slice(2)
  }`;
  wrap.dataset.type = (item.type || "").toLowerCase();
  wrap.className = "wrapper";
  wrap.style.cursor = "pointer";
  const card = document.createElement("article");
  card.className = "card note-card";

  // create and append meta
  const logMeta = document.createElement("div");
  logMeta.className = "log-meta";
  const title = document.createElement("div");
  title.textContent = item.title || item.slug;
  const date = document.createElement("div");
  date.textContent = item.date;
  logMeta.append(title, date);
  wrap.appendChild(logMeta);

  // Square media container
  const media = document.createElement("div");
  media.className = "card-media";

  // Create excerpt text
  const excerpt = document.createElement("div");
  excerpt.className = "note-excerpt";

  // Choose excerpt content
  if (item.content) {
    // 1. Strip markdown characters but keep line breaks
    const clean = item.content.replace(/[#*_>\-`]/g, "").trim();

    // 2. Truncate to a character limit
    const maxLength = 140;
    let truncated = clean;
    if (clean.length > maxLength) {
      truncated = clean.substring(0, maxLength) + "…";
    }
    excerpt.textContent = truncated;
  } else {
    excerpt.textContent = item.title || item.slug || "Note";
  }

  media.appendChild(excerpt);
  card.appendChild(media);
  wrap.appendChild(card);

  // open modal on click
  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    // prefer the freshest item stored on the node by the grid updater
    try {
      const latest = wrap.dataset.item ? JSON.parse(wrap.dataset.item) : item;
      openModalForItem(latest);
    } catch {
      openModalForItem(item);
    }
  });
  wrap.dataset.type = "note";

  return wrap;
}
