const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { scanVault } = require('./lib/vaultReader');

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

ipcMain.removeHandler('load-vault');
ipcMain.handle('load-vault', async () => {
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, 'vault');
  console.log('[main] load-vault path =', vaultPath);
  try {
    const items = await scanVault(vaultPath);
    console.log('[main] items =', items.length);
    return items;
  } catch (e) {
    console.error('[main] scan error', e);
    return []; // never reject — UI must render even if empty
  }
});

app.whenReady().then(createWindow);
