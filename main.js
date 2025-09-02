const sharp = require("sharp");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
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
const http = require("http");
let screenshotServer;
const pendingScreenshots = new Map(); // Store screenshots temporarily
const pendingArticles = new Map(); // Store article HTML temporarily

// --- LOCAL SERVER for receiving screenshots from the extension ---
function startScreenshotServer() {
  screenshotServer = http.createServer((req, res) => {
    // (The inner code remains the same)
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method === "POST" && req.url === "/capture-screenshot") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const { screenshotId, data } = JSON.parse(body);
          if (screenshotId && data) {
            pendingScreenshots.set(screenshotId, data);
            setTimeout(() => pendingScreenshots.delete(screenshotId), 30000);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Screenshot received" }));
          }
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
    } else if (req.method === "POST" && req.url === "/capture-article") {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const { articleId, html } = JSON.parse(body);
          if (articleId && html) {
            pendingArticles.set(articleId, html);
            setTimeout(() => pendingArticles.delete(articleId), 30000);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Article received" }));
          }
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });
    } else {
      res.writeHead(404).end();
    }
  });

  // --- Add error handling to the server itself ---
  screenshotServer.on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.log("Address in use, retrying...");
      // We can simply ignore this error in dev mode, the old server will handle it.
    }
  });

  screenshotServer.listen(28080, "127.0.0.1");
}

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

// Add the thumbnail generation function
async function generateThumbnail(
  imagePath,
  thumbnailPath,
  originalFilename,
  itemType
) {
  try {
    const isGif = originalFilename.toLowerCase().endsWith(".gif");
    const image = sharp(imagePath, isGif ? { animated: true } : {});
    const metadata = await image.metadata();

    let pipeline = image.resize(400, null, { withoutEnlargement: true });

    if (itemType === "webpage") {
      pipeline = pipeline.resize(400, 400, {
        fit: "cover",
        position: "top",
      });
    }

    if (isGif) {
      await pipeline.gif().toFile(thumbnailPath);
    } else {
      await pipeline.jpeg({ quality: 70 }).toFile(thumbnailPath);
    }

    return true;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return false;
  }
}

// --- CAPTURE HANDLER ---
async function handleCaptureUrl(captureUrl) {
  try {
    function slugify(text) {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .substring(0, 50);
    }

    const url = new URL(captureUrl);
    const params = url.searchParams;
    const itemType = params.get("type") || "webpage";
    const title = params.get("title") || "Untitled Capture";
    const timestamp = Date.now();
    const slug = `${slugify(title)}-${timestamp}`;

    let frontmatter = {
      catalogueId: `${itemType.toUpperCase().substring(0, 4)}-${timestamp
        .toString()
        .slice(-6)}`,
      title: title,
      added: new Date().toISOString(),
      source: params.get("source"),
    };

    let content = "";

    // --- Article Processing ---
    if (params.has("articleId")) {
      const html = pendingArticles.get(params.get("articleId"));
      if (html) {
        pendingArticles.delete(params.get("articleId"));
        const dom = new JSDOM(html, { url: frontmatter.source });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (article) {
          frontmatter.title = article.title;
          frontmatter.byline = article.byline;
          frontmatter.siteName = article.siteName;
          content = article.content;
          // **SOLUTION**: Get the lead image from the parsed article
          // or fall back to the Open Graph image from the original document.
          const ogImage = dom.window.document.querySelector(
            'meta[property="og:image"]'
          );
          frontmatter.image = article.lead_image_url || ogImage?.content;
        }
      }
    } else {
      // --- Standard Item Processing ---
      if (params.has("price")) frontmatter.price = params.get("price");
      if (params.has("currency")) frontmatter.currency = params.get("currency");
      if (params.has("vendor")) frontmatter.vendor = params.get("vendor");
      if (params.has("image")) frontmatter.image = params.get("image");
    }

    // --- Centralized Image Downloading & Thumbnail Generation ---
    if (frontmatter.image || params.has("screenshotId")) {
      const thumbnailDir = path.join(vaultPath, ".menhir", "thumbnails");
      await fsp.mkdir(thumbnailDir, { recursive: true });
      const saveDir = path.join(vaultPath, itemType);
      await fsp.mkdir(saveDir, { recursive: true });

      let imageFilename;
      try {
        imageFilename = `${slug}${
          path.extname(new URL(frontmatter.image).pathname) || ".jpg"
        }`;
      } catch {
        imageFilename = `${slug}.jpg`;
      }
      const imagePath = path.join(saveDir, imageFilename);

      if (params.has("screenshotId")) {
        const dataUrl = pendingScreenshots.get(params.get("screenshotId"));
        pendingScreenshots.delete(params.get("screenshotId"));
        const imageBuffer = Buffer.from(
          dataUrl.replace(/^data:image\/jpeg;base64,/, ""),
          "base64"
        );
        await fsp.writeFile(imagePath, imageBuffer);
      } else if (frontmatter.image) {
        try {
          const response = await fetch(frontmatter.image);
          if (response.ok) {
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            await fsp.writeFile(imagePath, imageBuffer);
          } else {
            frontmatter.image = null; // Clear image if download fails
          }
        } catch (imgErr) {
          console.error("Failed to download image:", imgErr);
          frontmatter.image = null; // Clear image on error
        }
      }

      // Generate Thumbnail (only if image was successfully saved)
      if (frontmatter.image) {
        const isGif = imageFilename.toLowerCase().endsWith(".gif");
        const thumbnailFilename = imageFilename.replace(
          /\.[^.]+$/,
          isGif ? "-thumb.gif" : "-thumb.jpg"
        );
        const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
        if (
          await generateThumbnail(
            imagePath,
            thumbnailPath,
            imageFilename,
            itemType
          )
        ) {
          frontmatter.image = imageFilename; // Save the local filename
          frontmatter.thumbnail = thumbnailFilename;
        }
      }
    }

    // --- Final Save ---
    const fileContents = matter.stringify(content, frontmatter);
    const saveDir = path.join(vaultPath, itemType);
    await fsp.mkdir(saveDir, { recursive: true });
    await fsp.writeFile(path.join(saveDir, `${slug}.md`), fileContents, "utf8");

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
  if (filename.includes("-thumb")) {
    const newThumbnailPath = path.join(
      vaultPath,
      ".menhir",
      "thumbnails",
      filename
    );
    if (fs.existsSync(newThumbnailPath)) {
      return `local-resource://.menhir/thumbnails/${filename}`;
    }
  }
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

    if (fs.existsSync(mdFilePath)) {
      const raw = fs.readFileSync(mdFilePath, "utf8");
      const fm = matter(raw);

      if (fm.data.image) {
        const imageFilePath = path.join(vaultPath, type, fm.data.image);
        if (fs.existsSync(imageFilePath)) {
          await fsp.unlink(imageFilePath);
        }
        // Check and delete thumbnail from both possible locations
        if (fm.data.thumbnail) {
          const oldThumbnailPath = path.join(
            vaultPath,
            type,
            fm.data.thumbnail
          );
          const newThumbnailPath = path.join(
            vaultPath,
            ".menhir",
            "thumbnails",
            fm.data.thumbnail
          );

          if (fs.existsSync(oldThumbnailPath)) {
            await fsp.unlink(oldThumbnailPath);
          }
          if (fs.existsSync(newThumbnailPath)) {
            await fsp.unlink(newThumbnailPath);
          }
        }
      }

      await fsp.unlink(mdFilePath);
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
  startScreenshotServer();
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
