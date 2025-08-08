import { marked } from "marked";
import DOMPurify from "dompurify";

export function renderMarkdown(mdText) {
  const raw = marked.parse(mdText || "");
  const safe = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  const el = document.createElement("div");
  el.className = "md";
  el.innerHTML = safe;
  return el;
}
