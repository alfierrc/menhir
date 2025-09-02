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
  card.className = "card article-card";

  // The standard header with the catalogue ID and sans-serif title
  const header = createCardHeader(item);
  wrap.appendChild(header);

  const media = document.createElement("div");
  media.className = "card-media";

  // If the article has a lead image, display it.
  if (item.image && item.thumbnail) {
    const img = document.createElement("img");
    media.appendChild(img);
    window.api
      .getImagePath(item.folder, item.thumbnail)
      .then((src) => (img.src = src));
  } else {
    // If no image, display the icon and serif title fallback.
    media.classList.add("no-image");

    const icon = document.createElement("div");
    icon.className = "article-card-icon";
    // Inline SVG for the article icon
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect width="24" height="24" fill="white"></rect> <path d="M12 6.90909C10.8999 5.50893 9.20406 4.10877 5.00119 4.00602C4.72513 3.99928 4.5 4.22351 4.5 4.49965C4.5 6.54813 4.5 14.3034 4.5 16.597C4.5 16.8731 4.72515 17.09 5.00114 17.099C9.20405 17.2364 10.8999 19.0998 12 20.5M12 6.90909C13.1001 5.50893 14.7959 4.10877 18.9988 4.00602C19.2749 3.99928 19.5 4.21847 19.5 4.49461C19.5 6.78447 19.5 14.3064 19.5 16.5963C19.5 16.8724 19.2749 17.09 18.9989 17.099C14.796 17.2364 13.1001 19.0998 12 20.5M12 6.90909L12 20.5" stroke="#000000" stroke-linejoin="round"></path> <path d="M19.2353 6H21.5C21.7761 6 22 6.22386 22 6.5V19.539C22 19.9436 21.5233 20.2124 21.1535 20.0481C20.3584 19.6948 19.0315 19.2632 17.2941 19.2632C14.3529 19.2632 12 21 12 21C12 21 9.64706 19.2632 6.70588 19.2632C4.96845 19.2632 3.64156 19.6948 2.84647 20.0481C2.47668 20.2124 2 19.9436 2 19.539V6.5C2 6.22386 2.22386 6 2.5 6H4.76471" stroke="#000000" stroke-linejoin="round"></path> </g></svg>`;

    const title = document.createElement("div");
    title.className = "article-card-title";
    title.textContent = item.title;

    media.appendChild(icon);
    media.appendChild(title);
  }

  card.appendChild(media);
  wrap.appendChild(card);

  wrap.addEventListener("click", () => {
    openModalForItem(item);
  });

  return wrap;
}
