import { format, formatDistanceToNow } from "date-fns";

export function createInfoLine(item) {
  const infoContainer = document.createElement("div");
  infoContainer.className = "info-line";

  // --- Date Section ---
  const date = item.added || item.date;
  if (date) {
    const dateEl = document.createElement("span");
    dateEl.className = "info-date";

    const dateObj = new Date(date);

    // 1. Calculate both formats
    const relativeTime = formatDistanceToNow(dateObj, { addSuffix: true });
    const absoluteTime = format(dateObj, "d MMMM yyyy 'at' HH:mm");

    // 2. Set the initial text and store the other format
    dateEl.textContent = relativeTime;
    dateEl.dataset.absoluteTime = absoluteTime;

    // 3. Add a click listener to toggle the text
    dateEl.addEventListener("click", () => {
      const currentText = dateEl.textContent;
      // Swap the text content with the stored data attribute value
      dateEl.textContent = dateEl.dataset.absoluteTime;
      dateEl.dataset.absoluteTime = currentText;
    });

    dateEl.title = format(dateObj, "d MMMM yyyy 'at' HH:mm");

    infoContainer.appendChild(dateEl);
  }

  if (item.source) {
    const sourceLink = document.createElement("a");
    sourceLink.className = "info-source";
    sourceLink.href = item.source;
    sourceLink.target = "_blank"; // Open link in the user's default browser
    sourceLink.title = item.source; // Show full URL on hover

    // Create a span for the truncated text
    const sourceText = document.createElement("span");
    // Clean up the URL for display (remove protocol, etc.)
    sourceText.textContent = item.source.replace(/^(https?:\/\/)?(www\.)?/, "");

    // Create the "follow link" icon
    const sourceIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    sourceIcon.setAttribute("viewBox", "0 0 24 24");
    sourceIcon.innerHTML = `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>`;

    sourceLink.appendChild(sourceText);
    sourceLink.appendChild(sourceIcon);
    infoContainer.appendChild(sourceLink);
  }

  return infoContainer;
}
