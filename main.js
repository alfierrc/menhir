const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
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

// WRITE (autosave)
ipcMain.handle("save-item", async (_evt, payload) => {
  // payload: { type, slug, updates: { title?, tags?, content?, ... } }
  const vaultPath = path.join(__dirname, "vault");
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

  return {
    ok: true,
    type: payload.type,
    slug: payload.slug,
    saved: Object.keys(updates),
  };
});

app.whenReady().then(createWindow);
