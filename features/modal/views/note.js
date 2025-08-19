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
