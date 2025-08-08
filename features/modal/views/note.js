export function renderNoteView({ item, slots }) {
  // LEFT: Note content
  const noteWrap = document.createElement("div");
  noteWrap.className = "modal-note-content";

  if (item.content && item.content.trim()) {
    // For now: safe plain text (markdown renderer can be added later)
    const body = document.createElement("div");
    body.className = "md"; // reuse .md styles from other modals if you have them
    body.textContent = item.content.trim();
    noteWrap.appendChild(body);
  } else {
    const empty = document.createElement("div");
    empty.className = "md";
    empty.style.opacity = 0.5;
    empty.textContent = "(No content)";
    noteWrap.appendChild(empty);
  }

  slots.left.appendChild(noteWrap);

  // HEADER: title
  slots.header.textContent = item.title || item.slug || "Untitled";

  // FRONTMATTER: key–value list
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
}
