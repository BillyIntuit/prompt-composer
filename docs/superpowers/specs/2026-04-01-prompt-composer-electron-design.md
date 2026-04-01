# Prompt Composer — Electron Desktop App Design Spec

## Overview

Wrap the existing Prompt Composer React prototype (v4) in an Electron shell with persistent storage, keyboard shortcuts, system tray integration, and packaging for macOS/Windows distribution.

The prototype is a prompt composition workspace for designers who use Claude Code. It is feature-complete — this spec covers the desktop shell, not UI changes.

## Stack

- Electron 33+
- React 18
- Vite 6 (bundler, dev server with HMR)
- electron-builder (packaging)
- electron-store (persistence)

## Project Structure

```
prompt-composer/
├── package.json
├── vite.config.js
├── electron/
│   ├── main.js          # Main process: window, tray, global shortcuts, IPC
│   ├── preload.js        # Context bridge exposing store + shell APIs to renderer
│   └── store.js          # electron-store wrapper (persistence layer)
├── src/
│   ├── App.jsx           # The v4 prototype, adapted
│   ├── main.jsx          # React entry (createRoot)
│   └── index.html        # Shell HTML with font preloads
├── build/                # App icon (512x512 lime green cmd symbol)
└── dist/                 # Build output
```

## Persistent Storage

Engine: `electron-store` — writes a JSON file to the OS app data directory.

### Schema

| Key | Type | Default | Notes |
|-----|------|---------|-------|
| `figmaLinks` | `{id, url, label, lastUsed}[]` | `[]` | Sorted by lastUsed in the UI |
| `filePaths` | `{id, path, label}[]` | `[]` | |
| `customPresets` | `{id, label, icon, category, template, phase}[]` | `[]` | Only user-created presets. Built-in presets stay hardcoded in the component. |
| `promptHistory` | `{text, plain, ts}[]` | `[]` | Capped at 50 entries |
| `preferences` | `{editorMode, activePanel, windowBounds}` | `{editorMode: "raw", activePanel: "presets", windowBounds: {width: 1200, height: 800}}` | |

### IPC Architecture

The renderer never accesses Node APIs directly. All persistence flows through IPC:

1. **Main process** (`electron/store.js`) wraps `electron-store` with get/set methods
2. **Preload script** (`electron/preload.js`) exposes a `window.electronAPI` object via `contextBridge`:
   - `electronAPI.store.get(key)` — returns a promise with the stored value
   - `electronAPI.store.set(key, value)` — writes to the store
3. **Renderer** (`App.jsx`) calls these on startup to hydrate state, and on every state change (debounced 500ms) to persist

### Write Debouncing

All store writes from the renderer are debounced by 500ms. A single debounce timer per key — if the user makes 10 rapid edits to figmaLinks, only the final state is written.

## Keyboard Shortcuts

### Global (registered via Electron globalShortcut)

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+P` / `Ctrl+Shift+P` | Toggle show/hide app window |

### In-App (registered via DOM keydown listener in App.jsx)

| Shortcut | Action |
|----------|--------|
| `Cmd+Enter` / `Ctrl+Enter` | Copy prompt to clipboard |
| `Cmd+N` / `Ctrl+N` | Clear the editor |

## Window Behavior

- Default size: 1200x800
- Minimum size: 800x500
- Resizable: yes
- Dark title bar: `backgroundColor: '#0A0A0A'` in BrowserWindow options
- Frame: default OS frame (not frameless)
- Close button: hides window to tray instead of quitting
- Window bounds (x, y, width, height) persisted on resize/move (debounced 500ms), restored on next launch

## System Tray

- Icon: small version of the app icon (16x16 / 32x32)
- Left-click: toggle window visibility
- Right-click context menu:
  - "Show / Hide Prompt Composer"
  - Separator
  - "Quit"

## Prototype Adaptations

The v4 prototype (`prompt-composer-v4.jsx`) is integrated with these minimal changes:

### Removed
- Hardcoded sample figmaLinks (3 items) — replaced with empty array, hydrated from store
- Hardcoded sample filePaths (3 items) — replaced with empty array, hydrated from store

### Modified
- Prompt history cap changed from 20 to 50
- Each state setter for figmaLinks, filePaths, presets (custom only), and promptHistory also triggers a debounced `electronAPI.store.set()` call
- Added `useEffect` for Cmd+Enter and Cmd+N keyboard shortcuts
- Google Fonts `<link>` tag moved from component JSX to `index.html` `<head>`

### Preserved (no changes)
- All UI rendering, inline styles, animations
- DEFAULT_PRESETS and IES_STEPS data
- Chip system: parsePrompt, replaceNthToken, rebuildPromptWithTextChange, segToTokenIdx, tokenToSegIdx
- Visual/Raw editor modes with contentEditable
- Help overlay (all 30+ Q&A entries, search, categories)
- Skills panel, DS Pack overlay
- Quick-insert snippets, toast system
- Preset CRUD (create, edit, delete custom presets)

## Packaging

**Tool:** electron-builder

**App identity:**
- Name: Prompt Composer
- Bundle ID: `com.design-team.prompt-composer`

**Targets:**
- macOS: `.dmg`
- Windows: `.exe` (NSIS)

**App icon:**
- 512x512 with lime green gradient background (#C4F464 to #8BBF3A)
- White command symbol (⌘) centered
- Generated as SVG, exported to PNG/ICNS (macOS) and ICO (Windows)

**Code signing:** Not included for v1. macOS users will need to right-click → Open on first launch.

## Out of Scope for v1

- Auto-launch on system startup
- Code signing / notarization
- Auto-update mechanism
- Splitting App.jsx into smaller components
- TypeScript conversion
- CSS modules or external stylesheets
