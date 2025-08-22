// In features/modal/views/GenericView.js

import { makeAutosaver } from "../autosave.js";
import { renderTags } from "../components/TagEditor.js";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";

// This is our factory function
export function createGenericView(config = {}) {
  // It returns the actual view renderer function
  return function renderView({ item, slots, close, deleteBtn }) {
    const autosave = makeAutosaver({ item, statusEl: slots.status });

    // --- LEFT PANE (handled by config) ---
    if (config.leftPane === "editor") {
      const currentSetTheme =
        document.documentElement.getAttribute("data-theme");
      const prefersDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
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
      new Editor({
        el: editorElement,
        initialValue: item.content || "",
        previewStyle: "tab",
        initialEditType: "markdown",
        height: "100%",
        usageStatistics: false,
        hideModeSwitch: true,
        theme: editorTheme,
        events: {
          change: (e) => {
            autosave({ content: e.getMarkdown() });
          },
        },
      });
    } else if (config.leftPane === "image" && item.image) {
      const img = document.createElement("img");
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.objectFit = "contain";
      slots.left.appendChild(img);
      window.api.getImagePath(item.folder, item.image).then((src) => {
        img.src = src;
      });
    }

    // --- RIGHT PANE (common to all) ---
    // Editable Title
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = item.title || item.slug || "Untitled";
    titleInput.className = "modal-title-input";
    // Base styles are now in CSS, we only need JS for behavior
    titleInput.addEventListener("input", () =>
      autosave({ title: titleInput.value })
    );

    // Add focus/blur events to handle the ellipsis
    titleInput.addEventListener("focus", () => {
      titleInput.style.textOverflow = "clip";
    });
    titleInput.addEventListener("blur", () => {
      titleInput.style.textOverflow = "ellipsis";
    });

    slots.header.innerHTML = "";
    slots.header.appendChild(titleInput);

    // Metadata Section
    const kv = document.createElement("div");
    kv.className = "modal-section modal-kv";

    // Tags (using our component)
    renderTags({ item, autosave, container: kv });

    // Other Frontmatter Fields
    if (config.showOtherMetadata !== false) {
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
    }
    slots.body.appendChild(kv);

    // Notes Textarea
    if (config.showNotesField !== false) {
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

    // Delete Button Logic
    deleteBtn.addEventListener("click", () => {
      if (
        confirm(`Are you sure you want to delete "${item.title || item.slug}"?`)
      ) {
        window.api.deleteItem(item.type, item.slug).then((result) => {
          if (result.ok) {
            close();
          } else {
            alert(`Failed to delete: ${result.error}`);
          }
        });
      }
    });
  };
}
