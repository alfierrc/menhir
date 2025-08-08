export function createImageCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";

  const card = document.createElement("article");
  card.className = "card";

  // --- media ---
  const media = document.createElement("div");
  media.className = "card-media";
  // Optional: per-item aspect ratio, e.g. square
  // media.style.setProperty('--ar', '1/1');

  const img = document.createElement("img");
  media.appendChild(img);
  card.appendChild(media);

  // --- body / caption ---
  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug;
  body.appendChild(title);

  // Optional meta (tags/domains)
  if (item.tags && item.tags.length) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = item.tags.join(" · ");
    body.appendChild(meta);
  }

  card.appendChild(body);
  wrap.appendChild(card);

  // Set image src asynchronously
  if (item.image && window.api?.getImagePath) {
    window.api
      .getImagePath(item.folder, item.image)
      .then((src) => {
        img.src = src;
      })
      .catch(() => {});
  }

  return wrap;
}
