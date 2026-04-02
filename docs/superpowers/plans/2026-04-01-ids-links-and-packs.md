# IDS Design System Links & Component Packs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the full IDS Figma link library (80+ links with categories), redesigned hierarchical Figma sidebar panel with search, IDS Component Pack overlay, Butterscotch Data Viz Pack overlay, and updated help entries.

**Architecture:** The IDS link library data and component/dataviz preset generators live in a separate data file (`src/idsData.js`) to keep App.jsx manageable. The Figma sidebar panel is rebuilt with search, collapsible "My Links" and "IDS Library" sections. Two new pack overlays (IDS Components, Data Viz) follow the same pattern as the existing IES Pack overlay. State for new UI (search, collapsed sections, new packs) is added to the main component.

**Tech Stack:** React 18, inline styles (existing pattern)

**Spec:** `Reference/IDS_LINKS_PROMPT.md`

**Current App.jsx:** 1183 lines. All modifications are to `src/App.jsx` unless noted.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/idsData.js` | Create | IDS_LINK_LIBRARY data, IDS_COMPONENT_PRESETS generator, DATAVIZ_PRESETS generator, IDS help entries |
| `src/App.jsx` | Modify | Import data, add state, replace Figma panel, add two pack overlays, add header buttons, extend help |
| `electron/store.js` | Modify | Add `recentLinkIds` to defaults |

---

### Task 1: Create the IDS Data File

**Files:**
- Create: `src/idsData.js`

This file contains all IDS data: the link library, generated component presets, generated dataviz presets, and new help entries. Keeping this separate from App.jsx prevents the component file from growing by ~500 lines of static data.

- [ ] **Step 1: Create `src/idsData.js` with IDS_LINK_LIBRARY**

Create the file with the full link library data structure from the spec:

```js
/* ═══════════════════════════════════════════════
   IDS DESIGN SYSTEM — DATA
   ═══════════════════════════════════════════════ */

