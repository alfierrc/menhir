const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');

// 1. Function to scan vault folders
function scanVault(vaultDir) {
  const contentTypes = fs.readdirSync(vaultDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const allItems = [];

  for (const type of contentTypes) {
    const typeDir = path.join(vaultDir, type);
    const files = fs.readdirSync(typeDir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(typeDir, file);
        const slug = path.basename(file, '.md');

        const raw = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter, content } = matter(raw);

        allItems.push({
          type,
          slug,
          ...frontmatter,
          content,
          folder: `${type}`,  // we'll use this for image path
        });
      }
    }
  }

  return allItems;
}

// 2. Create window
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

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// 3. Expose scanVault to frontend via IPC
ipcMain.handle('load-vault', () => {
  const vaultPath = path.join(__dirname, 'vault');
  return scanVault(vaultPath);
});
