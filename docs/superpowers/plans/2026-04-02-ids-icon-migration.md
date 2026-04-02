# IDS Icon Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all ~40 Unicode symbols and emoji in Prompt Composer with SVG icons from the IDS icon library via a reusable `IdsIcon` React component.

**Architecture:** Create `src/IdsIcon.jsx` with inline SVG path data for ~50 icons. Replace every Unicode symbol reference in `src/App.jsx` and `src/idsData.js` with `<IdsIcon>` components. Backward-compatible: old custom presets with Unicode `icon` values render as text fallback.

**Tech Stack:** React 18, Vite 6, inline SVG (no external loaders)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/IdsIcon.jsx` | Create | Reusable icon component with ~50 inlined SVG path datasets |
| `src/App.jsx` | Modify | Replace all Unicode icon references with `<IdsIcon>`, update `ICON_OPTS`, update preset badge/chip/button rendering |
| `src/idsData.js` | Modify | Update `icon` fields from Unicode characters to icon name strings |

---

### Task 1: Create the IdsIcon Component

**Files:**
- Create: `src/IdsIcon.jsx`

This task extracts SVG path data from the `Icons/` directory and builds the IdsIcon component.

- [ ] **Step 1: Read all required SVG files and extract path data**

Read each of these SVG files from `Icons/` and extract the `d` attribute from every `<path>` element, plus any `fill-rule` or `clip-rule` attributes. All SVGs are 24×24 viewBox with `fill` set to `#393A3D` (we'll replace with `currentColor`).

Files to extract (33 core + 17 picker-only = 50 total):

**Core icons (used in UI):**
`lightning.svg`, `figma.svg`, `circle-plus.svg`, `document.svg`, `comment.svg`, `close.svg`, `checkmark.svg`, `copy.svg`, `star.svg`, `question.svg`, `swap.svg`, `unlink.svg`, `plus.svg`, `edit.svg`, `create.svg`, `arrow-left.svg`, `diamond.svg`, `integration-puzzle.svg`, `chart-pie.svg`, `grid-tile.svg`, `editor-text-bold.svg`, `eyedropper.svg`, `all-devices.svg`, `play.svg`, `checklist.svg`, `flag.svg`, `ruler-pencil.svg`, `dots-nine.svg`, `triangle-exclamation.svg`, `chevron-right.svg`, `chevron-down.svg`, `search.svg`, `logo.svg`

**Picker-only icons (for custom preset icon grid):**
`settings.svg`, `paintbrush.svg`, `image.svg`, `bookmark.svg`, `tag.svg`, `hexagon.svg`, `circle-check.svg`, `circle-info.svg`, `circle-exclamation.svg`, `globe-spindle.svg`, `rocket.svg`, `lightbulb.svg`, `tools.svg`, `atom.svg`, `growth.svg`, `magic-wand.svg`, `browser-window.svg`

- [ ] **Step 2: Create `src/IdsIcon.jsx`**

Write the complete IdsIcon component. The structure:

```jsx
import React from "react";

// Each icon maps to an array of path objects
// Each path has: d (required), fillRule (optional)
const ICONS = {
  "lightning": [{ d: "M8.985..." }],
  "figma": [{ d: "M14.916...", fillRule: "evenodd" }, { d: "..." }],
  // ... all 50 icons extracted in Step 1
};

export default function IdsIcon({ name, size = 16, color = "currentColor", style }) {
  const paths = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      {paths && paths.map((p, i) => (
        <path key={i} d={p.d} fillRule={p.fillRule} clipRule={p.fillRule} />
      ))}
    </svg>
  );
}

// Exported for the icon picker — all names available for custom presets
export const ICON_NAMES = Object.keys(ICONS);
```

Key implementation details:
- `ICONS` is a plain object with ~50 entries
- Each entry's value is an array of `{ d, fillRule? }` objects (some SVGs have multiple paths)
- If an SVG has `fill-rule="evenodd"`, include `fillRule: "evenodd"` on that path
- The component renders an empty `<svg>` (no paths) for unknown names — no crashes
- `ICON_NAMES` is exported so `App.jsx` can use it for the icon picker grid
- `verticalAlign: "middle"` and `flexShrink: 0` ensure proper inline alignment
- The `style` prop merges onto the `<svg>` for one-off overrides

