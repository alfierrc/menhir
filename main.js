const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");
const { pathToFileURL } = require("url");
const { scanVault } = require("./lib/vaultReader");

// This variable will be set automatically by the Vite plugin during development
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

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

  // This is the crucial change:
  // Load from the Vite dev server in development, or load the built file in production
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // This path is for a production build, which you can configure later.
    // It's pointing to the expected output of your last vite.config.js
    win.loadFile(path.join(__dirname, "..", "dist", "app", "index.html"));
  }
}

ipcMain.handle("load-vault", async () => {
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");
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
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");
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

app.whenReady().then(() => {
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");

  // Register the new protocol to serve files from the vault
  protocol.registerFileProtocol("local-resource", (request, callback) => {
    const url = request.url.replace("local-resource://", "");
    const filePath = path.join(vaultPath, url);
    callback(filePath);
  });

  createWindow();
});
