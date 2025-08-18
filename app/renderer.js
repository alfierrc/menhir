import { renderGrid } from "../features/card-grid/index.js";

let allItems = [];
let filteredItems = [];
let isAnimating = false; // <— block hover while animating

// at top of renderer.js (near isAnimating)
let currentFilter = "all";

// helpers (keep your versions; add the transform helpers)
function setHoverPreview(grid, filter) {
  if (isAnimating) return;
  grid.querySelectorAll(".wrapper").forEach((card) => {
    const t = card.dataset.type;
    card.style.opacity = filter === "all" || t === filter ? "1" : "0.2";
  });
}

function clearHoverPreview(grid) {
  grid.querySelectorAll(".wrapper").forEach((card) => {
    card.style.opacity = "1";
  });
}

function applyHoverScale(grid) {
  if (isAnimating) return;
  grid.querySelectorAll(".wrapper").forEach((card) => {
    card.style.transition = (card.style.transition || "").includes("transform")
      ? card.style.transition
      : "transform 120ms ease";
    card.style.transform = "scale(0.98)";
  });
}

function clearHoverScale(grid) {
  grid.querySelectorAll(".wrapper").forEach((card) => {
    // only clear if not in the middle of a FLIP
    if (!isAnimating) card.style.transform = "none";
  });
}

// --- FLIP helpers ---
function capturePositions(gridEl) {
  const map = new Map();
  gridEl.querySelectorAll(".wrapper[data-key]").forEach((el) => {
    map.set(el.dataset.key, el.getBoundingClientRect());
  });
  return map;
}

