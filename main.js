const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  Notification,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const matter = require("gray-matter");
const Store = require("electron-store").default;
const { scanVault } = require("./lib/vaultReader");

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const store = new Store();
let win;
let vaultPath;

// --- SINGLE INSTANCE LOCK ---
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
    if (win) {
      const url = commandLine.find((arg) => arg.startsWith("menhir://"));
      if (url) {
        handleCaptureUrl(url);
      }
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// --- CAPTURE HANDLER ---
async function handleCaptureUrl(captureUrl) {
  try {
    const url = new URL(captureUrl);
    const params = url.searchParams;
    const title = params.get("title") || "Untitled Capture";
    const slug = `capture-${Date.now()}`;
    const frontmatter = { title, source: params.get("url"), tags: [] };
    const fileContents = matter.stringify("", frontmatter);
    const noteDir = path.join(vaultPath, "note");
    await fsp.mkdir(noteDir, { recursive: true });
    const filePath = path.join(noteDir, `${slug}.md`);
    await fsp.writeFile(filePath, fileContents, "utf8");
    new Notification({
      title: "Menhir",
      body: `✅ Captured "${title}"`,
    }).show();
    win?.webContents.send("vault:refresh-needed");
  } catch (e) {
    console.error("Failed to handle capture URL:", e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      // The path to the preload script is handled correctly by the Vite plugin
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // The main entry point is now the server root
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // The built HTML will now be at dist/index.html
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// tell the renderer where the vault is
ipcMain.handle("get-vault-path", () => {
  return vaultPath;
});

// allow the user to select a new vault
ipcMain.handle("change-vault-path", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Select New Vault Folder",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }

  const newPath = filePaths[0];
  store.set("vaultPath", newPath);
  vaultPath = newPath;

  // Send the refresh signal, just like the capture handler
  win?.webContents.send("vault:refresh-needed");

  return newPath;
});

ipcMain.handle("load-vault", async () => {
  if (!vaultPath) return []; // Don't try to load if a vault hasn't been set
  console.log("[main] load-vault path =", vaultPath);
  try {
    const items = await scanVault(vaultPath);
    return items;
  } catch (e) {
    console.error("[main] scan error", e);
    return [];
  }
});

ipcMain.handle("get-image-path", (_e, { folder, filename }) => {
  return `local-resource://${folder}/${filename}`;
});

// WRITE (autosave) + BROADCAST
ipcMain.handle("save-item", async (_evt, payload) => {
  const filePath = path.join(vaultPath, payload.type, `${payload.slug}.md`);
  if (!fs.existsSync(filePath)) throw new Error("File not found: " + filePath);

  const raw = fs.readFileSync(filePath, "utf8");
  const fm = matter(raw);

  // merge frontmatter
  const nextData = { ...fm.data };
  const { updates = {} } = payload;
  for (const [k, v] of Object.entries(updates)) {
    if (k === "content") continue; // body handled below
    if (k === "tags") {
      nextData.tags = Array.isArray(v)
        ? v
        : String(v)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    } else {
      nextData[k] = v;
    }
  }

  const nextContent =
    updates.content != null ? String(updates.content) : fm.content;
  const out = matter.stringify(nextContent, nextData);
  fs.writeFileSync(filePath, out, "utf8");

  // ---- Re-read the saved file to produce a normalized item like scanVault() ----
  const reread = fs.readFileSync(filePath, "utf8");
  const parsed = matter(reread);
  const stat = fs.statSync(filePath);

  // same sortTs/date logic as lib/vaultReader.js
  function parseFrontmatterDate(data) {
    const cand = data?.date || data?.created || data?.added || data?.updated;
    if (!cand) return null;
    const d = new Date(cand);
    return isNaN(d.getTime()) ? null : d;
  }
  const fmDate = parseFrontmatterDate(parsed.data);
  const sortTs = fmDate ? fmDate.getTime() : stat.mtimeMs;

  const savedItem = {
    // Keep folder/path as used above so the grid keeps working
    type: payload.type, // NOTE: your frontmatter `type` (singular) may also be present in parsed.data
    slug: payload.slug,
    ...parsed.data, // frontmatter can override `type` if you store singular here
    content: parsed.content || "",
    folder: payload.type, // the actual folder on disk
    sortTs,
    ...(fmDate ? { date: fmDate.toISOString() } : {}),
  };

  // Broadcast to all renderer windows so UI updates immediately
  const wins = BrowserWindow.getAllWindows();
  for (const w of wins) {
    w.webContents.send("vault:item-updated", savedItem);
  }

  // Also return to the invoker (modal autosave)
  return { ok: true, item: savedItem, saved: Object.keys(updates) };
});

app.whenReady().then(async () => {
  // 1. Check for a saved vault path
  let savedPath = store.get("vaultPath");

  // 2. If no valid path is saved, prompt the user to select one
  if (!savedPath || !fs.existsSync(savedPath)) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select Vault Folder",
      buttonLabel: "Use This Folder",
      properties: ["openDirectory", "createDirectory"],
    });

    if (canceled || filePaths.length === 0) {
      // If the user cancels, the app can't continue.
      app.quit();
      return;
    }

    savedPath = filePaths[0];
    store.set("vaultPath", savedPath); // Save the choice for future launches
  }

  // 3. Set the global vaultPath for the rest of the app to use
  vaultPath = savedPath;

  // 4. Now, run the rest of your original startup logic
  protocol.registerFileProtocol("local-resource", (request, callback) => {
    const url = request.url.replace("local-resource://", "");
    const filePath = path.join(vaultPath, url);
    callback(filePath);
  });

  app.on("open-url", (event, url) => {
    if (url.startsWith("menhir://")) {
      event.preventDefault();
      handleCaptureUrl(url);
    }
  });

  app.setAsDefaultProtocolClient("menhir");

  createWindow();
});
