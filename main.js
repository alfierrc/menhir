const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  Notification,
  dialog,
} = require("electron");
const path = require("path");
const fs = require("fs"); // For sync methods
const fsp = require("fs").promises; // For async methods
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
    // Helper function to create a filename-safe "slug" from a title
    function slugify(text) {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars except -
        .replace(/\-\-+/g, "-") // Replace multiple - with single -
        .substring(0, 50); // Truncate to a reasonable length
    }

    const url = new URL(captureUrl);
    const params = url.searchParams;

    const itemType = params.get("type") || "webpage";
    const title = params.get("title") || "Untitled Capture";

    const timestamp = Date.now();
    const catalogueId = `${itemType.toUpperCase().substring(0, 4)}-${timestamp
      .toString()
      .slice(-6)}`;

    // 1. Create the new, human-readable slug
    const slug = `${slugify(title)}-${Date.now()}`;

    let frontmatter = {
      catalogueId: catalogueId,
      title: title,
      added: new Date().toISOString(), // 3. Add the timestamp here
    };
    if (params.has("source")) frontmatter.source = params.get("source");
    if (params.has("price")) frontmatter.price = params.get("price");
    if (params.has("currency")) frontmatter.currency = params.get("currency");
    if (params.has("vendor")) frontmatter.vendor = params.get("vendor");

    // 2. --- Image Downloading Logic ---
    if (params.has("image")) {
      const imageUrl = params.get("image");
      console.log(`Attempting to download image: ${imageUrl}`);
      try {
        const response = await fetch(imageUrl); // Use Node's built-in fetch
        if (response.ok) {
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          // Create a unique filename for the image based on the item's slug
          const extension = path.extname(new URL(imageUrl).pathname) || ".jpg";
          const imageFilename = `${slug}${extension}`;
          const saveDir = path.join(vaultPath, itemType);

          await fsp.mkdir(saveDir, { recursive: true });
          await fsp.writeFile(path.join(saveDir, imageFilename), imageBuffer);

          // Save the *local* filename to the frontmatter, not the original URL
          frontmatter.image = imageFilename;
          console.log(`Successfully saved image as: ${imageFilename}`);
        }
      } catch (imgErr) {
        console.error("Failed to download image:", imgErr);
        // If download fails, save the original URL as a fallback
        frontmatter.image = imageUrl;
      }
    }

    const fileContents = matter.stringify("", frontmatter);
    const saveDir = path.join(vaultPath, itemType);

    await fsp.mkdir(saveDir, { recursive: true });
    const filePath = path.join(saveDir, `${slug}.md`);
    await fsp.writeFile(filePath, fileContents, "utf8");

    new Notification({
      title: "Menhir",
      body: `✅ Captured "${title}" as ${itemType}`,
    }).show();
    win?.webContents.send("vault:refresh-needed");
  } catch (e) {
    console.error("Failed to handle capture URL:", e);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// --- IPC Handlers ---
ipcMain.handle("get-vault-path", () => vaultPath);

ipcMain.handle("change-vault-path", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: "Select New Vault Folder",
    properties: ["openDirectory", "createDirectory"],
  });
  if (canceled || filePaths.length === 0) return null;

  const newPath = filePaths[0];
  store.set("vaultPath", newPath);
  vaultPath = newPath;
  win?.webContents.send("vault:refresh-needed");
  return newPath;
});

ipcMain.handle("load-vault", async () => {
  if (!vaultPath) return [];
  return scanVault(vaultPath);
});

ipcMain.handle("get-image-path", (_e, { folder, filename }) => {
  return `local-resource://${folder}/${filename}`;
});

ipcMain.handle("save-item", async (_evt, payload) => {
  if (!vaultPath) throw new Error("Vault path is not set.");
  const filePath = path.join(vaultPath, payload.type, `${payload.slug}.md`);

  try {
    const raw = await fsp.readFile(filePath, "utf8");
    const { data: currentData, content: currentContent } = matter(raw);

    // Combine the old and new data
    const nextData = { ...currentData, ...payload.updates };
    const nextContent =
      payload.updates.content !== undefined
        ? payload.updates.content
        : currentContent;

    // Ensure tags are always a clean array
    if (nextData.tags) {
      nextData.tags = Array.isArray(nextData.tags)
        ? nextData.tags
        : String(nextData.tags)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    // Write the updated file to disk
    const out = matter.stringify(nextContent, nextData);
    await fsp.writeFile(filePath, out, "utf8");

    // Get file stats for sorting
    const stat = await fsp.stat(filePath);
    const fmDate = new Date(nextData.added || nextData.date || stat.mtime);
    const sortTs = fmDate.getTime();

    // Construct the updated item object to send back to the UI
    const updatedItem = {
      type: payload.type,
      slug: payload.slug,
      folder: payload.type,
      ...nextData,
      content: nextContent,
      sortTs: sortTs,
    };

    // Broadcast the fully updated item to all windows
    win?.webContents.send("vault:item-updated", updatedItem);

    return { ok: true, item: updatedItem };
  } catch (e) {
    console.error("Failed to save item:", e);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle("delete-item", async (_evt, { type, slug }) => {
  try {
    const mdFilePath = path.join(vaultPath, type, `${slug}.md`);

    // Before deleting the markdown file, read it one last time to see if it has an image
    if (fs.existsSync(mdFilePath)) {
      const raw = fs.readFileSync(mdFilePath, "utf8");
      const fm = matter(raw);

      if (fm.data.image) {
        const imageFilePath = path.join(vaultPath, type, fm.data.image);
        if (fs.existsSync(imageFilePath)) {
          await fsp.unlink(imageFilePath); // Delete the image file
          console.log(`Deleted image: ${imageFilePath}`);
        }
      }

      await fsp.unlink(mdFilePath); // Delete the markdown file
      console.log(`Deleted item: ${mdFilePath}`);
    }

    // Tell the renderer to remove this item from the grid
    win?.webContents.send("vault:item-deleted", { type, slug });
    return { ok: true };
  } catch (e) {
    console.error("Failed to delete item:", e);
    return { ok: false, error: e.message };
  }
});

// --- APP STARTUP ---
app.whenReady().then(async () => {
  let savedPath = store.get("vaultPath");
  if (!savedPath || !fs.existsSync(savedPath)) {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Select Vault Folder",
      properties: ["openDirectory", "createDirectory"],
    });
    if (canceled || filePaths.length === 0) {
      app.quit();
      return;
    }
    savedPath = filePaths[0];
    store.set("vaultPath", savedPath);
  }
  vaultPath = savedPath;

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

  // --- THIS IS THE CORRECTED PROTOCOL REGISTRATION ---
  if (app.isPackaged) {
    app.setAsDefaultProtocolClient("menhir");
  }

  createWindow();
});
