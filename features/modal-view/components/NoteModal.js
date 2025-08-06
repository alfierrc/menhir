export function createNoteModal(item) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
  
    const modal = document.createElement('div');
    modal.className = 'modal modal-split';
  
    const left = document.createElement('div');
    left.className = 'modal-left';
    left.innerHTML = marked.parse(item.content || '');
  
    const right = document.createElement('div');
    right.className = 'modal-right';
  
    const title = document.createElement('h2');
    title.innerText = item.title || item.slug;
    right.appendChild(title);
  
    const meta = document.createElement('div');
    meta.className = 'modal-meta';
  
    Object.entries(item).forEach(([key, value]) => {
      if (['title', 'slug', 'content', 'image'].includes(key)) return;
      const line = document.createElement('div');
      line.innerHTML = `<strong>${key}:</strong> ${value}`;
      meta.appendChild(line);
    });
  
    right.appendChild(meta);
  
    const close = document.createElement('button');
    close.className = 'modal-close';
    close.innerText = '×';
    close.onclick = () => overlay.remove();
  
    modal.appendChild(close);
    modal.appendChild(left);
    modal.appendChild(right);
    overlay.appendChild(modal);
  
    return overlay;
  }
  