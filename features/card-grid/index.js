import { createImageCard } from "./components/ImageCard.js";
import { createProductCard } from "./components/ProductCard.js";
import { createNoteCard } from "./components/NoteCard.js";
import { createWebpageCard } from "./components/WebpageCard.js";
import DOMPurify from "dompurify";

const buildByType = {
  image: createImageCard,
  product: createProductCard,
  note: createNoteCard,
  webpage: createWebpageCard,
};

function getKey(item) {
  const t = (item.type || "unknown").toLowerCase();
  const s = item.slug || item.title || "";
  return `${t}:${s}`;
}

function captureRects(grid) {
  const map = new Map();
  grid.querySelectorAll(".wrapper[data-key]").forEach((el) => {
    map.set(el.dataset.key, el.getBoundingClientRect());
  });
  return map;
}

function ensureNodeForItem(item) {
  const build = buildByType[item.type] || createNoteCard;
  const node = build(item); // returns .wrapper
  node.dataset.key = node.dataset.key || getKey(item);
  node.dataset.type = node.dataset.type || (item.type || "").toLowerCase();
  return node;
}

function updateNodeForItem(node, item) {
  // refresh header title/date if they're present on the card
  const meta = node.querySelector(".log-meta");
  if (meta && meta.children && meta.children.length >= 2) {
    const titleEl = meta.children[0];
    const dateEl = meta.children[1];
    if (titleEl) titleEl.textContent = item.title || item.slug || "";
    if (dateEl) dateEl.textContent = item.date || "";
  }

  // refresh the dataset so click handlers can read the latest item if needed
  try {
    node.dataset.item = JSON.stringify(item);
  } catch {}

  // If this is a NOTE card, recompute the excerpt text
  if ((item.type || "").toLowerCase() === "note") {
    const ex = node.querySelector(".note-excerpt");
    if (ex) {
      if (item.content) {
        // 1. Sanitize first to strip any potential HTML tags
        const sanitized = DOMPurify.sanitize(item.content, {
          ALLOWED_TAGS: [],
        });
        // 2. Then remove markdown characters
        const clean = sanitized.replace(/[#*_>\-`]/g, "").trim();
        const maxLength = 140;
        let truncated = clean;
        if (clean.length > maxLength) {
          truncated = clean.substring(0, maxLength) + "…";
        }
        ex.textContent = truncated;
      } else {
        ex.textContent = item.title || item.slug || "Note";
      }
    }
  }
}

function playFlipSimple(grid, beforeRects) {
  const nodes = Array.from(grid.querySelectorAll(".wrapper[data-key]"));

  // Invert: place shared nodes back to their old position
  nodes.forEach((el) => {
    const prev = beforeRects.get(el.dataset.key);
    if (!prev) return; // new node handled separately
    const now = el.getBoundingClientRect();
    const dx = prev.left - now.left;
    const dy = prev.top - now.top;
    if (dx || dy) el.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  // Force layout so transforms take effect
  // eslint-disable-next-line no-unused-expressions
  grid.offsetHeight;

  // Play: existing nodes animate position only; new ones also fade in
  nodes.forEach((el) => {
    const isEntering = el.classList.contains("is-entering");
    el.style.transition = isEntering
      ? "transform 280ms ease, opacity 200ms ease"
      : "transform 280ms ease";
    el.style.transform = "none";
    if (isEntering) el.style.opacity = "1";
  });

  // Cleanup inline styles
  setTimeout(() => {
    nodes.forEach((el) => {
      el.style.transition = "";
      el.classList.remove("is-entering");
    });
  }, 320);
}

/**
 * Reconcile grid to `items` order.
 * - Reuse existing nodes by key
 * - New nodes fade/scale in
 * - Removed nodes are just removed (no exit anim)
 * - Existing nodes glide to new positions (FLIP)
 */
export async function renderGrid(grid, items) {
  const beforeRects = captureRects(grid);

  // Index current nodes
  const current = new Map();
  grid.querySelectorAll(".wrapper[data-key]").forEach((el) => {
    current.set(el.dataset.key, el);
  });

  // Build fragment in desired order, reusing nodes
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const key = getKey(item);
    let el = current.get(key);
    if (el) {
      // reusing an existing node; update its inner DOM to reflect the new data
      el.style.transition = "none";
      updateNodeForItem(el, item);
    } else {
      el = ensureNodeForItem(item);
      // entering state
      el.style.opacity = "0";
      el.style.transform = "scale(0.96)";
      el.classList.add("is-entering");
    }
    frag.appendChild(el);
  }

  // Swap DOM
  grid.innerHTML = "";
  grid.appendChild(frag);

  // FLIP position animation + reveal enters
  playFlipSimple(grid, beforeRects);
}
