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

  return infoContainer;
}
