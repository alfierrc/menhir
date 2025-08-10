import { openModalForItem } from "../../modal/index.js";

export function createNoteCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";
  wrap.style.cursor = "pointer";

  const card = document.createElement("article");
  card.className = "card note-card"; // extra class for styling

  // Square media container
  const media = document.createElement("div");
  media.className = "card-media";
  media.style.display = "grid";
  media.style.placeItems = "center";
  media.style.aspectRatio = "1 / 1"; // force square
  media.style.background = "#f5f5f5";
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

  // caption (title + tags)
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

  // open modal on click
  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    openModalForItem(item);
  });

  return wrap;
}
