import { openModalForItem } from "../../modal/index.js";
import { createCardHeader } from "./CardHeader.js";

export function createArticleCard(item) {
  const wrap = document.createElement("div");
  wrap.dataset.item = JSON.stringify(item);
  wrap.dataset.key = `article:${item.slug}`;
  wrap.dataset.type = "article";
  wrap.className = "wrapper";
  wrap.style.cursor = "pointer";

  const card = document.createElement("article");
  card.className = "card note-card"; // Reuse note-card styling for now

  // Create header with title
  const header = createCardHeader(item);
  wrap.appendChild(header);

  // Create a container for the byline/site name
  const media = document.createElement("div");
  media.className = "card-media";

  const excerpt = document.createElement("div");
  excerpt.className = "note-excerpt";
  // Display author and site name if available
  excerpt.textContent = item.byline || item.siteName || "Article";

  media.appendChild(excerpt);
  card.appendChild(media);
  wrap.appendChild(card);

  // --- THIS IS THE IMPORTANT PART ---
  // This listener is what makes the card clickable
  wrap.addEventListener("click", () => {
    openModalForItem(item);
  });

  return wrap;
}
