const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, dialog } = require("electron");
const path = require("path");
const store = require("./store");

let mainWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const savedBounds = store.get("preferences.windowBounds") || {};
  const { width = 1200, height = 800, x, y } = savedBounds;

  mainWindow = new BrowserWindow({
    width,
    height,
    ...(x !== undefined && y !== undefined ? { x, y } : {}),
    minWidth: 800,
    minHeight: 500,
    backgroundColor: "#0A0A0A",
    title: "Prompt Composer",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5199");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/renderer/index.html"));
  }

  // Hide to tray instead of quitting
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Persist window bounds on move/resize (debounced)
  let boundsTimer = null;
  const saveBounds = () => {
    clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        store.set("preferences.windowBounds", mainWindow.getBounds());
      }
    }, 500);
  };
  mainWindow.on("resize", saveBounds);
  mainWindow.on("move", saveBounds);
}

function createTray() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("Prompt Composer");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show / Hide Prompt Composer",
      click: () => toggleWindow(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleWindow());
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function registerGlobalShortcuts() {
  globalShortcut.register("CommandOrControl+Shift+P", () => {
    toggleWindow();
  });
}

// IPC handlers for store
ipcMain.handle("store:get", (_event, key) => {
  return store.get(key);
});

ipcMain.handle("store:set", (_event, key, value) => {
  store.set(key, value);
});

ipcMain.handle("dialog:openFile", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    title: "Select a file",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow) {
    mainWindow.show();
  }
});
