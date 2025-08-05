export function createUnknownCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerText = `Unsupported type: ${item.type}`;
  return card;
}