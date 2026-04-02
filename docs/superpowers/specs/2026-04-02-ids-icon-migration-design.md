# IDS Icon Migration — Design Spec

## Goal

Replace all Unicode symbols and emoji used throughout Prompt Composer with SVG icons from the IDS (Intuit Design System) icon library, delivered via a reusable `IdsIcon` React component.

## Motivation

The app currently uses ~40 Unicode symbols (⊞, ◈, ⊡, ❖, etc.) for icons. These render inconsistently across platforms and don't match the IDS design system the team works in daily. The IDS icon library (`Icons/` directory) contains ~560 production SVGs at 24x24. Adopting them gives the app a consistent, professional look.

## Architecture

### IdsIcon Component (`src/IdsIcon.jsx`)

A single React component that contains all needed SVG path data inline (no runtime file loading).

**Props:**
- `name` (string, required) — icon identifier, e.g. `"copy"`, `"lightning"`
- `size` (number, default 16) — width and height in px
- `color` (string, default `"currentColor"`) — SVG fill color
- `style` (object, optional) — additional inline styles merged onto the `<svg>` element

**Renders:** An inline `<svg>` with `viewBox="0 0 24 24"`, sized to `size × size`, fill set to `color`. Falls back to an empty `<svg>` (same dimensions, no paths) if the name is not found — no crashes, just invisible.

**Icon count:** ~40 icons included (the curated set below). Path data is extracted from the source SVGs in `Icons/` at build time (copied into the component as string constants).

### Icon Mapping

Every Unicode symbol in the app maps to a specific IDS icon:

**Navigation / Tabs:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| ⚡ | `lightning` | lightning.svg | Presets tab |
| ◈ | `figma` | figma.svg | Figma tab |
| ⊕ | `circle-plus` | circle-plus.svg | Targets tab |

**Chip System:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| ◈ | `figma` | figma.svg | Figma link chip (placeholder + filled) |
| ⊕ | `circle-plus` | circle-plus.svg | Target chip (placeholder + filled) |
| ⊡ | `document` | document.svg | File path chip (placeholder + filled) |
| 💬 | `comment` | comment.svg | Description-type target in sidebar |

**Action Buttons:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| × / ✕ | `close` | close.svg | Close overlays, cancel selection, delete items |
| ✓ | `checkmark` | checkmark.svg | Copied/confirmed state |
| ⎘ | `copy` | copy.svg | Copy to clipboard |
| ★ | `star` | star.svg | Save to My Links |
| ? | `question` | question.svg | Help button |
| ↻ | `swap` | swap.svg | Swap chip value (popover) |
| ⊘ | `unlink` | unlink.svg | Unlink chip (popover) |
| + | `plus` | plus.svg | Add new item, save to library (popover) |
| ✏️ | `edit` | edit.svg | Update existing (intent toggle) |
| ✚ | `create` | create.svg | Create from scratch (intent toggle) |
| ← | `arrow-left` | arrow-left.svg | Back navigation in intent step |

**Pack Overlay Headers & IDS Library Categories:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| ◆ | `diamond` | diamond.svg | IES Pack button, IDS Foundations category |
| ❖ | `integration-puzzle` | integration-puzzle.svg | IDS Components button + category |
| ◈ | `chart-pie` | chart-pie.svg | Data Viz button + Butterscotch category |

**Preset Badge Icons (DEFAULT_PRESETS):**
| Old | New Icon Name | SVG Source | Preset |
|-----|--------------|------------|--------|
| ⊞ | `grid-tile` | grid-tile.svg | Match Layout |
| Aa | `editor-text-bold` | editor-text-bold.svg | Fix Typography |
| ◉ | `eyedropper` | eyedropper.svg | Correct Colors |
| ❖ | `integration-puzzle` | integration-puzzle.svg | Style Component |
| ⊟ | `all-devices` | all-devices.svg | Responsive Fix |
| ◎ | `play` | play.svg | Add Motion |
| ⊿ | `checklist` | checklist.svg | Visual QA Audit |
| ✎ | `edit` | edit.svg | Targeted Correction |
| ⚑ | `flag` | flag.svg | Token Audit |

