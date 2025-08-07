// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, typed surface to the renderer.
// All real work happens in the main process via IPC.
contextBridge.exposeInMainWorld('api', {
  loadVault: () => ipcRenderer.invoke('load-vault'),
  saveItem: (item) => ipcRenderer.invoke('save-item', item),
  openItem: (id) => ipcRenderer.invoke('open-item', id),

  // live updates (we'll wire this in Phase 1 when we add chokidar)
  onVaultEvent: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('vault-event', handler);
    return () => ipcRenderer.removeListener('vault-event', handler);
  },
});
