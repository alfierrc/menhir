export function renderMarkdown(mdText) {
  const raw = window.marked.parse(mdText || "");
  const safe = window.DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  const el = document.createElement("div");
  el.className = "md";
  el.innerHTML = safe;
  return el;
}
