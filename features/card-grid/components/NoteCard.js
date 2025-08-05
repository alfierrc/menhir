export function createNoteCard(item) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

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