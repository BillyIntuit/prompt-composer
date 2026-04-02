const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage, dialog, shell } = require("electron");
const path = require("path");
const https = require("https");
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
    backgroundColor: "#00254a",
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
    properties: ["openFile", "openDirectory"],
    title: "Select a file",
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Update checker — compares package.json version against latest GitHub Release
const REPO = "BillyIntuit/prompt-composer";

function checkForUpdates() {
  const currentVersion = require("../package.json").version;
  const options = {
    hostname: "api.github.com",
    path: `/repos/${REPO}/releases/latest`,
    headers: { "User-Agent": "PromptComposer" },
  };
  https.get(options, (res) => {
    let data = "";
    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => {
      try {
        const release = JSON.parse(data);
        const latest = (release.tag_name || "").replace(/^v/, "");
        if (latest && latest !== currentVersion && isNewer(latest, currentVersion)) {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("update-available", {
              version: latest,
              url: release.html_url,
            });
          }
        }
      } catch {}
    });
  }).on("error", () => {});
}

function isNewer(latest, current) {
  const a = latest.split(".").map(Number);
  const b = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] || 0) > (b[i] || 0)) return true;
    if ((a[i] || 0) < (b[i] || 0)) return false;
  }
  return false;
}

ipcMain.handle("open-url", (_event, url) => {
  shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  // Check for updates 5 seconds after launch
  setTimeout(checkForUpdates, 5000);
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
