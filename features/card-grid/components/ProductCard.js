export function createProductCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";

  const card = document.createElement("article");
  card.className = "card";

  if (item.image) {
    const media = document.createElement("div");
    media.className = "card-media";
    const img = document.createElement("img");
    media.appendChild(img);
    card.appendChild(media);

    window.api
      .getImagePath(item.folder, item.image)
      .then((src) => {
        img.src = src;
      })
      .catch(() => {});
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug;
  body.appendChild(title);

  // Optional: price/source
  if (item.price) {
    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `£${item.price}`;
    body.appendChild(meta);
  }

  card.appendChild(body);
  wrap.appendChild(card);
  return wrap;
}
