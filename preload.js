const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('vaultAPI', {
  loadVault: () => ipcRenderer.invoke('load-vault'),
  getImagePath: (folder, filename) => {
    const fullPath = path.join(__dirname, 'vault', folder, filename);
    return `file://${fullPath}`;
  }
});
