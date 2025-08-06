import { createNoteModal } from './components/NoteModal.js';
import { createMediaModal } from './components/MediaModal.js';

export function openModal(item, getImagePath) {
    let modal;
  
    if (item.type === 'note') {
      modal = createNoteModal(item);
    } else {
      modal = createMediaModal(item, getImagePath);
    }
  
    document.body.appendChild(modal);
  
    const esc = e => {
      if (e.key === 'Escape') {
        modal.remove();
        window.removeEventListener('keydown', esc);
      }
    };
    window.addEventListener('keydown', esc);
  }