- [ ] **Step 3: Verify the component renders**

Run: `cd "/Users/vhong2/Desktop/Prompt Composer" && npx vite build --mode development 2>&1 | head -20`
Expected: Build succeeds (or at least no import/syntax errors from IdsIcon.jsx)

- [ ] **Step 4: Commit**

```bash
git add src/IdsIcon.jsx
git commit -m "feat: create IdsIcon component with ~50 inlined IDS SVG icons"
```

---

### Task 2: Update idsData.js — Replace Unicode Icon Fields

**Files:**
- Modify: `src/idsData.js`

Replace all 6 Unicode `icon` field values with IDS icon name strings.

- [ ] **Step 1: Replace icon fields**

Make these exact replacements in `src/idsData.js`:

| Line | Old | New | Context |
|------|-----|-----|---------|
| 8 | `icon: "◆"` | `icon: "diamond"` | `IDS_LINK_LIBRARY.foundations` |
| 54 | `icon: "❖"` | `icon: "integration-puzzle"` | `IDS_LINK_LIBRARY.components` |
| 138 | `icon: "◈"` | `icon: "chart-pie"` | `IDS_LINK_LIBRARY.dataviz` |
| 278 | `icon: "❖"` | `icon: "integration-puzzle"` | `IDS_COMPONENT_PRESETS.push(...)` |
| 358 | `icon: "◈"` | `icon: "chart-pie"` | `DATAVIZ_PRESETS.push(...)` (main loop) |
| 462 | `icon: "◈"` | `icon: "chart-pie"` | `DATAVIZ_PRESETS.push(...)` (cross-cutting) |

- [ ] **Step 2: Verify no remaining Unicode icon values**

Search for any remaining Unicode icon values:

```bash
grep -n 'icon: "' src/idsData.js
```

Expected: Only the new icon name strings appear (e.g., `icon: "diamond"`, `icon: "integration-puzzle"`, `icon: "chart-pie"`). No Unicode symbols remain.

- [ ] **Step 3: Commit**

```bash
git add src/idsData.js
git commit -m "feat: update idsData.js icon fields from Unicode to IDS icon names"
```

---

### Task 3: Update App.jsx — Replace All Unicode Symbols with IdsIcon

**Files:**
- Modify: `src/App.jsx`

This is the main task. Replace every Unicode symbol in App.jsx with `<IdsIcon>` components. There are ~70 individual replacements across these categories.

- [ ] **Step 1: Add IdsIcon import**

At line 2 of `src/App.jsx`, after the existing `idsData` import, add:

```jsx
import IdsIcon, { ICON_NAMES } from "./IdsIcon";
```

- [ ] **Step 2: Update DEFAULT_PRESETS icon fields (lines 8-139)**

Replace all Unicode `icon` values in the DEFAULT_PRESETS array:

| Line | Old | New |
|------|-----|-----|
| 8 | `icon:"⊞"` | `icon:"grid-tile"` |
| 30 | `icon:"Aa"` | `icon:"editor-text-bold"` |
| 51 | `icon:"◉"` | `icon:"eyedropper"` |
| 67 | `icon:"❖"` | `icon:"integration-puzzle"` |
| 86 | `icon:"⊟"` | `icon:"all-devices"` |
| 101 | `icon:"◎"` | `icon:"play"` |
| 109 | `icon:"⊿"` | `icon:"checklist"` |
| 121 | `icon:"✎"` | `icon:"edit"` |
| 132 | `icon:"⚑"` | `icon:"flag"` |

- [ ] **Step 3: Update IES_STEPS icon fields (lines 142-158)**

