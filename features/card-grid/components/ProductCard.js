export function createProductCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";

  // image tile
  const card = document.createElement("article");
  card.className = "card";

  const img = document.createElement("img");
  card.appendChild(img);
  wrap.appendChild(card);

  // caption below
  const cap = document.createElement("div");
  cap.className = "card-caption";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug;
  cap.appendChild(title);

  if (item.tags && item.tags.length) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = item.tags.join(" · ");
    cap.appendChild(meta);
  }

  wrap.appendChild(cap);

  // set image src asynchronously
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
