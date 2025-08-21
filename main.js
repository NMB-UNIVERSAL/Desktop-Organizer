import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from "fs/promises";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === "development";
function getStorageFilePath() {
  if (isDev) {
    return path.join(__dirname, "storage.json");
  }
  return path.join(app.getPath("userData"), "storage.json");
}

// Unified storage helpers
async function getDefaultStorage() {
  return { widgets: [], data: {} };
}

async function ensureStorageFile() {
  try {
    const target = getStorageFilePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.access(target);
  } catch (e) {
    const initial = await getDefaultStorage();
    const target = getStorageFilePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(initial, null, 2));
  }
}

async function readStorage() {
  try {
    const target = getStorageFilePath();
    const raw = await fs.readFile(target, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.widgets || !parsed.data) {
      return await getDefaultStorage();
    }
    return parsed;
  } catch (e) {
    if (e.code === "ENOENT") {
      const initial = await getDefaultStorage();
      const target = getStorageFilePath();
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, JSON.stringify(initial, null, 2));
      return initial;
    }
    console.error("Error reading storage:", e);
    return await getDefaultStorage();
  }
}

async function writeStorage(storage) {
  try {
    const target = getStorageFilePath();
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(storage, null, 2));
  } catch (e) {
    console.error("Error writing storage:", e);
  }
}

let mainWindow;
let widgets = new Map();
let isDesktopVisible = true;
let desktopCheckInterval;
const boundsSaveTimers = new Map();
let globalSettings = { backgroundColor: "#0f172a80", fontColor: "#ffffff" };

