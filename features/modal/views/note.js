export function renderNoteView({ item, slots }) {
  // No left pane content for now
  slots.left.textContent = "";

  // Header: title
  const title = document.createElement("h2");
  title.textContent = item.title || item.slug || "Untitled";
  slots.header.appendChild(title);

  // Body: content
  if (item.content) {
    const notes = document.createElement("div");
    notes.innerHTML = `<p>${item.content}</p>`;
    slots.body.appendChild(notes);
  }
}
