import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  // define wrapper and card
  const wrap = document.createElement("div");
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
  media.style.display = "grid";
  media.style.placeItems = "center";
  media.style.aspectRatio = "1 / 1";
  media.style.background = "#ffffffff";
  media.style.padding = "12px";
  media.style.overflow = "hidden";

  // Create excerpt text
  const excerpt = document.createElement("div");
  excerpt.className = "note-excerpt";
  excerpt.style.fontSize = "13px";
  excerpt.style.color = "#444";
  excerpt.style.lineHeight = "1.4";
  excerpt.style.textAlign = "center";
  excerpt.style.display = "-webkit-box";
  excerpt.style.webkitLineClamp = "6"; // ~6 lines max
  excerpt.style.webkitBoxOrient = "vertical";
  excerpt.style.overflow = "hidden";

  // Choose excerpt content
  if (item.content) {
    const clean = item.content.replace(/[#*_>\-]/g, "").trim();
    excerpt.textContent =
      clean.length > 0
        ? clean.split(/\s+/).slice(0, 40).join(" ") + "…"
        : item.title || item.slug || "Note";
  } else {
    excerpt.textContent = item.title || item.slug || "Note";
  }

  media.appendChild(excerpt);
  card.appendChild(media);
  wrap.appendChild(card);

  // open modal on click
  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    openModalForItem(item);
  });

  return wrap;
}