export const IDS_LINK_LIBRARY = {
  foundations: {
    label: "IDS Foundations",
    icon: "◆",
    color: "#C4F464",
    groups: {
      color: {
        label: "Color",
        links: [
          { id: "ids-color", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-18714&t=LdLdglvzpyOv5cVe-4", label: "Color Tokens" },
          { id: "ids-color-dataviz", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=2694-45702&t=phYfVeilbgM6Cwc3-4", label: "Data Viz Colors (Butterscotch)" },
        ]
      },
      typography: {
        label: "Typography",
        links: [
          { id: "ids-type", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?m=auto&node-id=12671-29066&t=LdLdglvzpyOv5cVe-1", label: "Typography Scale" },
        ]
      },
      spacing: {
        label: "Spacing & Grid",
        links: [
          { id: "ids-spacing", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-32212&t=LdLdglvzpyOv5cVe-4", label: "Spacing Scale" },
          { id: "ids-grid", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-34469&t=LdLdglvzpyOv5cVe-4", label: "Responsive Grid" },
        ]
      },
      radius: {
        label: "Radius",
        links: [
          { id: "ids-radius", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-33735&t=LdLdglvzpyOv5cVe-4", label: "Border Radius" },
        ]
      },
      elevation: {
        label: "Elevation & Shadows",
        links: [
          { id: "ids-elevation", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-31599&t=LdLdglvzpyOv5cVe-4", label: "Elevation Shadows" },
        ]
      },
      icons: {
        label: "Icons",
        links: [
          { id: "ids-icons", url: "https://www.figma.com/design/Q0HemoQpvXxl4pB3YA7VDZ/IDS---Foundations-and-tokens?node-id=12671-34703&t=LdLdglvzpyOv5cVe-4", label: "Icon Library" },
        ]
      },
    }
  },

  components: {
    label: "IDS Components",
    icon: "❖",
    color: "#64B5F6",
    groups: {
      buttons: {
        label: "Buttons",
        links: [
          { id: "ids-button", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=136375-10894&t=qjryAxJfLYM1gmBF-4", label: "Button" },
          { id: "ids-button-dropdown", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=117973-51041&t=qjryAxJfLYM1gmBF-4", label: "Button — Dropdown" },
          { id: "ids-button-icon", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=117973-55292&t=qjryAxJfLYM1gmBF-4", label: "Button — Icon Control" },
          { id: "ids-button-split", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=117973-78279&t=qjryAxJfLYM1gmBF-4", label: "Button — Split Button" },
          { id: "ids-button-link", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128269-21551&t=qjryAxJfLYM1gmBF-4", label: "Button — Link Action" },
          { id: "ids-segmented-button", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119577-4840&t=qjryAxJfLYM1gmBF-4", label: "Segmented Button" },
        ]
      },
      inputs: {
        label: "Inputs & Controls",
        links: [
          { id: "ids-checkbox", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118048-13918&t=qjryAxJfLYM1gmBF-4", label: "Checkbox" },
          { id: "ids-radio", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118183-13177&t=qjryAxJfLYM1gmBF-4", label: "Radio Button" },
          { id: "ids-switch", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118183-19503&t=qjryAxJfLYM1gmBF-4", label: "Switch" },
          { id: "ids-textfield", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118224-44095&t=qjryAxJfLYM1gmBF-4", label: "Text Field" },
          { id: "ids-textarea", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118224-39968&t=qjryAxJfLYM1gmBF-4", label: "Text Area" },
          { id: "ids-dropdown", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118088-45624&t=qjryAxJfLYM1gmBF-4", label: "Dropdown" },
          { id: "ids-dropdown-typeahead", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119560-30767&t=qjryAxJfLYM1gmBF-4", label: "Dropdown Typeahead" },
          { id: "ids-status-dropdown", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128269-10682&t=qjryAxJfLYM1gmBF-4", label: "Status Dropdown" },
        ]
      },
      containers: {
        label: "Containers & Layout",
        links: [
          { id: "ids-card", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128260-8338&t=qjryAxJfLYM1gmBF-4", label: "Card" },
          { id: "ids-panel", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118168-18969&t=qjryAxJfLYM1gmBF-4", label: "Panel" },
          { id: "ids-tile", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=138217-18696&t=qjryAxJfLYM1gmBF-4", label: "Tile" },
          { id: "ids-carousel", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119560-9515&t=qjryAxJfLYM1gmBF-4", label: "Carousel" },
          { id: "ids-table", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118183-55081&t=qjryAxJfLYM1gmBF-4", label: "Table" },
          { id: "ids-skeleton", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128260-12027&t=qjryAxJfLYM1gmBF-4", label: "Skeleton" },
        ]
      },
      overlays: {
        label: "Overlays & Dialogs",
        links: [
          { id: "ids-modal", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118168-6916&t=qjryAxJfLYM1gmBF-4", label: "Modal Dialog" },
          { id: "ids-drawer", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118065-38444&t=qjryAxJfLYM1gmBF-4", label: "Drawer" },
          { id: "ids-trowser", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119577-28194&t=qjryAxJfLYM1gmBF-4", label: "Trowser" },
          { id: "ids-popover", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118183-3622&t=qjryAxJfLYM1gmBF-4", label: "Popover" },
          { id: "ids-tooltip", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119577-22397&t=qjryAxJfLYM1gmBF-4", label: "Tooltip" },
          { id: "ids-guided-tour", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128260-27751&t=qjryAxJfLYM1gmBF-4", label: "Guided Tour Tooltip" },
        ]
      },
      navigation: {
        label: "Navigation & Selection",
        links: [
          { id: "ids-tabs", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118213-39429&t=qjryAxJfLYM1gmBF-4", label: "Tabs" },
          { id: "ids-menu", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118158-5075&t=qjryAxJfLYM1gmBF-4", label: "Menu" },
          { id: "ids-pagination", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118168-14398&t=qjryAxJfLYM1gmBF-4", label: "Pagination" },
          { id: "ids-chip", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118065-34890&t=qjryAxJfLYM1gmBF-4", label: "Chip" },
          { id: "ids-combo-link", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119560-25319&t=qjryAxJfLYM1gmBF-4", label: "Combo Link" },
          { id: "ids-link", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118128-5646&t=qjryAxJfLYM1gmBF-4", label: "Link" },
          { id: "ids-info-link", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118117-9652&t=qjryAxJfLYM1gmBF-4", label: "Info Link" },
        ]
      },
      feedback: {
        label: "Feedback & Messaging",
        links: [
          { id: "ids-toast", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128337-24100&t=qjryAxJfLYM1gmBF-4", label: "Toast Message" },
          { id: "ids-page-message", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119567-18381&t=qjryAxJfLYM1gmBF-4", label: "Page Message" },
          { id: "ids-page-message-stacked", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=119577-20086&t=qjryAxJfLYM1gmBF-4", label: "Stacked Page Message" },
          { id: "ids-inline-invalid", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118117-3898&t=qjryAxJfLYM1gmBF-4", label: "Inline Invalid Message" },
          { id: "ids-loaders", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=118128-12419&t=qjryAxJfLYM1gmBF-4", label: "Loaders" },
          { id: "ids-pon", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128269-2844&t=qjryAxJfLYM1gmBF-4", label: "Point of Need (PON)" },
          { id: "ids-survey", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128260-20709&t=qjryAxJfLYM1gmBF-4", label: "Survey Tool" },
        ]
      },
      media: {
        label: "Media",
        links: [
          { id: "ids-video", url: "https://www.figma.com/design/VO8rsMYDqsDY44J9yEVyES9Y/IDS---Web-components?node-id=128260-19373&t=qjryAxJfLYM1gmBF-4", label: "Video" },
        ]
      },
    }
  },

  dataviz: {
    label: "Butterscotch Data Viz",
    icon: "◈",
    color: "#F4A024",
    groups: {
      grid: {
        label: "Widget Grid Sizing",
        links: [
          { id: "bsc-grid-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-58026&t=phYfVeilbgM6Cwc3-4", label: "1x Grid" },
          { id: "bsc-grid-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-58440&t=phYfVeilbgM6Cwc3-4", label: "2x Grid" },
          { id: "bsc-grid-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-59290&t=phYfVeilbgM6Cwc3-4", label: "3x Grid" },
        ]
      },
      donut: {
        label: "Donut Chart",
        links: [
          { id: "bsc-donut-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-60355&t=phYfVeilbgM6Cwc3-4", label: "Donut — 1x" },
          { id: "bsc-donut-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-64794&t=phYfVeilbgM6Cwc3-4", label: "Donut — 2x" },
          { id: "bsc-donut-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-68442&t=phYfVeilbgM6Cwc3-4", label: "Donut — 3x" },
          { id: "bsc-donut-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-66182&t=phYfVeilbgM6Cwc3-4", label: "Donut — Features" },
        ]
      },
      verticalBar: {
        label: "Vertical Bar Chart",
        links: [
          { id: "bsc-vbar-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-60863&t=phYfVeilbgM6Cwc3-4", label: "Vertical Bar — 1x" },
          { id: "bsc-vbar-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-72224&t=phYfVeilbgM6Cwc3-4", label: "Vertical Bar — 2x" },
          { id: "bsc-vbar-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-66527&t=phYfVeilbgM6Cwc3-4", label: "Vertical Bar — 3x" },
          { id: "bsc-vbar-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-69734&t=phYfVeilbgM6Cwc3-4", label: "Vertical Bar — Features" },
        ]
      },
      lineChart: {
        label: "Line Chart",
        links: [
          { id: "bsc-line-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-63690&t=phYfVeilbgM6Cwc3-4", label: "Line — 1x" },
          { id: "bsc-line-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-64047&t=phYfVeilbgM6Cwc3-4", label: "Line — 2x" },
          { id: "bsc-line-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-64255&t=phYfVeilbgM6Cwc3-4", label: "Line — 3x" },
          { id: "bsc-line-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-70946&t=phYfVeilbgM6Cwc3-4", label: "Line — Features" },
        ]
      },
      horizontalBar: {
        label: "Horizontal Bar Chart",
        links: [
          { id: "bsc-hbar-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-61736&t=phYfVeilbgM6Cwc3-4", label: "Horizontal Bar — 1x" },
          { id: "bsc-hbar-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-71371&t=phYfVeilbgM6Cwc3-4", label: "Horizontal Bar — 2x" },
          { id: "bsc-hbar-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-65339&t=phYfVeilbgM6Cwc3-4", label: "Horizontal Bar — 3x" },
          { id: "bsc-hbar-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-68926&t=phYfVeilbgM6Cwc3-4", label: "Horizontal Bar — Features" },
        ]
      },
      stackedBar: {
        label: "Stacked Bar Chart",
        links: [
          { id: "bsc-sbar-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-62830&t=phYfVeilbgM6Cwc3-4", label: "Stacked Bar — 1x" },
          { id: "bsc-sbar-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-73215&t=phYfVeilbgM6Cwc3-4", label: "Stacked Bar — 2x" },
          { id: "bsc-sbar-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-67407&t=phYfVeilbgM6Cwc3-4", label: "Stacked Bar — 3x" },
          { id: "bsc-sbar-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-70111&t=phYfVeilbgM6Cwc3-4", label: "Stacked Bar — Features" },
        ]
      },
      meter: {
        label: "Meter",
        links: [
          { id: "bsc-meter-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-62203&t=phYfVeilbgM6Cwc3-4", label: "Meter — 1x" },
          { id: "bsc-meter-2x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-71782&t=phYfVeilbgM6Cwc3-4", label: "Meter — 2x" },
          { id: "bsc-meter-3x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-65741&t=phYfVeilbgM6Cwc3-4", label: "Meter — 3x" },
          { id: "bsc-meter-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-69387&t=phYfVeilbgM6Cwc3-4", label: "Meter — Features" },
        ]
      },
      kpi: {
        label: "KPI",
        links: [
          { id: "bsc-kpi-1x", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-62646&t=phYfVeilbgM6Cwc3-4", label: "KPI — 1x" },
          { id: "bsc-kpi-feat", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=74-62824&t=phYfVeilbgM6Cwc3-4", label: "KPI — Features" },
        ]
      },
      chartPlotting: {
        label: "Chart Data Plotting",
        links: [
          { id: "bsc-plot-vbar", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=6635-85315&t=phYfVeilbgM6Cwc3-4", label: "Vertical Bar Plotting" },
          { id: "bsc-plot-labels", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=6635-87524&t=phYfVeilbgM6Cwc3-4", label: "Label Format & Truncation" },
          { id: "bsc-plot-casing", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=6635-88874&t=phYfVeilbgM6Cwc3-4", label: "Text Casing Guidelines" },
        ]
      },
      widgetActions: {
        label: "Widget Actions & States",
        links: [
          { id: "bsc-states", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3990-78915&t=phYfVeilbgM6Cwc3-4", label: "Widget States" },
          { id: "bsc-action-chart", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3990-89663&t=phYfVeilbgM6Cwc3-4", label: "Chart Type Switcher" },
          { id: "bsc-action-date", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3990-114328&t=phYfVeilbgM6Cwc3-4", label: "Date Picker Action" },
          { id: "bsc-action-filters", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3990-115850&t=phYfVeilbgM6Cwc3-4", label: "Filters Action" },
          { id: "bsc-action-more", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3992-88251&t=phYfVeilbgM6Cwc3-4", label: "More Options Action" },
        ]
      },
      datePicker: {
        label: "Date Picker",
        links: [
          { id: "bsc-date-period", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=810-74721&t=phYfVeilbgM6Cwc3-4", label: "Time Period Picker" },
          { id: "bsc-date-validation", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=3240-141592&t=phYfVeilbgM6Cwc3-4", label: "Validation States" },
        ]
      },
      dashboardRef: {
        label: "Dashboard Reference",
        links: [
          { id: "bsc-dashboard", url: "https://www.figma.com/design/TZnlKzMgUKANDXtrGJVhbk/Butterscotch?node-id=1746-57767&t=phYfVeilbgM6Cwc3-4", label: "Dashboard View" },
        ]
      },
    }
  }
};

/* ═══════════════════════════════════════════════
   HELPER: Flatten all library links for search
   ═══════════════════════════════════════════════ */
export function getAllLibraryLinks() {
  const results = [];
  for (const [catKey, cat] of Object.entries(IDS_LINK_LIBRARY)) {
    for (const [grpKey, grp] of Object.entries(cat.groups)) {
      for (const link of grp.links) {
        results.push({
          ...link,
          categoryKey: catKey,
          categoryLabel: cat.label,
          categoryIcon: cat.icon,
          categoryColor: cat.color,
          groupKey: grpKey,
          groupLabel: grp.label,
        });
      }
    }
  }
  return results;
}

/* ═══════════════════════════════════════════════
   IDS COMPONENT PRESETS — generated from library
   ═══════════════════════════════════════════════ */
export const IDS_COMPONENT_PRESETS = [];

for (const [grpKey, grp] of Object.entries(IDS_LINK_LIBRARY.components.groups)) {
  for (const link of grp.links) {
    IDS_COMPONENT_PRESETS.push({
      id: `ids-preset-${link.id}`,
      label: link.label,
      icon: "❖",
      group: grp.label,
      figmaUrl: link.url,
      template: `Restyle the ${link.label} component to match IDS specs.

STEP 1 — SCREENSHOT THE DESIGN:
Use Figma MCP get_screenshot on:
${link.url}

STEP 2 — READ FULL SPEC:
Use Figma MCP get_design_context to extract:
- Dimensions, padding (use IDS spacing tokens)
- Colors (use IDS color tokens)
- Typography (use IDS type tokens)
- Border radius (use IDS radius tokens)
- Shadows (use IDS elevation tokens)
- Every interactive state: default, hover, focus, active, disabled, error

STEP 3 — APPLY:
Update: {{FILE_PATH}}
Use ONLY IDS tokens — no hardcoded values.

STEP 4 — SELF-CHECK:
Screenshot the component in every state and compare against the Figma spec.

Do NOT change the component's props, API, or behavior — only visual styling.`,
    });
  }
}

/* ═══════════════════════════════════════════════
   DATAVIZ PRESETS — generated from library
   ═══════════════════════════════════════════════ */
export const DATAVIZ_PRESETS = [];

// Widget type presets (grid size variants)
const WIDGET_TYPES = ["donut", "verticalBar", "lineChart", "horizontalBar", "stackedBar", "meter", "kpi"];

for (const widgetKey of WIDGET_TYPES) {
  const grp = IDS_LINK_LIBRARY.dataviz.groups[widgetKey];
  if (!grp) continue;
  const sizeLinks = grp.links.filter(l => !l.id.endsWith("-feat"));
  const featLink = grp.links.find(l => l.id.endsWith("-feat"));

  for (const sizeLink of sizeLinks) {
    const sizeMatch = sizeLink.label.match(/— (\dx)$/);
    const gridSize = sizeMatch ? sizeMatch[1] : "";

    DATAVIZ_PRESETS.push({
      id: `dviz-${sizeLink.id}`,
      label: `${grp.label}${gridSize ? ` — ${gridSize}` : ""}`,
      icon: "◈",
      group: grp.label,
      figmaUrl: sizeLink.url,
      featUrl: featLink ? featLink.url : null,
      template: `Build/restyle the ${grp.label} data visualization widget${gridSize ? ` at ${gridSize} size` : ""}.

STEP 1 — SCREENSHOT WIDGET SPEC:
Use Figma MCP get_screenshot on:
${sizeLink.url}
${featLink ? `
STEP 2 — SCREENSHOT FEATURES/BEHAVIOR SPEC:
Use Figma MCP get_screenshot on:
${featLink.url}
` : ""}
STEP ${featLink ? "3" : "2"} — READ FULL SPEC:
Use Figma MCP get_design_context on ${featLink ? "both frames" : "the frame"}. Extract:
- Widget dimensions and grid constraints
- Chart area sizing and padding
- Axis styling (labels, ticks, gridlines)
- Data point styling (colors, radius, bar width)
- Legend layout and typography
- Tooltip styling
- Empty/loading/error states
- Color tokens from IDS data viz palette

STEP ${featLink ? "4" : "3"} — APPLY:
Update: {{FILE_PATH}}
Reference the IDS data viz color tokens. Match the grid sizing spec exactly.

STEP ${featLink ? "5" : "4"} — SELF-CHECK:
Screenshot the widget with sample data and compare against ${featLink ? "both Figma frames" : "the Figma frame"}.`,
    });
  }
}

// Cross-cutting dataviz presets
const crossCutting = [
  {
    id: "dviz-widget-states",
    label: "Widget States",
    url: IDS_LINK_LIBRARY.dataviz.groups.widgetActions.links.find(l => l.id === "bsc-states").url,
    desc: "Apply correct widget states (loading, empty, error, hover, selected).",
  },
  {
    id: "dviz-chart-switcher",
    label: "Chart Type Switcher",
    url: IDS_LINK_LIBRARY.dataviz.groups.widgetActions.links.find(l => l.id === "bsc-action-chart").url,
    desc: "Implement the chart type switching interaction.",
  },
  {
    id: "dviz-date-picker",
    label: "Date Picker",
    url: IDS_LINK_LIBRARY.dataviz.groups.datePicker.links[0].url,
    url2: IDS_LINK_LIBRARY.dataviz.groups.datePicker.links[1].url,
    desc: "Implement the date/time period picker with validation.",
  },
  {
    id: "dviz-dashboard",
    label: "Dashboard Layout",
    url: IDS_LINK_LIBRARY.dataviz.groups.dashboardRef.links[0].url,
    desc: "Build the dashboard layout matching the reference view.",
  },
];

for (const cc of crossCutting) {
  DATAVIZ_PRESETS.push({
    id: cc.id,
    label: cc.label,
    icon: "◈",
    group: "Cross-cutting",
    figmaUrl: cc.url,
    template: `${cc.desc}

STEP 1 — SCREENSHOT:
Use Figma MCP get_screenshot on:
${cc.url}
${cc.url2 ? `\nAlso screenshot validation states:\n${cc.url2}\n` : ""}
STEP 2 — READ SPEC:
Use Figma MCP get_design_context to extract all relevant properties.

STEP 3 — APPLY:
Update: {{FILE_PATH}}
Use IDS tokens for all values.

STEP 4 — SELF-CHECK:
Screenshot and compare against the Figma spec.`,
  });
}

/* ═══════════════════════════════════════════════
   IDS HELP ENTRIES
   ═══════════════════════════════════════════════ */
export const IDS_HELP_ITEMS = [
  { q: "What's the IDS Library in the Figma panel?", a: "The IDS Library is a pre-loaded collection of ~80 Figma links covering the entire Intuit Design System — foundations (colors, typography, spacing, icons), 40+ UI components, and the Butterscotch data visualization system.\n\nIt's organized in collapsible categories so you can quickly find the exact Figma frame for any IDS element. These links are read-only — they ship with the app and are always available. Use the search bar to filter across everything.", tags: ["ids", "library", "figma", "links", "design system", "what", "intuit"] },
  { q: "How do I use the IDS Component Pack?", a: "Click '❖ IDS Components' in the header. You'll see all 40+ IDS components organized by category (Buttons, Inputs, Containers, etc.).\n\nClick any component — it loads a preset that already has the correct Figma link hardcoded. You only need to fill in the FILE_PATH chip pointing to your component file.\n\nThe preset tells Claude Code to screenshot the IDS spec, read exact values, apply them using IDS tokens, and self-check.", tags: ["ids", "component", "pack", "how", "use", "preset", "button", "input", "card"] },
  { q: "What's Butterscotch / Data Viz?", a: "Butterscotch is Intuit's data visualization design system. It covers 7 widget types (donut, vertical bar, horizontal bar, stacked bar, line, meter, KPI) each available in 3 grid sizes (1x, 2x, 3x).\n\nClick '◈ Data Viz' in the header to access presets for each widget at each size. Each preset references both the widget layout spec and the features/behavior spec from Figma.", tags: ["butterscotch", "data viz", "dataviz", "chart", "widget", "donut", "bar", "line", "kpi", "meter"] },
  { q: "Can I add my own links to the library?", a: "The IDS Library itself is read-only — it ships with the app. But you can save any library link to 'My Links' by clicking the ★ icon next to it. This copies it to your personal collection where you can give it a custom label.\n\nYou can also add completely new links via the '+ Add' button in the My Links section. These are saved to your personal storage and persist across sessions.", tags: ["add", "custom", "my links", "save", "library", "personal", "own"] },
];
```

- [ ] **Step 2: Verify the file is syntactically correct**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
node --check src/idsData.js 2>&1 || echo "Expected: ESM syntax, needs Vite to process"
```

Note: This file uses ES module exports — it will be processed by Vite. `node --check` may fail on `export` syntax. That's fine.

- [ ] **Step 3: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/idsData.js
git commit -m "feat: add IDS link library data, component presets, dataviz presets, and help entries"
```

---

### Task 2: Update Storage Defaults

**Files:**
- Modify: `electron/store.js`

Add `recentLinkIds` to the store defaults for tracking recently used links across both library and personal links.

- [ ] **Step 1: Add recentLinkIds to store defaults**

In `electron/store.js`, add `recentLinkIds: []` to the defaults object:

```js
const Store = require("electron-store").default || require("electron-store");

const store = new Store({
  defaults: {
    figmaLinks: [],
    filePaths: [],
    customPresets: [],
    promptHistory: [],
    recentLinkIds: [],
    preferences: {
      editorMode: "raw",
      activePanel: "presets",
      windowBounds: { width: 1200, height: 800 },
    },
  },
});

module.exports = store;
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add electron/store.js
git commit -m "feat: add recentLinkIds to store defaults"
```

---

### Task 3: Redesign the Figma Links Sidebar Panel

**Files:**
- Modify: `src/App.jsx` (lines ~215-300 for state, lines ~665-700 for Figma panel render)

This is the largest UI change. The flat Figma links list is replaced with: search bar, collapsible "My Links" section, and collapsible "IDS Library" section with category → group → link hierarchy.

- [ ] **Step 1: Add imports and new state variables**

At the top of `src/App.jsx`, add the import (after the existing React import on line 1):

```jsx
import { IDS_LINK_LIBRARY, getAllLibraryLinks, IDS_COMPONENT_PRESETS, DATAVIZ_PRESETS, IDS_HELP_ITEMS } from "./idsData";
```

Inside the `PromptComposerV4` function, after the existing state declarations (around line 253, before the `// ═══ PERSISTENCE ═══` section), add:

```jsx
  // IDS Library state
  const [figmaSearch, setFigmaSearch] = useState("");
  const [collapsedCats, setCollapsedCats] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [myLinksCollapsed, setMyLinksCollapsed] = useState(false);
  const [recentLinkIds, setRecentLinkIds] = useState([]);
  // New pack overlays
  const [showIDSComponents, setShowIDSComponents] = useState(false);
  const [showDataViz, setShowDataViz] = useState(false);
```

- [ ] **Step 2: Add recentLinkIds to persistence hydration**

In the hydrate function (inside the existing `useEffect` that loads from store, around line 265), add after the existing `Promise.all`:

Add `window.electronAPI.store.get("recentLinkIds")` to the Promise.all array, and handle it:

Find the existing hydrate Promise.all and update it to:

```jsx
      const [links, paths, custom, history, prefs, recents] = await Promise.all([
        window.electronAPI.store.get("figmaLinks"),
        window.electronAPI.store.get("filePaths"),
        window.electronAPI.store.get("customPresets"),
        window.electronAPI.store.get("promptHistory"),
        window.electronAPI.store.get("preferences"),
        window.electronAPI.store.get("recentLinkIds"),
      ]);
      if (links?.length) setFigmaLinks(links);
      if (paths?.length) setFilePaths(paths);
      if (custom?.length) setPresets(p => [...p.filter(x => !x.custom), ...custom]);
      if (history?.length) setPromptHistory(history);
      if (prefs?.editorMode) setEditorMode(prefs.editorMode);
      if (prefs?.activePanel) setActivePanel(prefs.activePanel);
      if (recents?.length) setRecentLinkIds(recents);
```

- [ ] **Step 3: Add recentLinkIds persist effect**

After the existing persist useEffects (around line 299), add:

```jsx
  useEffect(() => { persistToStore("recentLinkIds", recentLinkIds); }, [recentLinkIds]);
```

- [ ] **Step 4: Add helper to track recent link usage**

After the `persistToStore` definition, add:

```jsx
  const trackRecentLink = useCallback((linkId) => {
    setRecentLinkIds(prev => [linkId, ...prev.filter(id => id !== linkId)].slice(0, 30));
  }, []);
```

- [ ] **Step 5: Update handleSelectItem to track recent links**

Find the existing `handleSelectItem` function and add `trackRecentLink` call. The function currently looks like:

```jsx
  const handleSelectItem = (kind, label, value, id) => {
    if (!selectingFor) return;
    const tag = kind==="figma" ? `{{FIGMA_FILLED:${label}|${value}}}` : `{{FILE_FILLED:${label}|${value}}}`;
    setPrompt(replaceNthToken(prompt, selectingFor.tokenIndex, tag));
    if (kind==="figma") setFigmaLinks(p => p.map(l => l.id===id?{...l,lastUsed:Date.now()}:l));
    setSelectingFor(null);
    setEditorMode("visual");
    showToast(`Linked "${label}"`);
  };
```

Replace it with:

```jsx
  const handleSelectItem = (kind, label, value, id) => {
    if (!selectingFor) return;
    const tag = kind==="figma" ? `{{FIGMA_FILLED:${label}|${value}}}` : `{{FILE_FILLED:${label}|${value}}}`;
    setPrompt(replaceNthToken(prompt, selectingFor.tokenIndex, tag));
    if (kind==="figma") {
      setFigmaLinks(p => p.map(l => l.id===id?{...l,lastUsed:Date.now()}:l));
      trackRecentLink(id);
    }
    setSelectingFor(null);
    setEditorMode("visual");
    showToast(`Linked "${label}"`);
  };
```

- [ ] **Step 6: Add helper to save library link to My Links**

After `handleSaveToLibrary`, add:

```jsx
  const saveLibraryLinkToMyLinks = (link) => {
    if (figmaLinks.some(l => l.url === link.url)) { showToast("Already in My Links"); return; }
    setFigmaLinks(p => [{ id: "" + Date.now(), url: link.url, label: link.label, lastUsed: Date.now() }, ...p]);
    showToast(`Saved "${link.label}" to My Links`);
  };
```

- [ ] **Step 7: Compute filtered library links**

After the existing `allCats` and `filtered` computations (around line 462), add:

```jsx
  // Figma library search
  const figmaSearchLower = figmaSearch.toLowerCase().trim();
  const allLibraryLinks = useMemo(() => getAllLibraryLinks(), []);
  const filteredLibraryLinks = figmaSearchLower
    ? allLibraryLinks.filter(l =>
        l.label.toLowerCase().includes(figmaSearchLower) ||
        l.categoryLabel.toLowerCase().includes(figmaSearchLower) ||
        l.groupLabel.toLowerCase().includes(figmaSearchLower)
      )
    : null;
  const filteredMyLinks = figmaSearchLower
    ? figmaLinks.filter(l =>
        l.label.toLowerCase().includes(figmaSearchLower) ||
        l.url.toLowerCase().includes(figmaSearchLower)
      )
    : figmaLinks;
```

- [ ] **Step 8: Replace the Figma panel render**

Replace the entire `{/* ── FIGMA LINKS ── */}` section (lines ~665-701 in the current file) — from `{activePanel==="figma" && (` through its closing `)}` — with the new hierarchical panel:

```jsx
            {/* ── FIGMA LINKS (REDESIGNED) ── */}
            {activePanel==="figma" && (
              <div>
                {/* Search bar */}
                <div style={{ marginBottom:10 }}>
                  <input
                    value={figmaSearch}
                    onChange={e => setFigmaSearch(e.target.value)}
                    placeholder="Search all links…"
                    style={{ ...S.input, fontSize:11, ...mono, padding:"7px 10px" }}
                  />
                </div>

                {/* ── MY LINKS section ── */}
                <div style={{ marginBottom:12 }}>
                  <div
                    onClick={() => !selectingFor && setMyLinksCollapsed(!myLinksCollapsed)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:6, padding:"4px 0" }}
                  >
                    <span style={{ fontSize:10, fontWeight:600, color:"#888", ...mono, letterSpacing:"0.04em" }}>
                      {myLinksCollapsed ? "▸" : "▾"} MY LINKS
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:9, color:"#333", ...mono }}>{filteredMyLinks.length}</span>
                      {!selectingFor && !myLinksCollapsed && (
                        <button onClick={(e) => { e.stopPropagation(); setAddingLink(!addingLink); }} style={S.sBtn(addingLink)}>{addingLink?"Cancel":"+ Add"}</button>
                      )}
                    </div>
                  </div>

                  {!myLinksCollapsed && (
                    <>
                      {addingLink && !selectingFor && (
                        <div style={{ ...S.card, cursor:"default", animation:"slideUp 0.1s ease", padding:12, marginBottom:10 }}>
                          <input value={newLink.label} onChange={e => setNewLink(l => ({...l,label:e.target.value}))} placeholder="Label" style={{ ...S.input, marginBottom:6 }} />
                          <input value={newLink.url} onChange={e => setNewLink(l => ({...l,url:e.target.value}))} placeholder="Figma URL" style={{ ...S.input, fontSize:10, ...mono, marginBottom:7 }} onKeyDown={e => e.key==="Enter"&&addFigma()} />
                          <button onClick={addFigma} style={{ width:"100%", background:accent, color:"#0A0A0A", border:"none", borderRadius:6, padding:7, fontSize:11, fontWeight:600, cursor:"pointer" }}>Save</button>
                        </div>
                      )}
                      {filteredMyLinks.sort((a,b) => b.lastUsed-a.lastUsed).map(l => (
                        <div key={l.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2A2A2A" : "#1C1C1C" }}
                          onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", l.label, l.url, l.id) : null}
                          onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&selectingFor.kind==="figma" ? accent : "#2A2A2A"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2A2A2A" : "#1C1C1C"}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, fontWeight:500 }}>◈ {l.label}</span>
                            {selectingFor && selectingFor.kind==="figma" ? (
                              <span style={{ fontSize:10, color:accent, ...mono }}>← Use this</span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setFigmaLinks(p => p.filter(x => x.id!==l.id)); }} style={{ background:"none",border:"none",color:"#2A2A2A",cursor:"pointer",fontSize:12 }}>×</button>
                            )}
                          </div>
                          <div style={{ fontSize:9, color:"#444", ...mono, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom: selectingFor ? 0 : 8 }}>{l.url}</div>
                          {!selectingFor && (
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={() => copy(l.url, l.id)} style={{ flex:1, ...S.chip, color:copiedId===l.id?accent:"#666", textAlign:"center" }}>{copiedId===l.id?"✓":"⎘"} Copy</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredMyLinks.length === 0 && !addingLink && (
                        <div style={{ fontSize:10, color:"#333", ...mono, padding:"8px 0", textAlign:"center" }}>
                          {figmaSearchLower ? "No matches" : "No saved links yet"}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── IDS LIBRARY section ── */}
                <div style={{ borderTop:"1px solid #1A1A1A", paddingTop:10 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:"#888", ...mono, letterSpacing:"0.04em", marginBottom:8 }}>
                    IDS LIBRARY
                  </div>

                  {/* Search results mode */}
                  {figmaSearchLower && filteredLibraryLinks ? (
                    <div>
                      <div style={{ fontSize:9, color:"#444", ...mono, marginBottom:6 }}>{filteredLibraryLinks.length} results</div>
                      {filteredLibraryLinks.map(link => (
                        <div key={link.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderLeft:`2px solid ${link.categoryColor}`, borderColor: selectingFor ? "#2A2A2A" : "#1C1C1C", borderLeftColor: link.categoryColor }}
                          onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", link.label, link.url, link.id) : null}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = selectingFor ? accent : "#2A2A2A"; e.currentTarget.style.borderLeftColor = link.categoryColor; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = selectingFor ? "#2A2A2A" : "#1C1C1C"; e.currentTarget.style.borderLeftColor = link.categoryColor; }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:500 }}>{link.categoryIcon} {link.label}</span>
                            {selectingFor && selectingFor.kind==="figma" ? (
                              <span style={{ fontSize:10, color:accent, ...mono }}>← Use this</span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); saveLibraryLinkToMyLinks(link); }} style={{ ...S.chip, color:"#555", fontSize:9 }}>★ Save</button>
                            )}
                          </div>
                          <div style={{ fontSize:8, color:"#333", ...mono }}>{link.groupLabel}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Hierarchical browse mode */
                    Object.entries(IDS_LINK_LIBRARY).map(([catKey, cat]) => {
                      const catCollapsed = collapsedCats[catKey];
                      const catLinkCount = Object.values(cat.groups).reduce((sum, g) => sum + g.links.length, 0);
                      return (
                        <div key={catKey} style={{ marginBottom:8 }}>
                          {/* Category header */}
                          <div
                            onClick={() => setCollapsedCats(prev => ({...prev, [catKey]: !prev[catKey]}))}
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"5px 0", borderLeft:`2px solid ${cat.color}`, paddingLeft:8, marginBottom:4 }}
                          >
                            <span style={{ fontSize:11, fontWeight:600, color:"#ccc" }}>
                              {catCollapsed ? "▸" : "▾"} {cat.icon} {cat.label}
                            </span>
                            <span style={{ fontSize:9, color:"#333", ...mono, background:"#141414", padding:"1px 6px", borderRadius:3 }}>{catLinkCount}</span>
                          </div>

                          {!catCollapsed && Object.entries(cat.groups).map(([grpKey, grp]) => {
                            const grpCollapsed = collapsedGroups[`${catKey}-${grpKey}`];
                            return (
                              <div key={grpKey} style={{ marginLeft:12, marginBottom:4 }}>
                                {/* Group header */}
                                <div
                                  onClick={() => setCollapsedGroups(prev => ({...prev, [`${catKey}-${grpKey}`]: !prev[`${catKey}-${grpKey}`]}))}
                                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", padding:"3px 0", marginBottom:2 }}
                                >
                                  <span style={{ fontSize:10, color:"#666", ...mono }}>
                                    {grpCollapsed ? "▸" : "▾"} {grp.label}
                                  </span>
                                  <span style={{ fontSize:8, color:"#2A2A2A", ...mono }}>{grp.links.length}</span>
                                </div>

                                {!grpCollapsed && grp.links.map(link => (
                                  <div key={link.id} style={{ ...S.card, marginLeft:8, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2A2A2A" : "#1C1C1C", padding:"8px 10px" }}
                                    onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", link.label, link.url, link.id) : null}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&selectingFor.kind==="figma" ? accent : "#2A2A2A"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2A2A2A" : "#1C1C1C"}>
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                      <span style={{ fontSize:10, fontWeight:500 }}>{link.label}</span>
                                      {selectingFor && selectingFor.kind==="figma" ? (
                                        <span style={{ fontSize:9, color:accent, ...mono }}>← Use</span>
                                      ) : (
                                        <div style={{ display:"flex", gap:3 }}>
                                          <button onClick={(e) => { e.stopPropagation(); saveLibraryLinkToMyLinks(link); }} style={{ ...S.chip, color:"#555", fontSize:8, padding:"2px 5px" }}>★</button>
                                          <button onClick={(e) => { e.stopPropagation(); copy(link.url, link.id); }} style={{ ...S.chip, color:copiedId===link.id?accent:"#555", fontSize:8, padding:"2px 5px" }}>{copiedId===link.id?"✓":"⎘"}</button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
```

- [ ] **Step 9: Verify Vite builds without errors**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: redesign Figma panel with search, My Links, and IDS Library hierarchy"
```

---

### Task 4: Add IDS Component Pack Overlay

**Files:**
- Modify: `src/App.jsx` (header buttons + new overlay)

- [ ] **Step 1: Add the IDS Components header button**

Find the header buttons section (around line 515). Currently:

```jsx
          <button onClick={() => { setShowDS(!showDS); setShowSkills(false); }} style={S.sBtn(showDS)}>◆ IES Pack</button>
          <button onClick={() => { setShowSkills(!showSkills); setShowDS(false); }} style={S.sBtn(showSkills)}>Skills</button>
```

Replace with:

```jsx
          <button onClick={() => { setShowDS(!showDS); setShowSkills(false); setShowIDSComponents(false); setShowDataViz(false); }} style={S.sBtn(showDS)}>◆ IES Pack</button>
          <button onClick={() => { setShowIDSComponents(!showIDSComponents); setShowDS(false); setShowSkills(false); setShowDataViz(false); }} style={S.sBtn(showIDSComponents)}>❖ IDS Components</button>
          <button onClick={() => { setShowDataViz(!showDataViz); setShowDS(false); setShowSkills(false); setShowIDSComponents(false); }} style={S.sBtn(showDataViz)}>◈ Data Viz</button>
          <button onClick={() => { setShowSkills(!showSkills); setShowDS(false); setShowIDSComponents(false); setShowDataViz(false); }} style={S.sBtn(showSkills)}>Skills</button>
```

- [ ] **Step 2: Add the IDS Components overlay**

After the existing `{/* ─── DS OVERLAY ─── */}` closing `)}` (around line 549), add:

```jsx
      {/* ─── IDS COMPONENTS OVERLAY ─── */}
      {showIDSComponents && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(8,8,8,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #181818",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>❖ IDS Component Presets</div><div style={{ fontSize:11, color:"#777", maxWidth:600 }}>Pick a component to restyle. Each preset has the correct Figma link — just fill in your file path.</div></div>
            <button onClick={() => setShowIDSComponents(false)} style={{ background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer" }}>×</button>
          </div>
          {Object.entries(IDS_LINK_LIBRARY.components.groups).map(([grpKey, grp]) => (
            <div key={grpKey} style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, ...mono, color:"#64B5F6", letterSpacing:"0.04em", marginBottom:6, textTransform:"uppercase" }}>{grp.label}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:8 }}>
                {IDS_COMPONENT_PRESETS.filter(p => p.group === grp.label).map((p, i) => (
                  <button key={p.id} onClick={() => { loadPreset({ ...p, phase:"apply" }); setShowIDSComponents(false); }} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#64B5F6"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:22,height:22,borderRadius:5,background:"rgba(100,181,246,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#64B5F6" }}>❖</span>
                      <span style={{ fontSize:11, fontWeight:500, color:"#E8E4DF" }}>{p.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
```

- [ ] **Step 3: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: add IDS Component Pack overlay with per-component presets"
```

---

### Task 5: Add Butterscotch Data Viz Pack Overlay

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the Data Viz overlay**

After the IDS Components overlay added in Task 4, add:

```jsx
      {/* ─── DATA VIZ OVERLAY ─── */}
      {showDataViz && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(8,8,8,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #181818",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>◈ Butterscotch Data Viz Presets</div><div style={{ fontSize:11, color:"#777", maxWidth:600 }}>Pick a widget type and grid size. Each preset references both the layout spec and features spec from Figma.</div></div>
            <button onClick={() => setShowDataViz(false)} style={{ background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer" }}>×</button>
          </div>
          {(() => {
            const groups = {};
            for (const p of DATAVIZ_PRESETS) {
              if (!groups[p.group]) groups[p.group] = [];
              groups[p.group].push(p);
            }
            return Object.entries(groups).map(([groupLabel, presets]) => (
              <div key={groupLabel} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, ...mono, color:"#F4A024", letterSpacing:"0.04em", marginBottom:6, textTransform:"uppercase" }}>{groupLabel}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8 }}>
                  {presets.map((p, i) => (
                    <button key={p.id} onClick={() => { loadPreset({ ...p, phase:"apply" }); setShowDataViz(false); }} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
                      onMouseEnter={e => e.currentTarget.style.borderColor="#F4A024"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:22,height:22,borderRadius:5,background:"rgba(244,160,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#F4A024" }}>◈</span>
                        <span style={{ fontSize:11, fontWeight:500, color:"#E8E4DF" }}>{p.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      )}
```

- [ ] **Step 2: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: add Butterscotch Data Viz Pack overlay"
```

---

### Task 6: Update Help Overlay with IDS Entries

**Files:**
- Modify: `src/App.jsx` (help overlay section)

- [ ] **Step 1: Add IDS help section to HELP_SECTIONS**

Find the `HELP_SECTIONS` definition inside the help overlay render (around line 952). It's an array of section objects. After the last section (troubleshooting), add the IDS section:

```jsx
          { cat:"ids-library", title:"IDS Design System Library", items: IDS_HELP_ITEMS.map(i => ({ ...i, tags: i.tags })) },
```

This inserts the IDS_HELP_ITEMS (imported from idsData.js) as a new help category.

- [ ] **Step 2: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: add IDS Design System Library help section"
```

---

### Task 7: Final Build Verification

- [ ] **Step 1: Clean build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
rm -rf build/renderer
npm run build
```

Expected: Build succeeds, `build/renderer/` populated.

- [ ] **Step 2: Verify all features are present**

Start dev mode and manually check:
- Header shows 4 buttons: IES Pack, IDS Components, Data Viz, Skills
- IDS Components overlay shows components grouped by category
- Data Viz overlay shows widget presets grouped by type
- Figma panel has search bar, My Links section, IDS Library section
- IDS Library has 3 collapsible categories (Foundations, Components, Data Viz)
- Search filters across all links
- Help overlay has new "IDS Design System Library" category
- Loading a component preset fills the editor with hardcoded Figma URL and a FILE_PATH chip
- Loading a dataviz preset fills the editor similarly

- [ ] **Step 3: Commit any fixes**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add -A
git commit -m "fix: address issues found during IDS feature testing"
```

Skip if no fixes needed.
