const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  Notification,
} = require("electron");
const path = require("path");
const fs = require("fs").promises; // Use async file system
const matter = require("gray-matter");
const { pathToFileURL } = require("url");
const { scanVault } = require("./lib/vaultReader");

const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
let win;

// --- SINGLE INSTANCE LOCK ---
// Ensures only one instance of the app runs. This is the fix for the launch error.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine) => {
    // A second instance was attempted. Focus our window and handle the URL.
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
    // Use the robust app.getPath('userData') for the vault
    const vaultPath =
      process.env.MENHIR_VAULT || path.join(app.getPath("userData"), "vault");
    const title = params.get("title") || "Untitled Capture";
    const slug = `capture-${Date.now()}`;
    const frontmatter = { title, source: params.get("url"), tags: [] };
    const fileContents = matter.stringify("", frontmatter);
    const noteDir = path.join(vaultPath, "note");
    await fs.mkdir(noteDir, { recursive: true });
    const filePath = path.join(noteDir, `${slug}.md`);
    await fs.writeFile(filePath, fileContents, "utf8");

    new Notification({
      title: "Menhir",
      body: `✅ Captured "${title}"`,
    }).show();
    // Tell the renderer to refresh its data
    win?.webContents.send("vault:refresh-needed");
  } catch (e) {
    console.error("Failed to handle capture URL:", e);
  }
}
// --- End Capture Handler ---

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

ipcMain.handle("load-vault", async () => {
  const vaultPath =
    process.env.MENHIR_VAULT || path.join(app.getAppPath(), "vault");
  console.log("[main] load-vault path =", vaultPath);
  try {
    const items = await scanVault(vaultPath);
    console.log("[main] items =", items.length);
    return items;
  } catch (e) {
    console.error("[main] scan error", e);
    return []; // never reject — UI must render even if empty
  }
});

ipcMain.handle("get-image-path", (_e, { folder, filename }) => {
  return `local-resource://${folder}/${filename}`;
});

// WRITE (autosave) + BROADCAST
ipcMain.handle("save-item", async (_evt, payload) => {
  const vaultPath =
    process.env.MENHIR_VAULT || path.join(app.getAppPath(), "vault");
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

// In main.js

// In main.js

// In main.js

app.whenReady().then(() => {
  // Use the robust app.getPath() here as well
  const vaultPath =
    process.env.MENHIR_VAULT || path.join(app.getAppPath(), "vault");
  protocol.registerFileProtocol("local-resource", (request, callback) => {
    const url = request.url.replace("local-resource://", "");
    const filePath = path.join(vaultPath, url);
    callback(filePath);
  });

  // Handler for macOS
  app.on("open-url", (event, url) => {
    if (url.startsWith("menhir://")) {
      event.preventDefault();
      handleCaptureUrl(url);
    }
  });

  // Simplified protocol registration
  app.setAsDefaultProtocolClient("menhir");

  createWindow();
});
