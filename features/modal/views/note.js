// In features/modal/views/note.js

import Editor from "@toast-ui/editor"; // Import the editor class from the npm package
import "@toast-ui/editor/dist/toastui-editor.css"; // Import the CSS for the bundler to handle
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import { makeAutosaver } from "../autosave.js";
import { renderTags } from "../components/TagEditor.js";

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
  renderTags({ item, autosave, container: kv });
  slots.body.appendChild(kv);

  // Add the section to the modal body
  kv.appendChild(kTags);
  kv.appendChild(vTagsContainer);
  slots.body.appendChild(kv);
}
