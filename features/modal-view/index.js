import { createModal } from './components/Modal.js';

export function openModal(item) {
  const modal = createModal(item);
  document.body.appendChild(modal);

  // ESC to close
  const esc = e => {
    if (e.key === 'Escape') {
      modal.remove();
      window.removeEventListener('keydown', esc);
    }
  };
  window.addEventListener('keydown', esc);
}