| Line | Old | New |
|------|-----|-----|
| 143 | `icon:"◉"` | `icon:"eyedropper"` |
| 145 | `icon:"Aa"` | `icon:"editor-text-bold"` |
| 147 | `icon:"⤢"` | `icon:"ruler-pencil"` |
| 149 | `icon:"❖"` | `icon:"integration-puzzle"` |
| 151 | `icon:"✦"` | `icon:"dots-nine"` |
| 153 | `icon:"✦"` | `icon:"dots-nine"` |
| 155 | `icon:"◎"` | `icon:"play"` |
| 157 | `icon:"⊿"` | `icon:"checklist"` |

- [ ] **Step 4: Replace ICON_OPTS array (line 161)**

Replace:
```jsx
const ICON_OPTS = ["⊞","Aa","◉","⊿","⤢","⊟","❖","◎","✦","▢","◆","◇","⬡","✎","⚑","●","△","☰","⚙","♦"];
```

With:
```jsx
const ICON_OPTS = [
  "grid-tile","editor-text-bold","eyedropper","integration-puzzle","all-devices",
  "play","checklist","edit","flag","ruler-pencil","dots-nine","diamond","chart-pie",
  "star","lightning","search","settings","paintbrush","image","document","bookmark",
  "tag","hexagon","circle-check","circle-info","circle-exclamation","copy",
  "globe-spindle","rocket","lightbulb","tools","atom","growth","magic-wand",
  "browser-window",
];
```

- [ ] **Step 5: Replace header branding logo (line 594)**

Replace:
```jsx
<div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${accent},#8BBF3A)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#0A0A0A" }}>⌘</div>
```

