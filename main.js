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
    const screenshotId = params.get("screenshotId");
    const articleId = params.get("articleId");

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

    // 2. --- Image Logic ---
    // If a screenshotId is present, we handle that first.
    // Define and create thumbnail directory
    const thumbnailDir = path.join(vaultPath, ".menhir", "thumbnails");
    await fsp.mkdir(thumbnailDir, { recursive: true });

    // Screenshot handling
    if (screenshotId && pendingScreenshots.has(screenshotId)) {
      const dataUrl = pendingScreenshots.get(screenshotId);
      pendingScreenshots.delete(screenshotId); // Clean up immediately

      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const imageFilename = `${slug}.jpg`;
      const saveDir = path.join(vaultPath, itemType);

      await fsp.mkdir(saveDir, { recursive: true });
      await fsp.writeFile(path.join(saveDir, imageFilename), imageBuffer);

      // Generate thumbnail
      const thumbnailFilename = imageFilename.replace(/\.[^.]+$/, "-thumb.jpg");
      const imagePath = path.join(saveDir, imageFilename);
      const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

      if (
        await generateThumbnail(
          imagePath,
          thumbnailPath,
          imageFilename,
          itemType
        )
      ) {
        frontmatter.image = imageFilename;
        frontmatter.thumbnail = thumbnailFilename;
      }

      console.log(`Successfully saved screenshot as: ${imageFilename}`);
    }
    // Image URL handling
    else if (params.has("image")) {
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

          // Generate thumbnail
          const isGif = imageFilename.toLowerCase().endsWith(".gif");
          const thumbnailFilename = imageFilename.replace(
            /\.[^.]+$/,
            isGif ? "-thumb.gif" : "-thumb.jpg"
          );
          const imagePath = path.join(saveDir, imageFilename);
          const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

          if (
            await generateThumbnail(
              imagePath,
              thumbnailPath,
              imageFilename,
              itemType
            )
          ) {
            frontmatter.image = imageFilename;
            frontmatter.thumbnail = thumbnailFilename;
          }

          console.log(`Successfully saved image as: ${imageFilename}`);
        }
      } catch (imgErr) {
        console.error("Failed to download image:", imgErr);
        // If download fails, save the original URL as a fallback
        frontmatter.image = imageUrl;
      }
    }

    // Article handling
    if (articleId && pendingArticles.has(articleId)) {
      const html = pendingArticles.get(articleId);
      pendingArticles.delete(articleId);

      const dom = new JSDOM(html, { url: frontmatter.source });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        frontmatter.title = article.title || title;
        if (article.byline) frontmatter.byline = article.byline;
        if (article.siteName) frontmatter.siteName = article.siteName;
        const content = article.content;

        const fileContents = matter.stringify(content, frontmatter);
        const saveDir = path.join(vaultPath, "article");
        await fsp.mkdir(saveDir, { recursive: true });
        const filePath = path.join(saveDir, `${slug}.md`);
        await fsp.writeFile(filePath, fileContents, "utf8");

        win?.webContents.send("vault:refresh-needed");
        return;
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
