export function openImageModal(item, getImagePath) {
  const root = document.getElementById("modal-root");
  root.innerHTML = "";

  const modal = document.createElement("div");
  modal.className = "modal";

  // ----- LEFT: image -----
  const left = document.createElement("div");
  left.className = "modal-left";
  const img = document.createElement("img");
  left.appendChild(img);
  modal.appendChild(left);

  // set image, robustly mark loaded
  const markLoaded = () => {
    /* could add a class if you want */
  };
  img.onload = markLoaded;
  img.onerror = markLoaded;
  if (item.image) {
    getImagePath(item.folder, item.image)
      .then((src) => {
        img.src = src;
        if (img.complete)
          "decode" in img
            ? img.decode().then(markLoaded).catch(markLoaded)
            : markLoaded();
      })
      .catch(markLoaded);
  }

  // ----- RIGHT: details -----
  const right = document.createElement("div");
  right.className = "modal-right";

  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h2");
  title.className = "modal-title";
  title.textContent = item.title || item.slug || "Item";
  const btn = document.createElement("button");
  btn.className = "modal-close";
  btn.setAttribute("aria-label", "Close");
  btn.innerHTML = "✕";
  header.appendChild(title);
  header.appendChild(btn);
  right.appendChild(header);

  // frontmatter section (key-values)
  const fmSection = document.createElement("div");
  fmSection.className = "modal-section";
  const kv = document.createElement("div");
  kv.className = "modal-kv";

  const skip = new Set(["slug", "folder", "type", "content", "image"]);
  Object.entries(item).forEach(([k, v]) => {
    if (skip.has(k)) return;
    if (v == null) return;
    // pretty print arrays/objects
    let val = v;
    if (Array.isArray(v)) val = v.join(", ");
    else if (typeof v === "object") val = JSON.stringify(v);
    const kEl = document.createElement("div");
    kEl.className = "k";
    kEl.textContent = k;
    const vEl = document.createElement("div");
    vEl.className = "v";
    vEl.textContent = String(val);
    kv.appendChild(kEl);
    kv.appendChild(vEl);
  });
  fmSection.appendChild(kv);
  right.appendChild(fmSection);

  // notes section from markdown content (plain text for now)
  if (item.content && item.content.trim()) {
    const notes = document.createElement("div");
    notes.className = "modal-section modal-notes";
    const h = document.createElement("h3");
    h.textContent = "Notes";
    const body = document.createElement("div");
    body.className = "body";
    body.textContent = item.content.trim(); // plaintext; safe under CSP. Later: sanitize markdown HTML.
    notes.appendChild(h);
    notes.appendChild(body);
    right.appendChild(notes);
  }

  modal.appendChild(right);
  root.appendChild(modal);

  // open + lock scroll
  root.classList.add("is-open");
  document.body.classList.add("modal-open");
  root.setAttribute("aria-hidden", "false");

  // close handlers
  const close = () => {
    root.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
  };
  root.addEventListener("click", (e) => {
    if (e.target === root) close();
  });
  btn.addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  return close;
}