function animateFlip(gridEl, beforeRects) {
  const wrappers = Array.from(gridEl.querySelectorAll(".wrapper[data-key]"));

  // invert
  wrappers.forEach((el) => {
    const key = el.dataset.key;
    const before = beforeRects.get(key);
    if (!before) {
      // new element: start from small+transparent
      el.classList.add("is-entering");
      el.style.opacity = "0";
      el.style.transform = "scale(0.96)";
      return;
    }
    const after = el.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    if (dx || dy) {
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  });

  // play
  requestAnimationFrame(() => {
    wrappers.forEach((el) => {
      if (el.classList.contains("is-entering")) {
        // allow initial styles to apply, then reveal
        requestAnimationFrame(() => {
          el.style.transition = "transform 1000ms ease, opacity 200ms ease";
          el.classList.remove("is-entering");
          el.style.opacity = "1";
          el.style.transform = "none";
        });
      } else {
        el.style.transform = "none";
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("grid");
  const spinner = document.getElementById("spinner");
  const filtersEl = document.getElementById("filters"); // your buttons container

  const themeToggle = document.getElementById("themeToggle");

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme"); // fall back to system
    }
    // update button label/state
    if (themeToggle) {
      const isDark =
        theme === "dark" ||
        (!theme &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      themeToggle.textContent = isDark ? "Light" : "Dark";
      themeToggle.setAttribute("aria-pressed", String(isDark));
    }
  }

  // initial theme: saved -> system
  const saved = localStorage.getItem("menhir.theme"); // "dark" | "light" | null
  applyTheme(saved);

  // react to system changes only when not explicitly set
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => {
      if (!localStorage.getItem("menhir.theme")) applyTheme(null);
    });
  }

  // toggle click handler
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme"); // "dark" | "light" | null
      let next;
      if (!current) {
        // currently following system — flip to the opposite explicitly
        const systemDark =
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
        next = systemDark ? "light" : "dark";
      } else {
        next = current === "dark" ? "light" : "dark";
      }
      localStorage.setItem("menhir.theme", next);
      applyTheme(next);
    });
  }

  try {
    // load + sort newest → oldest
    allItems = await window.api.loadVault();
    allItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));
    filteredItems = [...allItems];

    // catalog class (for your CSS)
    grid.classList.add("catalog");

    // initial render
    await renderGrid(grid, filteredItems);
    if (spinner) spinner.setAttribute("aria-hidden", "true");

    // listen for local updates emitted by the modal autosaver and apply them to my arrays
    window.addEventListener("menhir:item-updated", (ev) => {
      const { folder, slug, updates } = ev.detail || {};
      if (!folder || !slug) return;

      // find the item in allItems by (folder, slug)
      const idx = allItems.findIndex(
        (it) => (it.folder || it.type) === folder && it.slug === slug
      );
      if (idx === -1) return;

      // merge only the changed fields to preserve everything else (e.g., sortTs)
      allItems[idx] = { ...allItems[idx], ...updates };

      // rebuild the filtered view using the currently selected filter
      const active = (currentFilter || "all").toLowerCase();
      filteredItems =
        active === "all"
          ? [...allItems]
          : allItems.filter((it) => (it.type || "").toLowerCase() === active);

      // keep newest → oldest ordering
      filteredItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));

      // re-render; existing nodes will be reused and updated by the grid (see step 3)
      renderGrid(grid, filteredItems);
    });

    // 🔁 Live update when any item is saved
    if (window.api?.onItemUpdated) {
      window.api.onItemUpdated((fresh) => {
        // Merge into allItems by slug+folder (stable identity in your app)
        const match = (it) =>
          it.slug === fresh.slug &&
          (it.folder || it.type) === (fresh.folder || fresh.type);

        const idx = allItems.findIndex(match);
        if (idx >= 0) {
          allItems[idx] = { ...allItems[idx], ...fresh };
        } else {
          allItems.unshift(fresh); // new item? unlikely from autosave, but safe
        }

        // Recompute the filtered view using the active filter
        const active = (currentFilter || "all").toLowerCase();
        filteredItems =
          active === "all"
            ? [...allItems]
            : allItems.filter((it) => (it.type || "").toLowerCase() === active);

        // Keep your newest → oldest ordering
        filteredItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));

        // Re-render grid (renderGrid preserves/flips nodes smoothly)
        renderGrid(grid, filteredItems);
      });
    }

    // hover preview fade (optional; remove if you already did this elsewhere)
    if (filtersEl) {
      filtersEl.addEventListener("mouseover", (e) => {
        if (!e.target.matches("button")) return;
        if (isAnimating) return;
        const hoverFilter = e.target.getAttribute("data-filter");
        if (hoverFilter === currentFilter) return;

        if (currentFilter === "all") {
          // classic preview: dim non-matching
          setHoverPreview(grid, hoverFilter);
        } else {
          // when a specific filter is active, just scale everything slightly
          applyHoverScale(grid);
        }
      });

      filtersEl.addEventListener("mouseout", () => {
        if (isAnimating) return;
        if (currentFilter === "all") {
          clearHoverPreview(grid);
        } else {
          clearHoverScale(grid);
        }
      });
    }

    // click → filter with FLIP
    if (filtersEl) {
      filtersEl.addEventListener("click", async (e) => {
        if (!e.target.matches("button")) return;
        const filter = e.target.getAttribute("data-filter");

        currentFilter = filter; // <-- track active filter
        isAnimating = true;
        clearHoverPreview(grid);
        clearHoverScale(grid);

        grid.classList.add("animating"); // (you already use this in FLIP CSS)

        // 1) capture BEFORE rects
        const beforeRects = capturePositions(grid); // your helper

        // 2) compute filtered
        filteredItems =
          filter === "all"
            ? [...allItems]
            : allItems.filter(
                (it) => (it.type || "").toLowerCase() === filter.toLowerCase()
              );

        // 3) re-render (using your reconciler version of renderGrid if you added it)
        await renderGrid(grid, filteredItems);

        // 4) FLIP animate
        // disable transitions first
        grid.querySelectorAll(".wrapper").forEach((el) => {
          el.style.transition = "none";
        });
        const afterRects = capturePositions(grid);
        grid.querySelectorAll(".wrapper").forEach((el) => {
          const key = el.dataset.key;
          const before = beforeRects.get(key);
          const after = afterRects.get(key);
          if (before) {
            const dx = before.left - after.left;
            const dy = before.top - after.top;
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            el.style.opacity = "1"; // ensure no residual .2 from hover
          } else {
            // entering
            el.style.transform = "scale(0.96)";
            el.style.opacity = "0";
          }
        });

        // force reflow
        // eslint-disable-next-line no-unused-expressions
        grid.offsetHeight;

        // play
        grid.querySelectorAll(".wrapper").forEach((el) => {
          el.style.transition = "transform 500ms ease, opacity 200ms ease";
          el.style.transform = "none";
          el.style.opacity = "1";
        });

        // 🔓 re-enable hover after animation ends
        setTimeout(() => {
          grid.querySelectorAll(".wrapper").forEach((el) => {
            el.style.transition = "";
          });
          grid.classList.remove("animating");
          isAnimating = false;
        }, 320);
      });
    }
  } catch (e) {
    console.error(e);
    if (spinner) spinner.setAttribute("aria-hidden", "true");
    grid.insertAdjacentHTML(
      "beforeend",
      '<div class="empty">Could not load vault.</div>'
    );
  }
});
