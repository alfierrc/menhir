import { renderGrid } from "../features/card-grid/index.js";

let allItems = [];
let filteredItems = [];
let isAnimating = false;
let currentFilter = "all";

// --- Helper functions ---
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
    if (!isAnimating) card.style.transform = "none";
  });
}

// --- Main Application Logic ---
window.addEventListener("DOMContentLoaded", async () => {
  // --- Get references to all DOM elements ---
  const grid = document.getElementById("grid");
  const spinner = document.getElementById("spinner");
  const filtersEl = document.getElementById("filters");
  const themeToggle = document.getElementById("themeToggle");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsPanel = document.getElementById("settings-panel");
  const vaultPathDisplay = document.getElementById("vaultPathDisplay");
  const changeVaultBtn = document.getElementById("changeVaultBtn");

  // --- Theme Logic ---
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    if (themeToggle) {
      const isDark =
        theme === "dark" ||
        (!theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
      themeToggle.setAttribute("aria-pressed", String(isDark));
    }
  }

  // Setup theme on initial load and for system changes
  const savedTheme = localStorage.getItem("menhir.theme");
  applyTheme(savedTheme);
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => {
      if (!localStorage.getItem("menhir.theme")) applyTheme(null);
    });
  }
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const systemDark = window.matchMedia?.(
        "(prefers-color-scheme: dark)"
      ).matches;
      const next = !current
        ? systemDark
          ? "light"
          : "dark"
        : current === "dark"
        ? "light"
        : "dark";
      localStorage.setItem("menhir.theme", next);
      applyTheme(next);
    });
  }

  // --- Settings Panel Logic ---
  window.api.getVaultPath().then((path) => {
    vaultPathDisplay.textContent = path;
  });
  settingsBtn.addEventListener("click", () => {
    settingsPanel.classList.toggle("is-open");
  });
  changeVaultBtn.addEventListener("click", async () => {
    const newPath = await window.api.changeVaultPath();
    if (newPath) {
      vaultPathDisplay.textContent = newPath;
      settingsPanel.classList.remove("is-open");
    }
  });
  window.addEventListener("click", (event) => {
    if (
      settingsPanel.classList.contains("is-open") &&
      !settingsPanel.contains(event.target) &&
      !settingsBtn.contains(event.target)
    ) {
      settingsPanel.classList.remove("is-open");
    }
  });

  // --- Main Data Loading and Event Listeners ---
  try {
    // Initial load
    allItems = await window.api.loadVault();
    allItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));
    filteredItems = [...allItems];
    grid.classList.add("catalog");
    await renderGrid(grid, filteredItems);
    if (spinner) spinner.setAttribute("aria-hidden", "true");

    // Listener for single item updates (from autosave)
    window.api.onItemUpdated((fresh) => {
      const idx = allItems.findIndex(
        (it) =>
          it.slug === fresh.slug &&
          (it.folder || it.type) === (fresh.folder || fresh.type)
      );
      if (idx >= 0) {
        allItems[idx] = { ...allItems[idx], ...fresh };
      } else {
        allItems.unshift(fresh);
      }
      filteredItems =
        currentFilter === "all"
          ? [...allItems]
          : allItems.filter(
              (it) =>
                (it.type || "").toLowerCase() === currentFilter.toLowerCase()
            );
      filteredItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));
      renderGrid(grid, filteredItems);
    });

    // Combined reload function for vault changes and external captures
    const reloadVault = async () => {
      allItems = await window.api.loadVault();
      allItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));
      filteredItems =
        currentFilter === "all"
          ? [...allItems]
          : allItems.filter(
              (it) =>
                (it.type || "").toLowerCase() === currentFilter.toLowerCase()
            );
      renderGrid(grid, filteredItems);
    };

    window.api.onVaultRefresh(async () => {
      console.log("RENDERER: Refresh signal received, reloading vault..."); // For debugging

      if (spinner) spinner.setAttribute("aria-hidden", "false");

      allItems = await window.api.loadVault();
      allItems.sort((a, b) => (b.sortTs || 0) - (a.sortTs || 0));

      const filter = currentFilter || "all";
      filteredItems =
        filter === "all"
          ? [...allItems]
          : allItems.filter(
              (it) => (it.type || "").toLowerCase() === filter.toLowerCase()
            );

      await renderGrid(grid, filteredItems);

      if (spinner) spinner.setAttribute("aria-hidden", "true");
    });

    // --- Filter Bar Logic (Consolidated)---
    if (filtersEl) {
      filtersEl
        .querySelector('button[data-filter="all"]')
        .classList.add("is-active");

      // Click handler
      filtersEl.addEventListener("click", async (e) => {
        if (!e.target.matches("button")) return;
        filtersEl.querySelector(".is-active")?.classList.remove("is-active");
        e.target.classList.add("is-active");
        const filter = e.target.getAttribute("data-filter");
        currentFilter = filter;
        filteredItems =
          filter === "all"
            ? [...allItems]
            : allItems.filter(
                (it) => (it.type || "").toLowerCase() === filter.toLowerCase()
              );
        await renderGrid(grid, filteredItems);
      });

      // Hover handler
      filtersEl.addEventListener("mouseover", (e) => {
        if (!e.target.matches("button")) return;
        if (isAnimating) return;
        const hoverFilter = e.target.getAttribute("data-filter");
        if (hoverFilter === currentFilter) return;
        if (currentFilter === "all") {
          setHoverPreview(grid, hoverFilter);
        } else {
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
  } catch (e) {
    console.error(e);
    if (spinner) spinner.setAttribute("aria-hidden", "true");
    grid.insertAdjacentHTML(
      "beforeend",
      '<div class="empty">Could not load vault.</div>'
    );
  }
});
