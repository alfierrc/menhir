// In features/modal/views/GenericView.js

import { makeAutosaver } from "../autosave.js";
import { renderTags } from "../components/TagEditor.js";
import Editor from "@toast-ui/editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import "@toast-ui/editor/dist/theme/toastui-editor-dark.css";
import { createInfoLine } from "../components/InfoLine.js"; //

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
            autosave({ content: editor.getMarkdown() });
          },
        },
      });
    } else if (config.leftPane === "reader") {
      slots.left.innerHTML = ""; // Clear the pane first
      slots.left.classList.add("note-left", "article-reader-view");

      // --- ADD THIS BLOCK ---
      // Add cover image if it exists
      if (item.image) {
        const imageContainer = document.createElement("div");
        imageContainer.className = "reader-image-container";
        const img = document.createElement("img");
        window.api.getImagePath(item.folder, item.image).then((src) => {
          img.src = src;
        });
        imageContainer.appendChild(img);
        slots.left.appendChild(imageContainer);
      }

      // Create a dedicated header for the reader view
      const readerHeader = document.createElement("header");
      readerHeader.className = "reader-header";

      const readerTitle = document.createElement("h1");
      readerTitle.className = "reader-title";
      readerTitle.textContent = item.title;
      readerHeader.appendChild(readerTitle);

      // Add author (byline) and site name if they exist
      if (item.byline || item.siteName) {
        const readerMeta = document.createElement("div");
        readerMeta.className = "reader-meta";
        const bylineText = item.byline ? `By ${item.byline}` : "";
        const siteNameText = item.siteName
          ? `${item.byline ? " • " : ""}${item.siteName}`
          : "";
        readerMeta.textContent = bylineText + siteNameText;
        readerHeader.appendChild(readerMeta);
      }

      // Create a container for the actual article content
      const articleContent = document.createElement("div");
      articleContent.className = "article-body";
      articleContent.innerHTML = item.content;

      // Append the new header and the content to the left pane
      slots.left.appendChild(readerHeader);
      slots.left.appendChild(articleContent);
    } else if (config.leftPane === "image" && item.image) {
      if (item.type === "webpage") {
        slots.left.classList.add("webpage-left");
      }
      const img = document.createElement("img");
      if (item.type !== "webpage") {
        img.style.maxWidth = "100%";
        img.style.maxHeight = "100%";
        img.style.objectFit = "contain";
      }
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

    // Add the new info line for date and source
    const infoLine = createInfoLine(item);
    slots.header.appendChild(infoLine);

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
        "added",
        "source",
        "price",
        "currency",
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

    // --- Footer Logic ---
    // "See All Properties" Button
    const allPropsBtn = document.createElement("button");
    allPropsBtn.className = "modal-props-btn";
    allPropsBtn.textContent = "Properties";

    const yamlContainer = document.createElement("div");
    yamlContainer.className = "modal-yaml-container";
    const yamlPre = document.createElement("pre");

    // Create the YAML string from the item's data
    const frontmatter = { ...item };
    delete frontmatter.content; // Exclude the main content body
    yamlPre.textContent = Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
      .join("\n");

    yamlContainer.appendChild(yamlPre);
    slots.body.appendChild(yamlContainer); // Add the hidden container

    allPropsBtn.addEventListener("click", () => {
      yamlContainer.classList.toggle("is-open");
    });

    // Add the new button to the footer
    const footer = deleteBtn.parentElement;
    footer.insertBefore(allPropsBtn, deleteBtn);

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
