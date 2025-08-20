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
    onItemUpdated: (cb) =>
      ipcRenderer.on("vault:item-updated", (_e, item) => cb(item)),
    onVaultRefresh: (cb) => ipcRenderer.on("vault:refresh-needed", () => cb()),
    getVaultPath: () => ipcRenderer.invoke("get-vault-path"),
    changeVaultPath: () => ipcRenderer.invoke("change-vault-path"),
  });
})();
