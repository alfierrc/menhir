export function createModal(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
  
    const modal = document.createElement('div');
    modal.className = 'modal';
  
    // Close button
    const close = document.createElement('button');
    close.className = 'modal-close';
    close.innerText = '×';
    close.addEventListener('click', () => {
      overlay.remove();
    });
  
    const content = document.createElement('div');
    content.className = 'modal-content';
  
    const title = document.createElement('h2');
    title.innerText = item.title || item.slug;
    content.appendChild(title);
  
    if (item.image) {
      const img = document.createElement('img');
      img.src = window.vaultAPI.getImagePath(item.folder, item.image);
      img.alt = item.title || item.slug;
      content.appendChild(img);
    }
  
    if (item.content) {
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.innerText = item.content;
      content.appendChild(body);
    }
  
    modal.appendChild(close);
    modal.appendChild(content);
    overlay.appendChild(modal);
  
    return overlay;
  }
  