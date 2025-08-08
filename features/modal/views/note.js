import { renderMarkdown } from "../md.js";

export function renderNoteView({ item, slots }) {
  // LEFT: note content (markdown)
  slots.left.classList.add("note-left"); // <-- makes left pane white
  slots.left.innerHTML = "";

  const scroller = document.createElement("div");
  scroller.className = "modal-note-content";

  const content =
    item && item.content && item.content.trim()
      ? renderMarkdown(item.content)
      : (() => {
          const el = document.createElement("div");
          el.className = "md";
          el.style.opacity = "0.6";
          el.textContent = "(No content)";
          return el;
        })();

  scroller.appendChild(content);
  slots.left.appendChild(scroller);

  // RIGHT: header/title
  slots.header.textContent = item.title || item.slug || "Untitled";

  // RIGHT: frontmatter grid
  const skip = new Set(["slug", "folder", "type", "content", "image"]);
  const entries = Object.entries(item || {}).filter(
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
