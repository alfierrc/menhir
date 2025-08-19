"use strict";
const { app, BrowserWindow, ipcMain, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const matter = require("gray-matter");
const { pathToFileURL } = require("url");
const { scanVault } = require("./lib/vaultReader");
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
      sandbox: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
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
    return [];
  }
});
ipcMain.handle("get-image-path", (_e, { folder, filename }) => {
  return `local-resource://${folder}/${filename}`;
});
ipcMain.handle("save-item", async (_evt, payload) => {
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");
  const filePath = path.join(vaultPath, payload.type, `${payload.slug}.md`);
  if (!fs.existsSync(filePath)) throw new Error("File not found: " + filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const fm = matter(raw);
  const nextData = { ...fm.data };
  const { updates = {} } = payload;
  for (const [k, v] of Object.entries(updates)) {
    if (k === "content") continue;
    if (k === "tags") {
      nextData.tags = Array.isArray(v) ? v : String(v).split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      nextData[k] = v;
    }
  }
  const nextContent = updates.content != null ? String(updates.content) : fm.content;
  const out = matter.stringify(nextContent, nextData);
  fs.writeFileSync(filePath, out, "utf8");
  const reread = fs.readFileSync(filePath, "utf8");
  const parsed = matter(reread);
  const stat = fs.statSync(filePath);
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
    type: payload.type,
    // NOTE: your frontmatter `type` (singular) may also be present in parsed.data
    slug: payload.slug,
    ...parsed.data,
    // frontmatter can override `type` if you store singular here
    content: parsed.content || "",
    folder: payload.type,
    // the actual folder on disk
    sortTs,
    ...fmDate ? { date: fmDate.toISOString() } : {}
  };
  const wins = BrowserWindow.getAllWindows();
  for (const w of wins) {
    w.webContents.send("vault:item-updated", savedItem);
  }
  return { ok: true, item: savedItem, saved: Object.keys(updates) };
});
app.whenReady().then(() => {
  const vaultPath = process.env.MENHIR_VAULT || path.join(__dirname, "vault");
  protocol.registerFileProtocol("local-resource", (request, callback) => {
    const url = request.url.replace("local-resource://", "");
    const filePath = path.join(vaultPath, url);
    callback(filePath);
  });
  createWindow();
});
