import { makeAutosaver } from "../autosave.js";

export function renderNoteView({ item, slots }) {
  const autosave = makeAutosaver({ item, statusEl: slots.status });

  // LEFT: big textarea for body
  slots.left.classList.add("note-left");
  const scroller = document.createElement("div");
  scroller.className = "modal-note-content";
  const ta = document.createElement("textarea");
  ta.value = item.content || "";
  Object.assign(ta.style, {
    width: "100%",
    minHeight: "60vh",
    border: "1px solid var(--rule)",
    borderRadius: "6px",
    padding: "10px",
    fontFamily: "inherit",
  });
  ta.addEventListener("input", () => autosave({ content: ta.value }));
  scroller.appendChild(ta);
  slots.left.appendChild(scroller);

  // RIGHT: editable title
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
  slots.header.innerHTML = "";
  slots.header.appendChild(titleInput);
  titleInput.addEventListener("input", () =>
    autosave({ title: titleInput.value })
  );

  // RIGHT: tags
  const kv = document.createElement("div");
  kv.className = "modal-section modal-kv";
  const kTags = document.createElement("div");
  kTags.className = "k";
  kTags.textContent = "tags";
  const vTags = document.createElement("input");
  vTags.type = "text";
  vTags.className = "v";
  vTags.value = Array.isArray(item.tags)
    ? item.tags.join(", ")
    : item.tags || "";
  Object.assign(vTags.style, {
    width: "100%",
    border: "1px solid var(--rule)",
    borderRadius: "4px",
    padding: "6px 8px",
  });
  vTags.addEventListener("input", () => autosave({ tags: vTags.value }));
  kv.appendChild(kTags);
  kv.appendChild(vTags);
  slots.body.appendChild(kv);
}
