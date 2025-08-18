const { contextBridge, ipcRenderer } = require("electron");

(() => {
  if (globalThis.__preloadDone) return;
  const { contextBridge, ipcRenderer } = require("electron");

  contextBridge.exposeInMainWorld("api", {
    loadVault: () => ipcRenderer.invoke("load-vault"),
    getImagePath: (folder, filename) =>
      ipcRenderer.invoke("get-image-path", { folder, filename }),
    saveItem: (type, slug, updates) =>
      ipcRenderer.invoke("save-item", { type, slug, updates }),
  });

  globalThis.__preloadDone = true;
  try {
    console.log("[preload] ready");
  } catch {}
})();
