// preload.js
(() => {
  // If this file runs twice (hot reload, etc.), exit early
  if (globalThis.__menhirPreloadLoaded) return;

  // Keep Node built-ins out of here; only electron is allowed in sandboxed preload
  const electron = require('electron');
  const cb = electron.contextBridge;
  const ir = electron.ipcRenderer;

  // Optional: quick sanity log (you can remove later)
  try { console.log('[preload] loaded'); } catch {}

  contextBridge.exposeInMainWorld('api', {
    ping: () => 'pong',
    loadVault: () => ipcRenderer.invoke('load-vault'),
    getImagePath: (folder, filename) =>
      ipcRenderer.invoke('get-image-path', { folder, filename }),
    onVaultEvent: (cb) => {
      const handler = (_e, payload) => cb(payload);
      ipcRenderer.on('vault-event', handler);
      return () => ipcRenderer.removeListener('vault-event', handler);
    },
  });

  // Mark as loaded to avoid re-init on subsequent executions
  globalThis.__menhirPreloadLoaded = true;
})();
