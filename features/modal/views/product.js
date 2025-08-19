import { makeAutosaver } from "../autosave.js";

export function renderProductView({ item, slots }) {
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

  // --- Create tag pills (or a placeholder) ---
  const kTags = document.createElement("div");
  kTags.className = "k";
  kTags.textContent = "tags";

  const vTagsContainer = document.createElement("div");
  vTagsContainer.className = "v tag-pills-container";

  if (item.tags && item.tags.length > 0) {
    const tags = Array.isArray(item.tags)
      ? item.tags
      : String(item.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

    for (const tag of tags) {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = tag;
      vTagsContainer.appendChild(pill);
    }
  } else {
    vTagsContainer.textContent = "—";
    vTagsContainer.style.color = "var(--ink-dim)";
  }
  kv.appendChild(kTags);
  kv.appendChild(vTagsContainer);

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