**IES Steps Badge Icons:**
| Old | New Icon Name | SVG Source | Step |
|-----|--------------|------------|------|
| ◉ | `eyedropper` | eyedropper.svg | 1. Tokens & Colors |
| Aa | `editor-text-bold` | editor-text-bold.svg | 2. Typography Scale |
| ⤢ | `ruler-pencil` | ruler-pencil.svg | 3. Spacing & Radius |
| ❖ | `integration-puzzle` | integration-puzzle.svg | 4. Component Restyling |
| ✦ | `dots-nine` | dots-nine.svg | 5a. Icons Inventory |
| ✦ | `dots-nine` | dots-nine.svg | 5b. Icons Export |
| ◎ | `play` | play.svg | 6. Motion System |
| ⊿ | `checklist` | checklist.svg | 7. Final Audit |

**Status & Indicators:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| ⚠ | `triangle-exclamation` | triangle-exclamation.svg | Unfilled token warning |
| ▸ | `chevron-right` | chevron-right.svg | Collapsed section |
| ▾ | `chevron-down` | chevron-down.svg | Expanded section |
| 🔍 / ⌕ | `search` | search.svg | Search (help overlay) |

**App Branding:**
| Old | New Icon Name | SVG Source | Use |
|-----|--------------|------------|-----|
| ⌘ | `logo` | logo.svg | Header logo |

### Icon Sizes

Three standard sizes used throughout the app:
- **14px** — inline icons in chips, small action buttons (copy, close, star on library cards)
- **16px** — action buttons (close overlays, help button, tab icons)
- **20px** — preset badge icons (in the 22×22 badge container), overlay header icons

### Color Inheritance

All icons use `currentColor` by default, inheriting from their parent's `color` CSS property. This preserves all existing color behavior:
- Accent green (`#C4F464`) for active states, filled chips
- Amber (`#F4A024`) for unfilled chips, warning states
- Blue (`#64B5F6`) for IDS Components category
- Gray tones (`#444`, `#555`, `#666`, `#888`) for inactive/secondary states
- White (`#ccc`, `#E8E4DF`) for primary text/icon color

### Custom Preset Icon Picker

The `ICON_OPTS` array changes from Unicode characters to icon names. The picker grid renders `IdsIcon` components instead of text spans.

**Curated set (~35 icons):**
`grid-tile`, `editor-text-bold`, `eyedropper`, `integration-puzzle`, `all-devices`, `play`, `checklist`, `edit`, `flag`, `ruler-pencil`, `dots-nine`, `diamond`, `chart-pie`, `star`, `lightning`, `search`, `settings`, `paintbrush`, `image`, `document`, `bookmark`, `tag`, `hexagon`, `circle-check`, `circle-info`, `circle-exclamation`, `copy`, `globe-spindle`, `rocket`, `lightbulb`, `tools`, `atom`, `growth`, `magic-wand`, `browser-window`

When a user picks an icon for a custom preset, the `icon` field stores the icon name string (e.g. `"rocket"`) instead of a Unicode character.

### Backward Compatibility

Custom presets saved with old Unicode `icon` values (e.g. `"◇"`) need graceful handling. The `IdsIcon` component returns an empty SVG for unknown names. As a fallback, the preset badge renderer checks: if the `icon` value is not a known IdsIcon name, render it as text (the old Unicode character). This way old custom presets don't lose their icons.

### Files Changed

| File | Action | What Changes |
|------|--------|-------------|
| `src/IdsIcon.jsx` | Create | Icon component with ~40 inlined SVG path datasets |
| `src/App.jsx` | Modify | Replace all Unicode icon references with `<IdsIcon>`, update ICON_OPTS, update preset/chip/button rendering |
| `src/idsData.js` | Modify | Update `icon` fields in IDS_LINK_LIBRARY categories, IDS_COMPONENT_PRESETS generator, DATAVIZ_PRESETS generator |

### What Does NOT Change

- Chip text labels (`FIGMA_LINK`, `TARGET`, `FILE_PATH`) remain as text
- All colors, hover states, animations — icons inherit via currentColor
- Layout, sizing, spacing of existing UI elements
- Any functionality or data flow
