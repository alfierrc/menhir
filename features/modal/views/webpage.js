import { makeAutosaver } from "../autosave.js";
import { renderTags } from "../components/TagEditor.js";

export function renderWebpageView({ item, slots }) {
  // LEFT: image as-is
  if (item.image) {
    const img = document.createElement("img");
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
    slots.left.appendChild(img);
    window.api.getImagePath(item.folder, item.image).then((src) => {
      img.src = src;
    });
  }

  const autosave = makeAutosaver({ item, statusEl: slots.status });

  // HEADER title (editable)
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.value = item.title || item.slug || "Untitled";
  titleInput.className = "modal-title-input";
  Object.assign(titleInput.style, {
    width: "100%",
    font: "inherit",
    border: "none",
    background: "transparent",
    color: "var(--ink)",
    outline: "none",
  });
  titleInput.addEventListener("input", () =>
    autosave({ title: titleInput.value })
  );
  slots.header.innerHTML = "";
  slots.header.appendChild(titleInput);

  // FRONTMATTER section (editable tags + readonly others)
  const kv = document.createElement("div");
  kv.className = "modal-section modal-kv";

  // --- tags ---
  renderTags({ item, autosave, container: kv });

  const skip = new Set([
    "slug",
    "folder",
    "type",
    "content",
    "image",
    "title",
    "tags",
    "sortTs",
    "date",
  ]);
  Object.entries(item).forEach(([k, v]) => {
    if (skip.has(k) || v == null || v === "") return;
    const kEl = document.createElement("div");
    kEl.className = "k";
    kEl.textContent = k;
    const vEl = document.createElement("div");
    vEl.className = "v";
    vEl.textContent = Array.isArray(v) ? v.join(", ") : String(v);
    kv.appendChild(kEl);
    kv.appendChild(vEl);
  });
  slots.body.appendChild(kv);

  // NOTES (editable textarea)
  const notes = document.createElement("div");
  notes.className = "modal-section modal-notes";
  const h = document.createElement("h3");
  h.textContent = "Notes";
  const ta = document.createElement("textarea");
  ta.value = item.content || "";
  Object.assign(ta.style, {
    width: "100%",
    minHeight: "140px",
    border: "1px solid var(--rule)",
    borderRadius: "6px",
    padding: "8px 10px",
    fontFamily: "inherit",
  });
  ta.addEventListener("input", () => autosave({ content: ta.value }));
  notes.appendChild(h);
  notes.appendChild(ta);
  slots.body.appendChild(notes);
}
