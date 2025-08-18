const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");
const { pathToFileURL } = require("url");
const { scanVault } = require("./lib/vaultReader");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, "app", "index.html"));
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
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");
  const full = path.join(vaultPath, folder, filename);
  return pathToFileURL(full).href; // e.g., file:///Users/you/menhir/vault/image/foo.jpg
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

app.whenReady().then(createWindow);
