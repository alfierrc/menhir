window.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('grid');
  const items = await window.vaultAPI.loadVault();

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    // IMAGE types (photos, products)
    if (item.image && (item.type === 'image' || item.type === 'product')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'wrapper';
      const card = document.createElement('div');
      card.className = 'card';

      const img = document.createElement('img');
      console.log('Rendering card for:', item.slug, '| path:', window.vaultAPI.getImagePath(item.folder, item.image));
      img.src = window.vaultAPI.getImagePath(item.folder, item.image);
      card.appendChild(img);

      // Add the card (just the image)
      wrapper.appendChild(card);

      // Title below the image (outside the card)
      const title = document.createElement('div');
      title.className = 'title photo-title';
      title.innerText = item.title || item.slug;
      wrapper.appendChild(title);

      grid.appendChild(wrapper);
    }

    // NOTE type (text-only)
    else if (item.type === 'note') {
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
      grid.appendChild(wrapper);// ✅ append here
    }

    // fallback?
    else {
      const content = document.createElement('div');
      content.className = 'card-content';
      content.innerText = `Unsupported type: ${item.type}`;
      card.appendChild(content);
    }


  });
  
  const images = grid.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = img.onerror = resolve;
    });
  });

  Promise.all(promises).then(() => {
    const masonry = new MiniMasonry({
      container: '.grid',
    });
  });
});
