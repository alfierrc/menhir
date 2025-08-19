function debounce(fn, ms = 500) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function makeAutosaver({ item, statusEl }) {
  const showSaving = () => {
    if (!statusEl) return;
    statusEl.textContent = "Saving…";
    statusEl.classList.add("is-saving");
    statusEl.classList.remove("is-saved");
  };
  const showSaved = () => {
    if (!statusEl) return;
    statusEl.textContent = "Saved";
    statusEl.classList.remove("is-saving");
    statusEl.classList.add("is-saved");
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.classList.remove("is-saved");
    }, 1200);
  };

  const doSave = async (updates) => {
    try {
      // show immediate feedback while the save is in-flight
      showSaving();

      // call the existing IPC to write to disk
      await window.api.saveItem(item.type, item.slug, updates);

      // mirror the saved fields into the in-modal item so everything stays in sync
      Object.assign(item, updates);

      // show the "Saved" tick
      showSaved();
    } catch (e) {
      console.error("[autosave] failed", e);
      if (statusEl) statusEl.textContent = "Save failed";
    }
  };

  return debounce(doSave, 600); // save ~600ms after last keystroke
}
