export function createImageCard(item) {
  const wrap = document.createElement('div');
  wrap.className = 'wrapper';

  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  card.appendChild(img);

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = item.title || item.slug;
  card.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = (item.tags || []).join(', ');
  card.appendChild(meta);

  wrap.appendChild(card);

  // set src asynchronously via api.getImagePath when available
  if (item.image && window.api?.getImagePath) {
    window.api.getImagePath(item.folder, item.image).then((src) => { img.src = src; })
      .catch(() => {});
  }

  return wrap;
}
