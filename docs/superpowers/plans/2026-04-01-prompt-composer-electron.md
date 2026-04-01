# Prompt Composer Electron App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing Prompt Composer React prototype in an Electron desktop app with persistent storage, keyboard shortcuts, system tray, and packaging.

**Architecture:** Electron main process manages the window, tray, global shortcuts, and persistence (via electron-store). A preload script bridges the main process to the React renderer through IPC. The React prototype (a single self-contained component) runs in the renderer with minimal adaptations — sample data removed, state changes wired to persist through IPC.

**Tech Stack:** Electron 33+, React 18, Vite 6, electron-store, electron-builder

**Spec:** `docs/superpowers/specs/2026-04-01-prompt-composer-electron-design.md`

**Prototype source:** `Reference/prompt-composer-v4.jsx`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Dependencies, scripts (dev, build, package) |
| `vite.config.js` | Create | Vite config for React, Electron dev integration |
| `electron/main.js` | Create | BrowserWindow, tray, global shortcuts, IPC handlers, window bounds |
| `electron/preload.js` | Create | contextBridge exposing `window.electronAPI.store` |
| `electron/store.js` | Create | electron-store wrapper with schema defaults |
| `src/index.html` | Create | HTML shell with Google Fonts link |
| `src/main.jsx` | Create | React entry point (createRoot) |
| `src/App.jsx` | Create | v4 prototype adapted: empty initial state, persistence hooks, keyboard shortcuts |
| `build/icon.svg` | Create | App icon source (lime green gradient + white ⌘) |
| `build/icon.png` | Create | 512x512 PNG rendered from SVG |

---

### Task 1: Project Scaffold & Dependencies

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/index.html`
- Create: `src/main.jsx`

- [ ] **Step 1: Initialize package.json**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm init -y
```

Then replace the contents of `package.json` with:

```json
{
  "name": "prompt-composer",
  "version": "1.0.0",
  "description": "Desktop prompt composition workspace for Claude Code",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "dev:electron": "NODE_ENV=development electron .",
    "build": "vite build",
    "package:mac": "npm run build && electron-builder --mac",
    "package:win": "npm run build && electron-builder --win"
  },
  "build": {
    "appId": "com.design-team.prompt-composer",
    "productName": "Prompt Composer",
    "directories": {
      "output": "dist"
    },
    "files": [
      "electron/**/*",
      "build/**/*",
      "!src/**/*"
    ],
    "extraResources": [],
    "mac": {
      "icon": "build/icon.png",
      "target": "dmg"
    },
    "win": {
      "icon": "build/icon.png",
      "target": "nsis"
    }
  },
  "devDependencies": {},
  "dependencies": {}
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm install react react-dom electron-store
npm install --save-dev electron vite @vitejs/plugin-react electron-builder
```

- [ ] **Step 3: Create vite.config.js**

Create `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  root: "src",
  build: {
    outDir: "../build/renderer",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
```

- [ ] **Step 4: Create src/index.html**

Create `src/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:;" />
  <title>Prompt Composer</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #0A0A0A; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 5: Create src/main.jsx**

Create `src/main.jsx`:

```jsx
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(<App />);
```

- [ ] **Step 6: Verify Vite dev server starts**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npx vite src --port 5173
```

Expected: Vite starts, shows "Local: http://localhost:5173/". Page will show a blank dark screen (no App.jsx yet). Kill the server after confirming.

- [ ] **Step 7: Commit scaffold**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
echo "node_modules/\ndist/\nbuild/renderer/" > .gitignore
git add package.json package-lock.json vite.config.js src/index.html src/main.jsx .gitignore
git commit -m "feat: scaffold Electron + React + Vite project"
```

---

### Task 2: Electron Main Process (Window + Tray + Shortcuts)

**Files:**
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Create: `electron/store.js`

- [ ] **Step 1: Create electron/store.js**

This wraps electron-store with the schema defaults from the spec.

```js
const Store = require("electron-store");

const store = new Store({
  defaults: {
    figmaLinks: [],
    filePaths: [],
    customPresets: [],
    promptHistory: [],
    preferences: {
      editorMode: "raw",
      activePanel: "presets",
      windowBounds: { width: 1200, height: 800 },
    },
  },
});

