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

  cb.exposeInMainWorld('api', {
    ping: () => 'pong',
    loadVault: () => ir.invoke('load-vault'),
    saveItem: (item) => ipcRenderer.invoke('save-item', item),
    getImagePath: (folder, filename) =>
      ir.invoke('get-image-path', { folder, filename }),
    onVaultEvent: (cb) => {
      const handler = (_e, payload) => cb(payload);
      ir.on('vault-event', handler);
      return () => ir.removeListener('vault-event', handler);
    },
  });

  // Mark as loaded to avoid re-init on subsequent executions
  globalThis.__menhirPreloadLoaded = true;
})();
