export function createShell() {
  let overlay = document.getElementById("modal-root");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modal-root";
    overlay.className = "modal-overlay";
    document.body.appendChild(overlay);
  } else {
    overlay.innerHTML = "";
    overlay.className = "modal-overlay";
  }

  const modal = document.createElement("div");
  modal.className = "modal";

  const left = document.createElement("div");
  left.className = "modal-left";

  const right = document.createElement("div");
  right.className = "modal-right";

  const header = document.createElement("div");
  header.className = "modal-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "modal-title";

  const status = document.createElement("span");
  status.className = "save-status";
  status.textContent = "";

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "✕";

  header.appendChild(titleWrap);
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "modal-body";

  const footer = document.createElement("div");
  footer.className = "modal-footer";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "modal-delete-btn";
  deleteBtn.textContent = "Delete";

  const spacer = document.createElement("div");
  spacer.style.flexGrow = "1"; // This will push the delete button to the right

  footer.appendChild(status); // Add the status indicator here
  footer.appendChild(spacer); // Add the spacer
  footer.appendChild(deleteBtn); // Then the delete button
  // --- End of new elements ---

  right.appendChild(header);
  right.appendChild(body);
  right.appendChild(footer); // Add the footer to the bottom of the right panel

  modal.appendChild(left);
  modal.appendChild(right);
  overlay.appendChild(modal);

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    overlay.innerHTML = "";
  }

  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey, { once: true });

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  return {
    slots: {
      left,
      header: titleWrap,
      body,
      status, // <-- expose status element
    },
    close,
    deleteBtn,
  };
}

document.addEventListener("keydown", (e) => {
  const isSave = e.key.toLowerCase() === "s" && (e.metaKey || e.ctrlKey);
  if (isSave) {
    e.preventDefault();
    if (status) {
      status.textContent = "Saved";
      status.classList.remove("is-saving");
      status.classList.add("is-saved");
      setTimeout(() => {
        status.textContent = "";
        status.classList.remove("is-saved");
      }, 900);
    }
  }
});