module.exports = store;
```

- [ ] **Step 2: Create electron/preload.js**

This exposes the store API to the renderer via contextBridge.

```js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  store: {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
  },
});
```

- [ ] **Step 3: Create electron/main.js**

```js
const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, nativeImage } = require("electron");
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
    mainWindow.loadURL("http://localhost:5173");
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
  // Create a simple 16x16 tray icon using nativeImage
  // In production, use build/icon.png — for dev, create a minimal icon
  const iconPath = path.join(__dirname, "../build/icon.png");
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch {
    // Fallback: create a tiny colored square if icon doesn't exist yet
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
  // On macOS, keep the app running (tray)
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS, re-show window when clicking dock icon
  if (mainWindow) {
    mainWindow.show();
  }
});
```

- [ ] **Step 4: Test Electron launches with Vite dev server**

Open two terminals:

Terminal 1 — start Vite:
```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run dev
```

Terminal 2 — start Electron:
```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run dev:electron
```

Expected: An Electron window opens with a dark background (#0A0A0A), title "Prompt Composer", size ~1200x800. The page content is blank (no App.jsx content yet). A tray icon appears. Cmd+Shift+P toggles the window. Close button hides the window to tray.

- [ ] **Step 5: Commit Electron main process**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add electron/main.js electron/preload.js electron/store.js
git commit -m "feat: add Electron main process with window, tray, shortcuts, and IPC store"
```

---

### Task 3: Integrate the React Prototype

**Files:**
- Create: `src/App.jsx` (copied from `Reference/prompt-composer-v4.jsx` with adaptations)

This is the largest task. The prototype is ~1100 lines. We make these specific changes:

1. Remove sample data from initial state
2. Add persistence hydration on mount
3. Add debounced persistence on state changes
4. Change history cap from 20 to 50
5. Add Cmd+Enter and Cmd+N keyboard shortcuts
6. Remove the Google Fonts `<link>` tag from the component (already in index.html)

- [ ] **Step 1: Copy prototype to src/App.jsx**

```bash
cp "/Users/vhong2/Desktop/Prompt Composer/Reference/prompt-composer-v4.jsx" "/Users/vhong2/Desktop/Prompt Composer/src/App.jsx"
```

- [ ] **Step 2: Remove sample figmaLinks data**

In `src/App.jsx`, replace the hardcoded figmaLinks initial state:

```jsx
// REPLACE THIS:
const [figmaLinks, setFigmaLinks] = useState([
  { id:"1", url:"https://figma.com/design/abc/IES?node-id=10-20", label:"IES Color Tokens", lastUsed:Date.now()-60000 },
  { id:"2", url:"https://figma.com/design/abc/IES?node-id=30-40", label:"IES Typography", lastUsed:Date.now()-120000 },
  { id:"3", url:"https://figma.com/design/abc/IES?node-id=50-60", label:"Hero Section v2", lastUsed:Date.now()-180000 },
]);

// WITH THIS:
const [figmaLinks, setFigmaLinks] = useState([]);
```

- [ ] **Step 3: Remove sample filePaths data**

In `src/App.jsx`, replace the hardcoded filePaths initial state:

```jsx
// REPLACE THIS:
const [filePaths, setFilePaths] = useState([
  { id:"1", path:"src/styles/tokens.css", label:"Design Tokens" },
  { id:"2", path:"src/components/Button.tsx", label:"Button Component" },
  { id:"3", path:"src/assets/icons/", label:"Icons Directory" },
]);

// WITH THIS:
const [filePaths, setFilePaths] = useState([]);
```

- [ ] **Step 4: Change history cap from 20 to 50**

In the `copyPrompt` function, find:

```jsx
setPromptHistory(p => [{ text:prompt, plain, ts:Date.now() }, ...p].slice(0,20));
```

Replace with:

```jsx
setPromptHistory(p => [{ text:prompt, plain, ts:Date.now() }, ...p].slice(0,50));
```

- [ ] **Step 5: Remove the Google Fonts link tag from the component**

