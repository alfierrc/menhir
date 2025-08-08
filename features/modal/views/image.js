export function renderImageView({ item, slots }) {
  // Left pane = image
  const img = document.createElement("img");
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.objectFit = "contain";
  slots.left.appendChild(img);

  window.api
    .getImagePath(item.folder, item.image)
    .then((src) => (img.src = src));

  // Header: title
  const title = document.createElement("h2");
  title.textContent = item.title || item.slug || "Untitled";
  slots.header.appendChild(title);

  // Body: frontmatter
  if (item.frontmatter) {
    const fm = document.createElement("pre");
    fm.textContent = JSON.stringify(item.frontmatter, null, 2);
    slots.body.appendChild(fm);
  }

  // Body: notes
  if (item.content) {
    const notes = document.createElement("div");
    notes.innerHTML = `<h3>Notes</h3><p>${item.content}</p>`;
    slots.body.appendChild(notes);
  }
}
