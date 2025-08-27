export function createCardHeader(item) {
  const header = document.createElement("div");
  header.className = "item-header";

  const logMeta = document.createElement("div");
  logMeta.className = "log-meta";

  const title = document.createElement("div");
  title.className = "item-title";
  title.textContent = item.title || item.slug;

  // Add the new catalogue number
  const catalogueId = document.createElement("div");
  catalogueId.className = "item-catalogue-id";
  catalogueId.textContent = item.catalogueId || "N/A";

  logMeta.append(catalogueId, title);
  header.appendChild(logMeta);

  return header;
}
