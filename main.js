const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { scanVault } = require('./lib/vaultReader');

// Create window
function createWindow() {
  const win = new BrowserWindow({
  width: 1000,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,     // this should stay true
    enableRemoteModule: false,
    nodeIntegration: false,     // this should stay false
    sandbox: false              // 🔑 disable sandboxing so preload can use Node modules
  },
});

  win.loadFile('./app/index.html');
}

app.whenReady().then(createWindow);

// Expose scanVault to frontend via IPC
ipcMain.handle('load-vault', () => {
  const vaultPath = path.join(__dirname, 'vault');
  return scanVault(vaultPath);
});