With:
```jsx
<div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${accent},#8BBF3A)`, display:"flex", alignItems:"center", justifyContent:"center" }}><IdsIcon name="logo" size={16} color="#0A0A0A" /></div>
```

- [ ] **Step 6: Replace overlay header buttons (lines 601-603)**

Line 601 — IES Pack button:
Replace: `>◆ IES Pack</button>`
With: `><IdsIcon name="diamond" size={14} style={{ marginRight:4 }} /> IES Pack</button>`

Line 602 — IDS Components button:
Replace: `>❖ IDS Components</button>`
With: `><IdsIcon name="integration-puzzle" size={14} style={{ marginRight:4 }} /> IDS Components</button>`

Line 603 — Data Viz button:
Replace: `>◈ Data Viz</button>`
With: `><IdsIcon name="chart-pie" size={14} style={{ marginRight:4 }} /> Data Viz</button>`

- [ ] **Step 7: Replace help button (line 612)**

Replace: `title="Help & How-to Guide">?</button>`
With: `title="Help & How-to Guide"><IdsIcon name="question" size={16} /></button>`

- [ ] **Step 8: Replace DS overlay header + close buttons (lines 620-621)**

Line 620 — header text:
Replace: `>◆ IES Design System Adoption</div>`
With: `><IdsIcon name="diamond" size={16} style={{ marginRight:6 }} />IES Design System Adoption</div>`

Line 621 — close button:
Replace: `>×</button>`
With: `><IdsIcon name="close" size={14} /></button>`

- [ ] **Step 9: Replace IES step badge icon rendering (line 629)**

Line 629 — the `{s.icon}` in the IES step badge:
Replace: `<span style={{ width:24,height:24,borderRadius:6,background:"rgba(196,244,100,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:accent }}>{s.icon}</span>`
With: `<span style={{ width:24,height:24,borderRadius:6,background:"rgba(196,244,100,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:accent }}><IdsIcon name={s.icon} size={14} /></span>`

- [ ] **Step 10: Replace IDS Components overlay header + close + intent icons (lines 643-669)**

Line 643 — header:
Replace: `>❖ IDS Component Presets</div>`
With: `><IdsIcon name="integration-puzzle" size={16} style={{ marginRight:6 }} />IDS Component Presets</div>`

Line 644 — close button:
Replace the `>×</button>` with: `><IdsIcon name="close" size={14} /></button>`

Line 656 — Update existing icon:
Replace: `<div style={{ fontSize:18, marginBottom:6 }}>✏️</div>`
With: `<div style={{ marginBottom:6 }}><IdsIcon name="edit" size={20} color="#64B5F6" /></div>`

Line 664 — Create from scratch icon:
Replace: `<div style={{ fontSize:18, marginBottom:6 }}>✚</div>`
With: `<div style={{ marginBottom:6 }}><IdsIcon name="create" size={20} color={accent} /></div>`

Line 669 — Back button:
Replace: `>← Back to components</button>`
With: `><IdsIcon name="arrow-left" size={12} style={{ marginRight:4 }} />Back to components</button>`

- [ ] **Step 11: Replace IDS component preset badge (line 683)**

Replace: `<span style={{ width:22,height:22,borderRadius:5,background:"rgba(100,181,246,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#64B5F6" }}>❖</span>`
With: `<span style={{ width:22,height:22,borderRadius:5,background:"rgba(100,181,246,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:"#64B5F6" }}><IdsIcon name="integration-puzzle" size={14} /></span>`

- [ ] **Step 12: Replace Data Viz overlay header + close + intent + badge (lines 698-738)**

Line 698 — header:
Replace: `>◈ Butterscotch Data Viz Presets</div>`
With: `><IdsIcon name="chart-pie" size={16} style={{ marginRight:6 }} />Butterscotch Data Viz Presets</div>`

Line 699 — close button:
Replace the `>×</button>` with: `><IdsIcon name="close" size={14} /></button>`

Line 711 — Update existing icon:
Replace: `<div style={{ fontSize:18, marginBottom:6 }}>✏️</div>`
With: `<div style={{ marginBottom:6 }}><IdsIcon name="edit" size={20} color="#F4A024" /></div>`

Line 719 — Create from scratch icon:
Replace: `<div style={{ fontSize:18, marginBottom:6 }}>✚</div>`
With: `<div style={{ marginBottom:6 }}><IdsIcon name="create" size={20} color={accent} /></div>`

Line 724 — Back button:
Replace: `>← Back to widgets</button>`
With: `><IdsIcon name="arrow-left" size={12} style={{ marginRight:4 }} />Back to widgets</button>`

Line 738 — Data viz preset badge:
Replace: `<span style={{ width:22,height:22,borderRadius:5,background:"rgba(244,160,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#F4A024" }}>◈</span>`
With: `<span style={{ width:22,height:22,borderRadius:5,background:"rgba(244,160,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:"#F4A024" }}><IdsIcon name="chart-pie" size={14} /></span>`

- [ ] **Step 13: Replace Skills badge (line 754)**

Replace: `>✓ {s.name}</div>`
With: `><IdsIcon name="checkmark" size={12} style={{ marginRight:4 }} />{s.name}</div>`

- [ ] **Step 14: Replace Cancel selection button (line 782)**

Replace: `>✕ Cancel selection</button>`
With: `><IdsIcon name="close" size={12} style={{ marginRight:4 }} />Cancel selection</button>`

- [ ] **Step 15: Replace navigation tab icons (line 788)**

Replace:
```jsx
{[{ id:"presets", icon:"⚡", label:"Presets" }, { id:"figma", icon:"◈", label:"Figma" }, { id:"files", icon:"⊕", label:"Targets" }].map(t => (
```

With:
```jsx
{[{ id:"presets", icon:"lightning", label:"Presets" }, { id:"figma", icon:"figma", label:"Figma" }, { id:"files", icon:"circle-plus", label:"Targets" }].map(t => (
```

And at line 795, replace the tab icon rendering:
Replace: `<span style={{ fontSize:11 }}>{t.icon}</span>{t.label}`
With: `<IdsIcon name={t.icon} size={14} style={{ marginRight:2 }} />{t.label}`

- [ ] **Step 16: Replace phase filter icons (line 805)**

Replace:
```jsx
{[{ id:"all", l:"All" },{ id:"apply", l:"⚡ Apply" },{ id:"review", l:"⊿ Review" }].map(ph => (
```

With:
```jsx
{[{ id:"all", l:"All", icon:null },{ id:"apply", l:"Apply", icon:"lightning" },{ id:"review", l:"Review", icon:"checklist" }].map(ph => (
```

And update the button content (currently `{ph.l}`) to:
```jsx
{ph.icon && <IdsIcon name={ph.icon} size={12} style={{ marginRight:3 }} />}{ph.l}
```

Note: This changes the filter buttons from having inline emoji to having a separate icon prop rendered as `<IdsIcon>`. Update the button's rendering accordingly — the `{ph.l}` display currently includes the emoji in the label text.

- [ ] **Step 17: Replace preset badge in preset list (line 821)**

Replace: `<span style={{ width:22,height:22,borderRadius:5,background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:p.phase==="review"?"#64B5F6":accent }}>{p.icon}</span>`

With: `<span style={{ width:22,height:22,borderRadius:5,background:"#1A1A1A",display:"flex",alignItems:"center",justifyContent:"center",color:p.phase==="review"?"#64B5F6":accent }}>{ICON_NAMES.includes(p.icon) ? <IdsIcon name={p.icon} size={14} /> : <span style={{ fontSize:11 }}>{p.icon}</span>}</span>`

This is the **backward compatibility** check: if the preset's `icon` is a known IdsIcon name, render `<IdsIcon>`. Otherwise render it as text (for old custom presets saved with Unicode characters).

- [ ] **Step 18: Replace Create Preset close button (line 843)**

Replace: `>×</button>` (the one in the Create Preset form)
With: `><IdsIcon name="close" size={14} /></button>`

- [ ] **Step 19: Update icon picker grid (line 848)**

Replace the icon picker rendering:
```jsx
{ICON_OPTS.map(ic => <button key={ic} onClick={() => setDraft(d => ({...d,icon:ic}))} style={{ width:28,height:28,borderRadius:5,border:`1px solid ${draft.icon===ic?accent:"#1E1E1E"}`,background:draft.icon===ic?"rgba(196,244,100,0.07)":"#141414",color:draft.icon===ic?accent:"#666",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>{ic}</button>)}
```

With:
```jsx
{ICON_OPTS.map(ic => <button key={ic} onClick={() => setDraft(d => ({...d,icon:ic}))} style={{ width:28,height:28,borderRadius:5,border:`1px solid ${draft.icon===ic?accent:"#1E1E1E"}`,background:draft.icon===ic?"rgba(196,244,100,0.07)":"#141414",color:draft.icon===ic?accent:"#666",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><IdsIcon name={ic} size={14} /></button>)}
```

- [ ] **Step 20: Replace MY LINKS collapse toggle (line 883)**

Replace: `{myLinksCollapsed ? "▸" : "▾"} MY LINKS`
With: `<IdsIcon name={myLinksCollapsed ? "chevron-right" : "chevron-down"} size={12} style={{ marginRight:4 }} />MY LINKS`

- [ ] **Step 21: Replace Figma link label icons (line 908)**

Replace: `>◈ {l.label}</span>`
With: `><IdsIcon name="figma" size={12} style={{ marginRight:4 }} />{l.label}</span>`

- [ ] **Step 22: Replace "← Use this" selection indicators (lines 910, 950, 1003, 1057)**

Replace each `>← Use this</span>` and `>← Use</span>` with:
`><IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this</span>` (or `Use` for the shorter variant)

There are 4 occurrences:
- Line 910: `← Use this` → `<IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this`
- Line 950: `← Use this` → `<IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this`
- Line 1003: `← Use` → `<IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use`
- Line 1057: `← Use this` → `<IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this`

- [ ] **Step 23: Replace delete × buttons (lines 912, 1059)**

These are the small × delete buttons on link/file cards.

Line 912: Replace `>×</button>` (the one inside `.filter(x => x.id!==l.id)`)
With: `><IdsIcon name="close" size={12} /></button>`

Line 1059: Replace `>×</button>` (the one inside `.filter(x => x.id!==f.id)`)
With: `><IdsIcon name="close" size={12} /></button>`

- [ ] **Step 24: Replace copy/check icons in library cards (lines 918, 954, 1007, 1065)**

Each uses the pattern `{copiedId===xxx?"✓":"⎘"}`. Replace with IdsIcon:

Line 918: Replace `{copiedId===l.id?"✓":"⎘"} Copy`
With: `<IdsIcon name={copiedId===l.id?"checkmark":"copy"} size={12} style={{ marginRight:3 }} />Copy`

Line 954: Replace `{copiedId===link.id?"✓":"⎘"}`
With: `<IdsIcon name={copiedId===link.id?"checkmark":"copy"} size={12} />`

Line 1007: Replace `{copiedId===link.id?"✓":"⎘"}`
With: `<IdsIcon name={copiedId===link.id?"checkmark":"copy"} size={12} />`

Line 1065: Replace `{copiedId===f.id?"✓":"⎘"} Copy`
With: `<IdsIcon name={copiedId===f.id?"checkmark":"copy"} size={12} style={{ marginRight:3 }} />Copy`

- [ ] **Step 25: Replace ★ Save buttons (lines 953, 1006)**

Line 953: Replace `>★ Save</button>`
With: `><IdsIcon name="star" size={12} style={{ marginRight:3 }} />Save</button>`

Line 1006: Replace `>★</button>`
With: `><IdsIcon name="star" size={12} /></button>`

- [ ] **Step 26: Replace IDS library category headers (lines 975, 990)**

Line 975 (category collapse toggle + icon):
Replace: `{catCollapsed ? "▸" : "▾"} {cat.icon} {cat.label}`
With: `<IdsIcon name={catCollapsed ? "chevron-right" : "chevron-down"} size={12} style={{ marginRight:4 }} /><IdsIcon name={cat.icon} size={14} style={{ marginRight:4 }} />{cat.label}`

Note: `cat.icon` is now a string like `"diamond"` (updated in Task 2), so this works with `<IdsIcon name={cat.icon}>`.

Line 990 (group collapse toggle):
Replace: `{grpCollapsed ? "▸" : "▾"} {grp.label}`
With: `<IdsIcon name={grpCollapsed ? "chevron-right" : "chevron-down"} size={10} style={{ marginRight:3 }} />{grp.label}`

- [ ] **Step 27: Replace file type icons (lines 1037, 1055)**

Line 1037 (add file toggle):
Replace: `{opt.v?"💬":"⊡"} {opt.l}`
With: `<IdsIcon name={opt.v?"comment":"document"} size={12} style={{ marginRight:4 }} />{opt.l}`

Line 1055 (file list item):
Replace: `{f.isDescription?"💬":"⊡"} {f.label}`
With: `<IdsIcon name={f.isDescription?"comment":"document"} size={12} style={{ marginRight:4 }} />{f.label}`

- [ ] **Step 28: Replace token warning + linked count (lines 1081-1082)**

Line 1081: Replace `>⚠ {tokenCount} unfilled</span>`
With: `><IdsIcon name="triangle-exclamation" size={12} style={{ marginRight:3 }} />{tokenCount} unfilled</span>`

Line 1082: Replace `>✓ {filledCount} linked</span>`
With: `><IdsIcon name="checkmark" size={12} style={{ marginRight:3 }} />{filledCount} linked</span>`

- [ ] **Step 29: Replace editor mode toggle (lines 1096, 1101)**

Line 1096: Replace `>◈ Visual</button>`
With: `><IdsIcon name="figma" size={12} style={{ marginRight:3 }} />Visual</button>`

Line 1101: Replace `>✎ Raw</button>`
With: `><IdsIcon name="edit" size={12} style={{ marginRight:3 }} />Raw</button>`

- [ ] **Step 30: Replace chip icons — placeholder chips (line 1167)**

Replace: `<span style={{ fontSize:13 }}>{seg.kind==="figma"?"◈":seg.kind==="target"?"⊕":"⊡"}</span>`
With: `<IdsIcon name={seg.kind==="figma"?"figma":seg.kind==="target"?"circle-plus":"document"} size={14} />`

- [ ] **Step 31: Replace chip icons — filled chips (line 1187)**

Replace: `<span style={{ fontSize:12 }}>{seg.kind==="figma"?"◈":seg.kind==="target"?"⊕":"⊡"}</span>`
With: `<IdsIcon name={seg.kind==="figma"?"figma":seg.kind==="target"?"circle-plus":"document"} size={14} />`

- [ ] **Step 32: Replace chip popover header icon (line 1208)**

Replace: `{popover.kind==="figma"?"◈":popover.kind==="target"?"⊕":"⊡"} {popover.label}`
With: `<IdsIcon name={popover.kind==="figma"?"figma":popover.kind==="target"?"circle-plus":"document"} size={14} style={{ marginRight:4 }} />{popover.label}`

- [ ] **Step 33: Replace popover action button icons (lines 1215, 1220, 1226)**

Line 1215 (swap):
Replace: `<span style={{ color:accent }}>↻</span> Swap`
With: `<IdsIcon name="swap" size={14} color={accent} /> Swap`

Line 1220 (unlink):
Replace: `<span style={{ color:"#F4A024" }}>⊘</span> Unlink`
With: `<IdsIcon name="unlink" size={14} color="#F4A024" /> Unlink`

Line 1226 (save to library):
Replace: `<span style={{ color:"#64B5F6" }}>+</span> Save to library`
With: `<IdsIcon name="plus" size={14} color="#64B5F6" /> Save to library`

- [ ] **Step 34: Replace Copy Prompt button (line 1260)**

Replace: `{copiedId==="main"?"✓ Copied!":"⎘ Copy Prompt"}`
With: `<>{copiedId==="main"?<><IdsIcon name="checkmark" size={14} style={{ marginRight:4 }} />Copied!</>:<><IdsIcon name="copy" size={14} style={{ marginRight:4 }} />Copy Prompt</>}</>`

- [ ] **Step 35: Replace library link search result icon (line 948)**

Replace: `>{link.categoryIcon} {link.label}</span>`
With: `><IdsIcon name={link.categoryIcon} size={12} style={{ marginRight:4 }} />{link.label}</span>`

Note: `link.categoryIcon` comes from `getAllLibraryLinks()` in idsData.js — it reads `cat.icon` which is now an icon name string (updated in Task 2). So `<IdsIcon name={link.categoryIcon}>` will work.

- [ ] **Step 36: Replace help overlay icons (lines 1370, 1380, 1386, 1402)**

Line 1370 — Help header icon:
Replace: `fontSize:18, color:accent }}>?</div>`
With: `color:accent }}><IdsIcon name="question" size={20} /></div>`

Line 1380 — Help close button:
Replace: `>×</button>`
With: `><IdsIcon name="close" size={16} /></button>`

Line 1386 — Search icon:
Replace: `<span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, color:"#444", pointerEvents:"none" }}>⌕</span>`
With: `<span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#444", pointerEvents:"none" }}><IdsIcon name="search" size={16} /></span>`

Line 1402 — Search clear button:
Replace: `>✕</button>`
With: `><IdsIcon name="close" size={12} /></button>`

- [ ] **Step 37: Verify build succeeds**

Run: `cd "/Users/vhong2/Desktop/Prompt Composer" && npx vite build --mode development 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 38: Search for remaining Unicode icons**

Run a grep to find any remaining Unicode symbols that should have been replaced:

```bash
grep -nP '[⊞◈⊕⊡⊿⊟◎◉❖◆✦⤢✎⚑✕✚⎘⌘⌕⊘↻]' src/App.jsx
```

Expected: No results (all replaced). If any remain, fix them.

Also check for emoji that should be replaced:
```bash
grep -nP '[⚡★✓⚠←]' src/App.jsx
```

Expected: No results. Note that some of these (like ← ✓) may appear in string literals inside help text — those are fine. Only icon rendering should be updated, not help text content describing the old UI.

- [ ] **Step 39: Commit**

```bash
git add src/App.jsx
git commit -m "feat: replace all Unicode icons in App.jsx with IdsIcon components"
```
