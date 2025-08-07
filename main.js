const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { scanVault } = require('./lib/vaultReader');
const { pathToFileURL } = require('url');

// existing ipcMain.handle('load-vault', ...) stays as-is

ipcMain.handle('get-image-path', (_e, { folder, filename }) => {
  const full = path.join(__dirname, 'vault', folder, filename);
  return pathToFileURL(full).href; // returns file:///... URL safe for <img src>
});

// Create window
function createWindow() {
  const win = new BrowserWindow({
  width: 1000,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    enableRemoteModule: false,
    nodeIntegration: false,
    sandbox: true
  }
});



  win.loadFile('./app/index.html');
}

app.whenReady().then(createWindow);

// Expose scanVault to frontend via IPC
ipcMain.handle('load-vault', () => {
  const vaultPath = path.join(__dirname, 'vault');
  return scanVault(vaultPath);
});
