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
    saveItem: (item) => ir.invoke('save-item', item),
    onVaultEvent: (cb2) => {
      const handler = (_e, payload) => cb2(payload);
      ir.on('vault-event', handler);
      return () => ir.removeListener('vault-event', handler);
    },
  });

  // Mark as loaded to avoid re-init on subsequent executions
  globalThis.__menhirPreloadLoaded = true;
})();
