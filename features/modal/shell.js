export function createShell() {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  // Main container
  const modal = document.createElement("div");
  modal.className = "modal";

  // Left / right panes
  const left = document.createElement("div");
  left.className = "modal-left";

  const right = document.createElement("div");
  right.className = "modal-right";

  // Right panel sections
  const header = document.createElement("div");
  header.className = "modal-header";

  const body = document.createElement("div");
  body.className = "modal-body";

  right.appendChild(header);
  right.appendChild(body);

  modal.appendChild(left);
  modal.appendChild(right);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close handling
  function close() {
    overlay.remove();
    document.body.classList.remove("modal-open");
  }
  // mark open for CSS
  overlay.classList.add("is-open");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Lock scroll while modal open
  document.body.classList.add("modal-open");

  return {
    slots: {
      left,
      header,
      body,
    },
    close,
  };
}
