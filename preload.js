(() => {
  if (globalThis.__preloadDone) return;
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('api', {
    loadVault: () => ipcRenderer.invoke('load-vault'),
  });

  globalThis.__preloadDone = true;
  try { console.log('[preload] ready'); } catch {}
})();
