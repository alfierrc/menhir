export function createProductCard(item, getImagePath) {
  const wrapper = document.createElement('div');
  wrapper.className = 'wrapper';

  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = getImagePath(item.folder, item.image);
  img.alt = item.title || item.slug;
  card.appendChild(img);

  const content = document.createElement('div');
  content.className = 'product-details';

  const title = document.createElement('div');
  title.className = 'title';
  title.innerText = item.title || item.slug;
  content.appendChild(title);

//   if (item.caption) {
//     const caption = document.createElement('div');
//     caption.className = 'caption';
//     caption.innerText = item.caption;
//     content.appendChild(caption);
//   }

  if (item.price) {
    const price = document.createElement('div');
    price.className = 'caption';
    price.innerText = `£${item.price}`;
    content.appendChild(price);
  }

  wrapper.appendChild(card);
  wrapper.appendChild(content);

  return wrapper;
}