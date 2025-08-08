export function createShell() {
  // Use the existing mount if present; else create it
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

  // Main container with left/right
  const modal = document.createElement("div");
  modal.className = "modal";

  const left = document.createElement("div");
  left.className = "modal-left";

  const right = document.createElement("div");
  right.className = "modal-right";

  // Right header with title slot + close button
  const header = document.createElement("div");
  header.className = "modal-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "modal-title"; // views will set textContent
  header.appendChild(titleWrap);

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "✕";
  header.appendChild(closeBtn);

  // Right body (views will append .modal-section blocks here)
  const body = document.createElement("div");
  body.className = "modal-body";

  right.appendChild(header);
  right.appendChild(body);

  modal.appendChild(left);
  modal.appendChild(right);
  overlay.appendChild(modal);

  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    overlay.innerHTML = "";
  }

  // Wire close interactions
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey, { once: true });

  // Open state + scroll lock
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  return {
    slots: {
      left,
      header: titleWrap, // views set title text here
      body, // views append sections here
    },
    close,
  };
}
