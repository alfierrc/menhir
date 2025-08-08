export function createImageCard(item) {
  const wrap = document.createElement("div");
  wrap.className = "wrapper";
  wrap.dataset.item = JSON.stringify(item); // stash for click handler

  const card = document.createElement("article");
  card.className = "card";
  const img = document.createElement("img");
  card.appendChild(img);
  wrap.appendChild(card);

  const cap = document.createElement("div");
  cap.className = "card-caption";
  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.slug;
  cap.appendChild(title);
  wrap.appendChild(cap);

  if (item.image && window.api?.getImagePath) {
    const markLoaded = () => img.classList.add("is-loaded");
    img.onload = markLoaded;
    img.onerror = markLoaded;
    window.api.getImagePath(item.folder, item.image).then((src) => {
      img.src = src;
      if (img.complete)
        "decode" in img
          ? img.decode().then(markLoaded).catch(markLoaded)
          : markLoaded();
    });
  }

  // click opens modal (delegate outside too if you prefer)
  wrap.addEventListener("click", (e) => {
    e.preventDefault();
    const { openImageModal } = window.modalAPI || {};
    if (openImageModal) openImageModal(item, window.api.getImagePath);
  });

  return wrap;
}