In the render/return section, find and delete this line (it's inside the root `<div>`):

```jsx
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

Remove the entire `<link>` tag. The fonts are already loaded in `src/index.html`.

- [ ] **Step 6: Add persistence hydration and debounced writes**

At the top of the `PromptComposerV4` function (after the existing state declarations and before `const editorRef`), add:

```jsx
  // ═══ PERSISTENCE ═══
  const isElectron = typeof window !== "undefined" && window.electronAPI;

  // Hydrate state from store on mount
  useEffect(() => {
    if (!isElectron) return;
    const hydrate = async () => {
      const [links, paths, custom, history, prefs] = await Promise.all([
        window.electronAPI.store.get("figmaLinks"),
        window.electronAPI.store.get("filePaths"),
        window.electronAPI.store.get("customPresets"),
        window.electronAPI.store.get("promptHistory"),
        window.electronAPI.store.get("preferences"),
      ]);
      if (links?.length) setFigmaLinks(links);
      if (paths?.length) setFilePaths(paths);
      if (custom?.length) setPresets(p => [...p.filter(x => !x.custom), ...custom]);
      if (history?.length) setPromptHistory(history);
      if (prefs?.editorMode) setEditorMode(prefs.editorMode);
      if (prefs?.activePanel) setActivePanel(prefs.activePanel);
    };
    hydrate();
  }, []);

  // Debounced persist helper
  const persistTimers = useRef({});
  const persistToStore = useCallback((key, value) => {
    if (!isElectron) return;
    clearTimeout(persistTimers.current[key]);
    persistTimers.current[key] = setTimeout(() => {
      window.electronAPI.store.set(key, value);
    }, 500);
  }, []);

  // Persist on state changes
  useEffect(() => { persistToStore("figmaLinks", figmaLinks); }, [figmaLinks]);
  useEffect(() => { persistToStore("filePaths", filePaths); }, [filePaths]);
  useEffect(() => {
    const custom = presets.filter(p => p.custom);
    persistToStore("customPresets", custom);
  }, [presets]);
  useEffect(() => { persistToStore("promptHistory", promptHistory); }, [promptHistory]);
  useEffect(() => {
    persistToStore("preferences", { editorMode, activePanel, windowBounds: undefined });
  }, [editorMode, activePanel]);
```

Note: `windowBounds` is persisted by the main process (on resize/move events), not the renderer. The preferences persist only `editorMode` and `activePanel` from the renderer side.

- [ ] **Step 7: Add in-app keyboard shortcuts**

After the persistence block (and before the existing `useEffect` for popover close), add:

```jsx
  // ═══ KEYBOARD SHORTCUTS ═══
  useEffect(() => {
    const handler = (e) => {
      // Cmd/Ctrl+Enter → copy prompt
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        copyPrompt();
      }
      // Cmd/Ctrl+N → clear editor
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setPrompt("");
        setPopover(null);
        setSelectingFor(null);
        setEditorMode("raw");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [prompt]);
```

The `prompt` dependency is needed because `copyPrompt` reads `prompt` from closure.

- [ ] **Step 8: Verify the app renders in Electron**

Terminal 1:
```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run dev
```

Terminal 2:
```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run dev:electron
```

Expected: The full Prompt Composer UI appears — header with ⌘ icon, sidebar with Presets/Figma/Files tabs, main editor area, quick-insert bar. Presets panel shows the 9 built-in presets. Figma and Files panels are empty (sample data removed). Loading a preset fills the editor. Cmd+Enter copies. Cmd+N clears.

- [ ] **Step 9: Commit prototype integration**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: integrate v4 prototype with persistence, shortcuts, and empty initial state"
```

---

### Task 4: Test Persistence End-to-End

This task verifies that data persists across app restarts.

- [ ] **Step 1: Manual test — Figma links persist**

1. Launch the app (dev mode, both terminals)
2. Go to Figma tab → click "+ Add" → enter label "Test Link", URL "https://figma.com/test" → Save
3. Quit the app completely (tray → Quit)
4. Relaunch the app
5. Check the Figma tab — "Test Link" should still be there

- [ ] **Step 2: Manual test — Custom presets persist**

1. Go to Presets tab → click "+ Create"
2. Enter name "My Preset", pick an icon, write a template "Test {{FIGMA_LINK}}"
3. Click Create
4. Quit and relaunch
5. "My Preset" should appear in the presets list with the orange "custom" badge

- [ ] **Step 3: Manual test — Prompt history persists**

1. Type something in the editor → click "Copy Prompt"
2. History section appears at bottom
3. Quit and relaunch
4. History should still show the previous prompt

- [ ] **Step 4: Manual test — Window position persists**

1. Drag the window to the bottom-right corner and resize it smaller
2. Quit and relaunch
3. Window should open at the same position and size

- [ ] **Step 5: Verify the store file location**

```bash
# macOS — the store file should exist here:
cat ~/Library/Application\ Support/prompt-composer/config.json
```

Expected: JSON file with figmaLinks, filePaths, customPresets, etc.

- [ ] **Step 6: Commit (no code changes — this was a test-only task)**

If any bugs were found and fixed during testing, commit those fixes:

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add -A
git commit -m "fix: address persistence issues found during manual testing"
```

If no fixes needed, skip this step.

---

### Task 5: App Icon

**Files:**
- Create: `build/icon.svg`
- Create: `build/icon.png`

- [ ] **Step 1: Create build/icon.svg**

Create `build/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C4F464"/>
      <stop offset="100%" stop-color="#8BBF3A"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>
  <text x="256" y="300" text-anchor="middle" font-size="280" font-family="system-ui, -apple-system, sans-serif" font-weight="700" fill="white">⌘</text>
</svg>
```

- [ ] **Step 2: Convert SVG to 512x512 PNG**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
# Use sips (built into macOS) or any available converter
# If sips can't handle SVG, use the built-in qlmanage or python:
python3 -c "
import subprocess, os
# Use rsvg-convert if available, otherwise use a simple approach
svg_path = 'build/icon.svg'
png_path = 'build/icon.png'
try:
    subprocess.run(['rsvg-convert', '-w', '512', '-h', '512', svg_path, '-o', png_path], check=True)
except FileNotFoundError:
    # Fallback: use sips on a rendered version or install librsvg
    print('Install librsvg: brew install librsvg, then re-run')
"
```

If `rsvg-convert` is not available, install it:
```bash
brew install librsvg
rsvg-convert -w 512 -h 512 build/icon.svg -o build/icon.png
```

Alternative: use any method available on the system to produce a 512x512 PNG from the SVG. The exact tool doesn't matter — the result is what counts.

- [ ] **Step 3: Verify the icon exists and is the right size**

```bash
file build/icon.png
sips -g pixelWidth -g pixelHeight build/icon.png
```

Expected: PNG image, 512x512 pixels.

- [ ] **Step 4: Commit icon**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add build/icon.svg build/icon.png
git commit -m "feat: add app icon (lime green gradient with white cmd symbol)"
```

---

### Task 6: Packaging with electron-builder

**Files:**
- Modify: `package.json` (already has build config from Task 1)

- [ ] **Step 1: Verify build config in package.json**

Read `package.json` and confirm the `"build"` section exists with `appId`, `productName`, `mac`, and `win` targets. It was set up in Task 1. If it's missing, add it.

Also ensure the `"files"` array in the build config includes the built renderer output:

```json
"files": [
  "electron/**/*",
  "build/**/*"
]
```

And the build output directory for Vite is correct. Vite outputs to `build/renderer/` (per `vite.config.js`), and the main process loads from `build/renderer/index.html` in production mode.

- [ ] **Step 2: Run the Vite production build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

Expected: Vite builds successfully, output in `build/renderer/` with `index.html`, JS bundle, and assets.

- [ ] **Step 3: Test production mode locally**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
electron .
```

Expected: App launches loading the built files (not dev server). Full UI works — presets, chips, editor, help overlay.

- [ ] **Step 4: Package for macOS**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run package:mac
```

Expected: Outputs a `.dmg` file in `dist/`. The process may take 1-2 minutes. Warnings about code signing are expected and can be ignored for v1.

- [ ] **Step 5: Verify the .dmg**

```bash
ls -la dist/*.dmg
```

Expected: A file like `dist/Prompt Composer-1.0.0.dmg` exists.

- [ ] **Step 6: Commit packaging setup**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add package.json
git commit -m "feat: configure electron-builder for macOS and Windows packaging"
```

---

### Task 7: Final Smoke Test

End-to-end verification that everything works together.

- [ ] **Step 1: Fresh start test**

Delete the store file to simulate a first-time user:
```bash
rm -f ~/Library/Application\ Support/prompt-composer/config.json
```

Launch in dev mode. Expected:
- App opens at 1200x800, centered
- Sidebar shows Presets with 9 built-in presets
- Figma and Files tabs are empty
- Editor is blank with placeholder text

- [ ] **Step 2: Full workflow test**

1. Click "Match Layout" preset → editor fills with template in Visual mode
2. Click the amber FIGMA_LINK chip → sidebar switches to Figma tab with "Select" banner
3. Type `https://figma.com/design/test/file?node-id=1-2` in the inline input → click "Use"
4. Chip turns green showing the link
5. Click the amber FILE_PATH chip → sidebar switches to Files tab
6. Type `src/components/Hero.tsx` → click "Use"
7. Both chips are green
8. Click "Copy Prompt" → toast shows "Copied"
9. Check clipboard — should contain the full prompt with actual URLs (no chip markup)
10. History section shows the copied prompt

- [ ] **Step 3: Keyboard shortcuts test**

1. `Cmd+Shift+P` → window hides
2. `Cmd+Shift+P` → window shows
3. Type in editor → `Cmd+Enter` → copies to clipboard
4. `Cmd+N` → editor clears

- [ ] **Step 4: Help overlay test**

1. Click `?` button → full-screen help overlay appears
2. Type "chip" in search → results filter to chip-related Q&A
3. Click a Q&A card → expands with answer
4. Close help overlay

- [ ] **Step 5: IES Pack test**

1. Click "IES Pack" in header → overlay with 8 steps appears
2. Click "1. Tokens & Colors" → editor fills with the IES step template
3. Close IES overlay

- [ ] **Step 6: Persistence final test**

1. Add a Figma link, create a custom preset, copy a prompt (to create history)
2. Quit app completely (tray → Quit)
3. Relaunch
4. All three (link, preset, history) should be present
