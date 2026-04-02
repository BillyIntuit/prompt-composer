# Prompt Composer

A desktop app that helps designers write structured instructions for Claude Code. Instead of typing long, complex prompts into a terminal, you build them here — with visual Figma link chips, file path references, and ready-made templates that follow the IES design system workflow.

Built for the IES design team. Runs on macOS.

---

## Install

1. Go to the [Releases page](https://github.com/BillyIntuit/prompt-composer/releases/latest)
2. Download the `.dmg` file
3. Open it and drag **Prompt Composer** to your Applications folder
4. Launch the app

### macOS Security Prompt

Since the app isn't signed with an Apple Developer certificate, macOS will block it the first time. Here's the fix (one-time only):

1. Try to open the app — you'll see *"Prompt Composer can't be opened because it is from an unidentified developer"*
2. Go to **System Settings → Privacy & Security**
3. Scroll down — you'll see *"Prompt Composer was blocked from use because it is not from an identified developer"*
4. Click **Open Anyway**
5. Confirm in the dialog that appears

You only need to do this once. After that it opens normally.

---

## How to Use

### The 5-step flow

1. **Pick a template** — Choose a preset from the left panel (IES Pack, IDS Components, or Data Viz)
2. **Fill the chips** — Click the amber/orange chips to link your Figma designs and target files
3. **Edit the text** — Add specifics, tweak instructions, use quick-insert buttons at the bottom
4. **Copy** — Hit "Copy Prompt" to copy everything to your clipboard
5. **Paste into Claude Code** — Switch to your terminal and paste

### Interface overview

- **Left panel** — Three tabs: Presets (templates), Figma (saved links), Targets (file paths)
- **Right panel** — The prompt editor with Visual mode (chips) and Raw mode (plain text)
- **Header buttons** — IES Pack, IDS Components, Data Viz overlays, and a **?** help guide
- **Quick-insert bar** — Bottom of the editor, one-click snippets for common instructions

### Visual vs Raw mode

- **Visual mode** — Shows Figma links and file paths as interactive colored chips. Click to edit text, click chips to swap/unlink.
- **Raw mode** — Shows the full prompt including `{{FIGMA_LINK}}` and `{{TARGET}}` tags. Use this for big structural edits.

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+Shift+P` | Show/hide the app (global, works from any app) |

### Built-in help

Click the **?** button in the top-right corner for a searchable guide covering presets, chips, Figma links, troubleshooting, and more. Written for non-developers.

---

## Getting Updates

When a new version is available, the app shows a notification bar at the top:

> **Update available: v1.1.0** — [Download](https://github.com/BillyIntuit/prompt-composer/releases/latest)

Click "Download" to open the Releases page, grab the new `.dmg`, and drag it to Applications (it replaces the old version).

You can also check manually: [Releases page](https://github.com/BillyIntuit/prompt-composer/releases)

---

## Bugs & Feature Requests

Open an issue on this repo or ping **@billy** in the design team Slack channel.

---

## For Developers

### Run locally

```bash
npm install
npm run dev              # Start Vite dev server
npm run dev:electron     # Start Electron in dev mode (run both)
```

### Build

```bash
npm run package:mac      # Build macOS .dmg → dist/
```
