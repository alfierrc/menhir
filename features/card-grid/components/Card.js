export function renderCard(item, getImagePath) {
  // Create the wrapper, which handles layout breaking
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  // IMAGE types
  if (item.image && (item.type === 'image' || item.type === 'product')) {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.src = getImagePath(item.folder, item.image);
    card.appendChild(img);
    wrapper.appendChild(card);

    const title = document.createElement('div');
    title.className = 'title photo-title';
    title.innerText = item.title || item.slug;
    wrapper.appendChild(title);

    return wrapper;
  }

  // NOTE types
  if (item.type === 'note') {
    const card = document.createElement('div');
    card.className = 'card';

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('div');
    title.className = 'title';
    title.innerText = item.title || item.slug;
    content.appendChild(title);

    const preview = document.createElement('div');
    preview.className = 'note-preview';
    preview.innerText = item.content.trim().split('\n').slice(0, 4).join('\n');
    content.appendChild(preview);

    card.appendChild(content);
    wrapper.appendChild(card);

    return wrapper;
  }

  // fallback
  const fallback = document.createElement('div');
  fallback.className = 'card';
  fallback.innerText = `Unsupported item type: ${item.type}`;
  wrapper.appendChild(fallback);

  return wrapper;
}
