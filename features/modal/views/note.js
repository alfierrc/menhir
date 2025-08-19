// In features/modal/views/note.js

import Editor from "@toast-ui/editor"; // Import the editor class from the npm package
import "@toast-ui/editor/dist/toastui-editor.css"; // Import the CSS for the bundler to handle
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import { makeAutosaver } from "../autosave.js";

export function renderNoteView({ item, slots }) {
  const autosave = makeAutosaver({ item, statusEl: slots.status });

  // --- LEFT: RENDER THE TOAST UI EDITOR ---
  // Correctly determine the theme based on the app's state
  const currentSetTheme = document.documentElement.getAttribute("data-theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const editorTheme =
    currentSetTheme === "dark" || (!currentSetTheme && prefersDark)
      ? "dark"
      : "light";

  slots.left.classList.add("note-left");
  const scroller = document.createElement("div");
  scroller.className = "modal-note-content";

  const editorElement = document.createElement("div");
  scroller.appendChild(editorElement);
  slots.left.appendChild(scroller);

  const editor = new Editor({
    el: editorElement,
    initialValue: item.content || "",
    previewStyle: "tab",
    initialEditType: "markdown",
    height: "100%",
    usageStatistics: false,
    hideModeSwitch: true,
    theme: editorTheme,
    events: {
      change: () => {
        const markdownContent = editor.getMarkdown();
        autosave({ content: markdownContent });
      },
    },
  });

  // --- RIGHT: EDITABLE TITLE AND TAGS (Remains the same) ---
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

  const vTagsContainer = document.createElement("div");
  vTagsContainer.className = "v tag-pills-container";

  // Check if there are tags to display
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
    // Add a placeholder if there are no tags
    vTagsContainer.textContent = "—";
    vTagsContainer.style.color = "var(--ink-dim)";
  }

  // Add the section to the modal body
  kv.appendChild(kTags);
  kv.appendChild(vTagsContainer);
  slots.body.appendChild(kv);
}
