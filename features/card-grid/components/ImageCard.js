export function createImageCard(item, getImagePath) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  const card = document.createElement('div');
  card.className = 'card imageCard';

  const img = document.createElement('img');
  if (item.image) {
    getImagePath(item.folder, item.image).then((src) => {
      img.src = src;
    });
  }

  img.alt = item.title || item.slug;

  card.appendChild(img);
  wrapper.appendChild(card);

  const title = document.createElement('div');
  title.className = 'title photo-title';
  title.innerText = item.title || item.slug;
  wrapper.appendChild(title);

  return wrapper;
}