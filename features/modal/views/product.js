export function renderProductView({ item, slots }) {
  // LEFT: image (contained, no scroll)
  if (item.image) {
    const img = document.createElement("img");
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
    slots.left.appendChild(img);
    window.api
      .getImagePath(item.folder, item.image)
      .then((src) => {
        img.src = src;
        if (img.decode) img.decode().catch(() => {});
      })
      .catch(() => {});
  }

  // HEADER: title text
  slots.header.textContent = item.title || item.slug || "Untitled";

  // FRONTMATTER (key-values), skipping internal fields
  const skip = new Set(["slug", "folder", "type", "content", "image"]);
  const entries = Object.entries(item).filter(
    ([k, v]) => !skip.has(k) && v != null && v !== ""
  );
  if (entries.length) {
    const kvWrap = document.createElement("div");
    kvWrap.className = "modal-section modal-kv";
    for (const [k, v] of entries) {
      const kEl = document.createElement("div");
      kEl.className = "k";
      kEl.textContent = k;
      const vEl = document.createElement("div");
      vEl.className = "v";
      let val = v;
      if (Array.isArray(v)) val = v.join(", ");
      else if (typeof v === "object") val = JSON.stringify(v);
      vEl.textContent = String(val);
      kvWrap.appendChild(kEl);
      kvWrap.appendChild(vEl);
    }
    slots.body.appendChild(kvWrap);
  }

  // NOTES (plain text for now; we can switch to markdown renderer later)
  if (item.content && item.content.trim()) {
    const notes = document.createElement("div");
    notes.className = "modal-section modal-notes";
    const h = document.createElement("h3");
    h.textContent = "Notes";
    const body = document.createElement("div");
    body.className = "body";
    body.textContent = item.content.trim(); // safe plaintext
    notes.appendChild(h);
    notes.appendChild(body);
    slots.body.appendChild(notes);
  }
}