// Set up IPC handlers for unified storage.json
ipcMain.handle("save-data", async (event, { key, data }) => {
  try {
    const storage = await readStorage();
    storage.data[key] = data;
    await writeStorage(storage);
    return { success: true };
  } catch (error) {
    console.error("Error saving data:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-data", async (event, { key }) => {
  try {
    const storage = await readStorage();
    const data = Object.prototype.hasOwnProperty.call(storage.data, key)
      ? storage.data[key]
      : null;
    return { success: true, data };
  } catch (error) {
    console.error("Error loading data:", error);
    return { success: false, error: error.message };
  }
});

// Check if desktop is visible by checking for fullscreen windows
function checkDesktopVisibility() {
  try {
    // Get all windows except our own
    const allWindows = BrowserWindow.getAllWindows();
    const ourWindows = new Set([
      mainWindow,
      ...widgets.values().map((w) => w.window),
    ]);
    const otherWindows = allWindows.filter((w) => !ourWindows.has(w));

    // Check if any other window is fullscreen
    const hasFullscreenWindow = otherWindows.some((window) => {
      return window.isFullScreen();
    });

    const isVisible = !hasFullscreenWindow;
    console.log("Desktop visibility check result:", {
      windowCount: otherWindows.length,
      hasFullscreen: hasFullscreenWindow,
      isVisible,
    });
    return isVisible;
  } catch (error) {
    console.log("Desktop visibility check failed:", error);
    return true;
  }
}

// Show/hide all widgets based on desktop visibility
function toggleWidgetVisibility(visible) {
  console.log("Toggling widget visibility:", visible);

  if (mainWindow) {
    if (visible) {
      mainWindow.show();
    } else {
      mainWindow.hide();
    }
  }

  widgets.forEach(({ window }) => {
    if (visible) {
      window.show();
    } else {
      window.hide();
    }
  });
}

function createWidgetManager() {
  mainWindow = new BrowserWindow({
    width: 350,
    height: 350,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isDev) {
    const startUrl = "http://localhost:5173";
    mainWindow.loadURL(startUrl);
  } else {
    const htmlPath = existsSync(path.join(__dirname, "renderer", "index.html"))
      ? path.join(__dirname, "renderer", "index.html")
      : path.join(process.resourcesPath, "renderer", "index.html");
    mainWindow.loadFile(htmlPath);
  }

  // DevTools are available but not opened by default

  // Position in top-right corner
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(width - 370, 20);
}

function createWidget(type, options = {}) {
  const widgetId = options.id || Date.now().toString();

  const widget = new BrowserWindow({
    width: (options.bounds && options.bounds.width) || options.width || 300,
    height: (options.bounds && options.bounds.height) || options.height || 400,
    transparent: true,
    frame: false,
    alwaysOnTop: false, // Changed to false so it stays below other windows
    skipTaskbar: true,
    resizable: true,
    focusable: true, // Allow focusing for text input
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      additionalArguments: [`--widget-type=${type}`, `--widget-id=${widgetId}`],
      devTools: true,
    },
  });

  if (isDev) {
    const startUrl = `http://localhost:5173?type=${type}&id=${widgetId}`;
    widget.loadURL(startUrl);
  } else {
    const htmlPath = existsSync(path.join(__dirname, "renderer", "index.html"))
      ? path.join(__dirname, "renderer", "index.html")
      : path.join(process.resourcesPath, "renderer", "index.html");
    widget.loadFile(htmlPath, { query: { type, id: widgetId } });
  }

  // Position or restore bounds
  if (options.bounds && typeof options.bounds.x === "number" && typeof options.bounds.y === "number") {
    try {
      widget.setBounds({
        x: Math.floor(options.bounds.x),
        y: Math.floor(options.bounds.y),
        width: Math.floor((options.bounds && options.bounds.width) || options.width || 300),
        height: Math.floor((options.bounds && options.bounds.height) || options.height || 400),
      });
    } catch (_) {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const x = Math.random() * (width - (options.width || 300));
      const y = Math.random() * (height - (options.height || 400));
      widget.setPosition(Math.floor(x), Math.floor(y));
    }
  } else {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const x = Math.random() * (width - (options.width || 300));
    const y = Math.random() * (height - (options.height || 400));
    widget.setPosition(Math.floor(x), Math.floor(y));
  }

  widgets.set(widgetId, { window: widget, type });

  // Persist widget registration and bounds
  (async () => {
    const storage = await readStorage();
    const existingIndex = storage.widgets.findIndex((w) => w.id === widgetId);
    const b = widget.getBounds();
    const entry = { id: widgetId, type, bounds: { x: b.x, y: b.y, width: b.width, height: b.height } };
    if (existingIndex >= 0) {
      storage.widgets[existingIndex] = entry;
    } else {
      storage.widgets.push(entry);
    }
    await writeStorage(storage);
  })();

  const schedulePersistBounds = () => {
    const existing = boundsSaveTimers.get(widgetId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      const storage = await readStorage();
      const idx = storage.widgets.findIndex((w) => w.id === widgetId);
      if (idx >= 0) {
        const b = widget.getBounds();
        storage.widgets[idx].bounds = { x: b.x, y: b.y, width: b.width, height: b.height };
        await writeStorage(storage);
      }
      boundsSaveTimers.delete(widgetId);
    }, 250);
    boundsSaveTimers.set(widgetId, timer);
  };

  widget.on("moved", schedulePersistBounds);
  widget.on("resized", schedulePersistBounds);
  widget.on("closed", async () => {
    widgets.delete(widgetId);
    const storage = await readStorage();
    storage.widgets = storage.widgets.filter((w) => w.id !== widgetId);
    await writeStorage(storage);
  });

  return widgetId;
}

app.whenReady().then(async () => {
  await ensureStorageFile();
  // Load settings
  try {
    const storage = await readStorage();
    if (storage.data && storage.data.__settings) {
      globalSettings = { ...globalSettings, ...storage.data.__settings };
    }
  } catch (_) {}
  createWidgetManager();

  // Show widgets by default
  toggleWidgetVisibility(true);

  // Only hide widgets when another window goes fullscreen
  screen.on("display-metrics-changed", () => {
    const displays = screen.getAllDisplays();
    const hasFullscreen = displays.some(
      (d) =>
        d.bounds.width === d.workArea.width &&
        d.bounds.height === d.workArea.height
    );
    toggleWidgetVisibility(!hasFullscreen);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWidgetManager();
    }
  });

  // Restore previously open widgets
  try {
    const storage = await readStorage();
    for (const w of storage.widgets) {
      try {
        if (!widgets.has(w.id)) {
          createWidget(w.type, { id: w.id, bounds: w.bounds });
        }
      } catch (e) {
        console.error("Failed to restore widget", w, e);
      }
    }
  } catch (e) {
    console.error("Error restoring widgets:", e);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle("create-widget", async (event, type, options) => {
  console.log("IPC: Creating widget:", type, options);
  const widgetId = createWidget(type, options);
  console.log("IPC: Widget created with ID:", widgetId);
  return widgetId;
});

ipcMain.handle("get-widget-info", (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const url = window.webContents.getURL();
  console.log("IPC: Getting widget info from URL:", url);

  const urlObj = new URL(url);
  const type = urlObj.searchParams.get("type");
  const id = urlObj.searchParams.get("id");

  const info = {
    type: type,
    id: id,
  };

  console.log("IPC: Widget info extracted:", info);
  return info;
});

ipcMain.handle("close-widget", (event, widgetId) => {
  const widget = widgets.get(widgetId);
  if (widget) {
    widget.window.close();
  }
});

// Storage handlers are defined at the top of the file

ipcMain.handle("close-app", async () => {
  try {
    // Optionally persist current state before quitting
    const storage = await readStorage();
    for (const [id, { window, type }] of widgets.entries()) {
      try {
        const b = window.getBounds();
        const idx = storage.widgets.findIndex((w) => w.id === id);
        const entry = { id, type, bounds: { x: b.x, y: b.y, width: b.width, height: b.height } };
        if (idx >= 0) storage.widgets[idx] = entry; else storage.widgets.push(entry);
      } catch (_) {}
    }
    await writeStorage(storage);
  } catch (_) {}
  app.quit();
});

// Settings handlers
ipcMain.handle("update-settings", async (event, newSettings) => {
  try {
    globalSettings = { ...globalSettings, ...newSettings };
    const storage = await readStorage();
    storage.data.__settings = globalSettings;
    await writeStorage(storage);
    // Broadcast to all windows
    for (const bw of BrowserWindow.getAllWindows()) {
      bw.webContents.send("settings-updated", globalSettings);
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle("get-settings", async () => {
  try {
    const storage = await readStorage();
    const s = storage.data.__settings || globalSettings;
    return { success: true, data: s };
  } catch (e) {
    return { success: true, data: globalSettings };
  }
});
