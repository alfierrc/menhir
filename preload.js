(() => {
  if (globalThis.__preloadDone) return;
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('api', {
    loadVault: () => ipcRenderer.invoke('load-vault'),
    getImagePath: (folder, filename) => ipcRenderer.invoke('get-image-path', { folder, filename }),
  });

  globalThis.__preloadDone = true;
  try { console.log('[preload] ready'); } catch {}
})();