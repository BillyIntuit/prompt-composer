# Workflow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `{{TARGET}}` chip type (accepts file paths OR descriptions), Create/Update intent toggle on pack overlays, and scope quick-insert snippets.

**Architecture:** The TARGET chip is a third kind alongside "figma" and "file" in the existing chip system. The regex, parser, and renderer all get extended. The Files tab is renamed to Targets and accepts both file paths and descriptions. Pack overlays (IDS Components, Data Viz, IES Step 4) show an inline intent step before loading a template, choosing between Update and Create variants. Two new scope snippets are added to the quick-insert bar.

**Tech Stack:** React 18, inline styles (existing pattern)

**Spec:** `Reference/WORKFLOW_IMPROVEMENTS_PROMPT.md`

**Current file sizes:** `src/App.jsx` (1417 lines), `src/idsData.js` (426 lines)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/App.jsx` | Modify | Regex/parser, chip rendering, sidebar panel rename, intent toggle state + UI, overlays, quick-insert, help |
| `src/idsData.js` | Modify | Add `createTemplate` field to IDS_COMPONENT_PRESETS and DATAVIZ_PRESETS, update `template` → TARGET |

---

### Task 1: Extend the Chip System with TARGET Type

**Files:**
- Modify: `src/App.jsx:171-211` (regex, parsePrompt, promptToPlainText, replaceNthToken, rebuildPromptWithTextChange)

This is the foundation — all other tasks depend on the chip system supporting TARGET.

- [ ] **Step 1: Update the regex constants**

In `src/App.jsx`, find the three regex constants (lines 171-173):

```js
const PLACEHOLDER_RE = /(\{\{FIGMA_LINK\}\}|\{\{FILE_PATH\}\})/g;
const FILLED_RE = /(\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}|\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\})/g;
const ANY_TOKEN_RE = /(\{\{(?:FIGMA_LINK|FILE_PATH|FIGMA_FILLED:[^}]*|FILE_FILLED:[^}]*)\}\})/g;
```

Replace with:

```js
const PLACEHOLDER_RE = /(\{\{FIGMA_LINK\}\}|\{\{FILE_PATH\}\}|\{\{TARGET\}\})/g;
const FILLED_RE = /(\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}|\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}|\{\{TARGET_FILLED:([^|]*)\|([^}]*)\}\})/g;
const ANY_TOKEN_RE = /(\{\{(?:FIGMA_LINK|FILE_PATH|TARGET|FIGMA_FILLED:[^}]*|FILE_FILLED:[^}]*|TARGET_FILLED:[^}]*)\}\})/g;
```

- [ ] **Step 2: Update parsePrompt**

Find `parsePrompt` (line 175). Current body:

```js
function parsePrompt(text) {
  const parts = text.split(ANY_TOKEN_RE).filter(Boolean);
  return parts.map((part, i) => {
    if (part === "{{FIGMA_LINK}}") return { type:"placeholder", kind:"figma", key:i };
    if (part === "{{FILE_PATH}}") return { type:"placeholder", kind:"file", key:i };
    const fm = part.match(/^\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}$/);
    if (fm) return { type:"filled", kind:"figma", label:fm[1], value:fm[2], key:i };
    const ff = part.match(/^\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}$/);
    if (ff) return { type:"filled", kind:"file", label:ff[1], value:ff[2], key:i };
    return { type:"text", value:part, key:i };
  });
}
```

Replace with:

```js
function parsePrompt(text) {
  const parts = text.split(ANY_TOKEN_RE).filter(Boolean);
  return parts.map((part, i) => {
    if (part === "{{FIGMA_LINK}}") return { type:"placeholder", kind:"figma", key:i };
    if (part === "{{FILE_PATH}}") return { type:"placeholder", kind:"file", key:i };
    if (part === "{{TARGET}}") return { type:"placeholder", kind:"target", key:i };
    const fm = part.match(/^\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}$/);
    if (fm) return { type:"filled", kind:"figma", label:fm[1], value:fm[2], key:i };
    const ff = part.match(/^\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}$/);
    if (ff) return { type:"filled", kind:"file", label:ff[1], value:ff[2], key:i };
    const ft = part.match(/^\{\{TARGET_FILLED:([^|]*)\|([^}]*)\}\}$/);
    if (ft) return { type:"filled", kind:"target", label:ft[1], value:ft[2], key:i };
    return { type:"text", value:part, key:i };
  });
}
```

- [ ] **Step 3: Update promptToPlainText**

Find `promptToPlainText` (line 188). Add TARGET_FILLED handling:

```js
function promptToPlainText(text) {
  return text
    .replace(/\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v)
    .replace(/\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v)
    .replace(/\{\{TARGET_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v);
}
```

- [ ] **Step 4: Update rebuildPromptWithTextChange**

Find `rebuildPromptWithTextChange` (line 203). Current code handles "figma" and "file" kinds. Add "target":

```js
function rebuildPromptWithTextChange(segments, segIdx, newText) {
  return segments.map((seg, i) => {
    if (i === segIdx) return newText;
    if (seg.type === "text") return seg.value;
    if (seg.type === "placeholder") {
      if (seg.kind === "figma") return "{{FIGMA_LINK}}";
      if (seg.kind === "file") return "{{FILE_PATH}}";
      return "{{TARGET}}";
    }
    if (seg.type === "filled") {
      if (seg.kind === "figma") return `{{FIGMA_FILLED:${seg.label}|${seg.value}}}`;
      if (seg.kind === "file") return `{{FILE_FILLED:${seg.label}|${seg.value}}}`;
      return `{{TARGET_FILLED:${seg.label}|${seg.value}}}`;
    }
    return "";
  }).join("");
}
```

- [ ] **Step 5: Update handleSelectItem for target kind**

Find `handleSelectItem` (~line 403). Add target handling:

```js
  const handleSelectItem = (kind, label, value, id) => {
    if (!selectingFor) return;
    const tagMap = {
      figma: `{{FIGMA_FILLED:${label}|${value}}}`,
      file: `{{FILE_FILLED:${label}|${value}}}`,
      target: `{{TARGET_FILLED:${label}|${value}}}`,
    };
    setPrompt(replaceNthToken(prompt, selectingFor.tokenIndex, tagMap[kind]));
    if (kind==="figma") {
      setFigmaLinks(p => p.map(l => l.id===id?{...l,lastUsed:Date.now()}:l));
      trackRecentLink(id);
    }
    setSelectingFor(null);
    setEditorMode("visual");
    showToast(`Linked "${label}"`);
  };
```

- [ ] **Step 6: Update handleInlineSubmit for target kind**

Find `handleInlineSubmit` (~line 414). Replace:

```js
  const handleInlineSubmit = (kind) => {
    if (!inlineNew.trim() || !selectingFor) return;
    const val = inlineNew.trim();
    const label = kind==="figma" ? (val.split("node-id=")[1]||"Figma Frame") : val.split("/").pop() || val;
    const tagMap = {
      figma: `{{FIGMA_FILLED:${label}|${val}}}`,
      file: `{{FILE_FILLED:${label}|${val}}}`,
      target: `{{TARGET_FILLED:${label}|${val}}}`,
    };
    setPrompt(replaceNthToken(prompt, selectingFor.tokenIndex, tagMap[kind]));
    setSelectingFor(null);
    setInlineNew("");
    setEditorMode("visual");
    showToast(`Linked "${label}"`);
  };
```

- [ ] **Step 7: Update handleUnlink for target kind**

Find `handleUnlink` (~line 452). Replace:

```js
  const handleUnlink = () => {
    if (!popover) return;
    const placeholderMap = { figma: "{{FIGMA_LINK}}", file: "{{FILE_PATH}}", target: "{{TARGET}}" };
    setPrompt(replaceNthToken(prompt, popover.tokenIndex, placeholderMap[popover.kind]));
    setPopover(null);
    showToast("Unlinked");
  };
```

- [ ] **Step 8: Update handleSaveToLibrary for target kind**

Find `handleSaveToLibrary` (~line 426). Add target handling:

```js
  const handleSaveToLibrary = (kind, label, value) => {
    if (kind==="figma") {
      if (figmaLinks.some(l => l.url===value)) { showToast("Already saved"); return; }
      setFigmaLinks(p => [{ id:""+Date.now(), url:value, label, lastUsed:Date.now() }, ...p]);
    } else {
      // Both "file" and "target" save to filePaths/targets
      if (filePaths.some(f => f.path===value)) { showToast("Already saved"); return; }
      setFilePaths(p => [{ id:""+Date.now(), path:value, label, isDescription: !value.includes("/") && !value.includes("\\") && !value.includes(".") }, ...p]);
    }
    showToast(`Saved "${label}" to library`);
  };
```

- [ ] **Step 9: Update loadPreset to detect TARGET**

Find `loadPreset` (~line 464). Update the auto-switch-to-visual check:

```js
  const loadPreset = (p) => {
    setPrompt(p.template); setPopover(null); setSelectingFor(null);
    if (p.template.includes("{{FIGMA_LINK}}")||p.template.includes("{{FILE_PATH}}")||p.template.includes("{{TARGET}}")) setEditorMode("visual");
    showToast(`Loaded "${p.label}"`);
  };
```

- [ ] **Step 10: Update visual editor chip rendering**

Find the placeholder chip section (~line 1053). Update the icon and label for target kind:

In the placeholder chip, change:
```jsx
                            <span style={{ fontSize:13 }}>{seg.kind==="figma"?"◈":"⊡"}</span>
                            {isSelecting ? "Selecting…" : seg.kind==="figma" ? "FIGMA_LINK" : "FILE_PATH"}
```

To:
```jsx
                            <span style={{ fontSize:13 }}>{seg.kind==="figma"?"◈":seg.kind==="target"?"⊕":"⊡"}</span>
                            {isSelecting ? "Selecting…" : seg.kind==="figma" ? "FIGMA_LINK" : seg.kind==="target" ? "TARGET" : "FILE_PATH"}
```

For the placeholder chip styling, update the color for target kind. Find the style object for the placeholder chip (the amber-colored one). Change it so TARGET chips use a white/neutral color instead of amber:

In the placeholder style block:
```jsx
                              background: isSelecting ? "rgba(196,244,100,0.15)" : seg.kind==="target" ? "rgba(255,255,255,0.06)" : "rgba(244,160,36,0.1)",
                              border:`1px solid ${isSelecting ? accent : seg.kind==="target" ? "rgba(255,255,255,0.15)" : "rgba(244,160,36,0.25)"}`,
```

And the color:
```jsx
                              color: isSelecting ? accent : seg.kind==="target" ? "#999" : "#F4A024",
```

In the filled chip section (~line 1074), update the icon:
```jsx
                            <span style={{ fontSize:12 }}>{seg.kind==="figma"?"◈":seg.kind==="target"?"⊕":"⊡"}</span>
```

- [ ] **Step 11: Update handleChipClick to route target chips to targets panel**

Find `handleChipClick` (~line 378). Currently it sets `activePanel` to "figma" or "files". Add target routing:

```js
  const handleChipClick = (segIdx, kind) => {
    const tokIdx = segToTokenIdx(segIdx);
    if (tokIdx < 0) return;
    setSelectingFor({ segIndex: segIdx, tokenIndex: tokIdx, kind });
    setActivePanel(kind==="figma" ? "figma" : "files");
    setPopover(null);
  };
```

Note: TARGET chips route to the "files" panel (now renamed to "Targets") since that's where both file paths and descriptions live.

- [ ] **Step 12: Update handleSwap for target kind**

Find `handleSwap` (~line 438):

```js
  const handleSwap = () => {
    if (!popover) return;
    setSelectingFor({ segIndex: popover.segIndex, tokenIndex: popover.tokenIndex, kind: popover.kind });
    setActivePanel(popover.kind==="figma"?"figma":"files");
    setPopover(null);
  };
```

No change needed — target already routes to "files" panel correctly.

- [ ] **Step 13: Update the sidebar selection mode banner text**

Find the inline selection mode input placeholder (~line 684):

```jsx
placeholder={selectingFor.kind==="figma"?"Or paste a new Figma URL…":"Or type a new file path…"}
```

Replace with:

```jsx
placeholder={selectingFor.kind==="figma"?"Or paste a new Figma URL…":selectingFor.kind==="target"?"Or type a file path or description…":"Or type a new file path…"}
```

- [ ] **Step 14: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

Expected: Build succeeds.

- [ ] **Step 15: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: add TARGET chip type to the chip system (regex, parser, renderer)"
```

---

### Task 2: Rename Files Tab to Targets and Add Description Support

**Files:**
- Modify: `src/App.jsx` (~line 700 for tab definition, ~line 937-972 for files panel, ~line 234-237 for state)

- [ ] **Step 1: Rename the tab**

Find the sidebar tab definition (~line 700):

```jsx
{[{ id:"presets", icon:"⚡", label:"Presets" }, { id:"figma", icon:"◈", label:"Figma" }, { id:"files", icon:"⊡", label:"Files" }].map(t => (
```

Replace with:

```jsx
{[{ id:"presets", icon:"⚡", label:"Presets" }, { id:"figma", icon:"◈", label:"Figma" }, { id:"files", icon:"⊕", label:"Targets" }].map(t => (
```

- [ ] **Step 2: Update the selection mode tab highlighting**

The tab highlighting logic (~line 703) checks for `selectingFor.kind==="file"`. Add target:

```jsx
border:"none", borderBottom:`2px solid ${activePanel===t.id ? (selectingFor && ((selectingFor.kind==="figma"&&t.id==="figma")||((selectingFor.kind==="file"||selectingFor.kind==="target")&&t.id==="files")) ? accent : accent) : "transparent"}`,
```

- [ ] **Step 3: Add isDescription field to newFile state**

Find the state (~line 237):

```jsx
  const [newFile, setNewFile] = useState({ path:"", label:"" });
```

Replace with:

```jsx
  const [newFile, setNewFile] = useState({ path:"", label:"", isDescription:false });
```

- [ ] **Step 4: Update the addFileItem function**

Find `addFileItem` (~line 460):

```jsx
  const addFileItem = () => { if (!newFile.path.trim()) return; setFilePaths(p => [{ id:""+Date.now(), path:newFile.path.trim(), label:newFile.label.trim()||newFile.path.split("/").pop() }, ...p]); setNewFile({path:"",label:""}); setAddingFile(false); showToast("Saved"); };
```

Replace with:

```jsx
  const addFileItem = () => { if (!newFile.path.trim()) return; const val = newFile.path.trim(); const isDes = newFile.isDescription; setFilePaths(p => [{ id:""+Date.now(), path:val, label:newFile.label.trim()||(isDes ? val : val.split("/").pop()), isDescription:isDes }, ...p]); setNewFile({path:"",label:"",isDescription:false}); setAddingFile(false); showToast("Saved"); };
```

- [ ] **Step 5: Replace the Files panel with Targets panel**

Find the `{activePanel==="files" && (` section (~line 937-972). Replace the entire block with:

```jsx
            {activePanel==="files" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:9, color:"#333", ...mono }}>{filePaths.length} targets</span>
                  {!selectingFor && <button onClick={() => setAddingFile(!addingFile)} style={S.sBtn(addingFile)}>{addingFile?"Cancel":"+ Add"}</button>}
                </div>
                {addingFile && !selectingFor && (
                  <div style={{ ...S.card, cursor:"default", animation:"slideUp 0.1s ease", padding:12, marginBottom:10 }}>
                    <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                      {[{ l:"File path", v:false }, { l:"Description", v:true }].map(opt => (
                        <button key={opt.l} onClick={() => setNewFile(f => ({...f,isDescription:opt.v}))}
                          style={{ ...S.chip, flex:1, textAlign:"center", color: newFile.isDescription===opt.v ? accent : "#555", borderColor: newFile.isDescription===opt.v ? accent : "#1C1C1C" }}>
                          {opt.v?"💬":"⊡"} {opt.l}
                        </button>
                      ))}
                    </div>
                    <input value={newFile.label} onChange={e => setNewFile(f => ({...f,label:e.target.value}))} placeholder="Label (optional)" style={{ ...S.input, marginBottom:6 }} />
                    <input value={newFile.path} onChange={e => setNewFile(f => ({...f,path:e.target.value}))}
                      placeholder={newFile.isDescription ? "e.g. the primary button component" : "e.g. src/components/Button.tsx"}
                      style={{ ...S.input, fontSize:10, ...(newFile.isDescription ? {} : mono), marginBottom:7 }}
                      onKeyDown={e => e.key==="Enter"&&addFileItem()} />
                    <button onClick={addFileItem} style={{ width:"100%", background:accent, color:"#0A0A0A", border:"none", borderRadius:6, padding:7, fontSize:11, fontWeight:600, cursor:"pointer" }}>Save</button>
                  </div>
                )}
                {filePaths.map(f => (
                  <div key={f.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2A2A2A" : "#1C1C1C" }}
                    onClick={() => selectingFor && (selectingFor.kind==="file"||selectingFor.kind==="target") ? handleSelectItem(selectingFor.kind, f.label, f.path, f.id) : null}
                    onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&(selectingFor.kind==="file"||selectingFor.kind==="target") ? accent : "#2A2A2A"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2A2A2A" : "#1C1C1C"}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:500 }}>{f.isDescription?"💬":"⊡"} {f.label}</span>
                      {selectingFor && (selectingFor.kind==="file"||selectingFor.kind==="target") ? (
                        <span style={{ fontSize:10, color:accent, ...mono }}>← Use this</span>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setFilePaths(p => p.filter(x => x.id!==f.id)); }} style={{ background:"none",border:"none",color:"#2A2A2A",cursor:"pointer",fontSize:12 }}>×</button>
                      )}
                    </div>
                    <div style={{ fontSize:10, color:f.isDescription?"#777":accent, ...(f.isDescription?{}:mono), opacity:f.isDescription?1:.5, marginBottom: selectingFor ? 0 : 8 }}>{f.path}</div>
                    {!selectingFor && (
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => copy(f.path, f.id)} style={{ flex:1, ...S.chip, color:copiedId===f.id?accent:"#666", textAlign:"center" }}>{copiedId===f.id?"✓":"⎘"} Copy</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
```

- [ ] **Step 6: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx
git commit -m "feat: rename Files tab to Targets, add description support with file/description toggle"
```

---

### Task 3: Update All Built-in Preset Templates to Use TARGET

**Files:**
- Modify: `src/App.jsx:7-152` (DEFAULT_PRESETS and IES_STEPS)
- Modify: `src/idsData.js` (IDS_COMPONENT_PRESETS generator, DATAVIZ_PRESETS generator, cross-cutting presets)

- [ ] **Step 1: Update DEFAULT_PRESETS in App.jsx**

In each of the 9 DEFAULT_PRESETS, replace every occurrence of `{{FILE_PATH}}` with `{{TARGET}}` and update the surrounding text from "Update the component at:" or "Update:" to "Target:" with the explanation line.

Specifically, in `src/App.jsx` find and replace (using replace_all) in the presets section:

For each preset template that contains `{{FILE_PATH}}`, change the line to:
```
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
```

The presets that need updating (their id and the line containing FILE_PATH):
- `match-layout`: `Update the component at: {{FILE_PATH}}` → the target text above
- `fix-typo`: `Update: {{FILE_PATH}}` → target text
- `colors`: `Update: {{FILE_PATH}}` → target text
- `style-comp`: `Update: {{FILE_PATH}}` → target text
- `responsive`: `APPLY to: {{FILE_PATH}}` → `Target: {{TARGET}}\n(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)`
- `qa-audit`: `FILE: {{FILE_PATH}}` → `Target: {{TARGET}}`
- `correction`: `FILE: {{FILE_PATH}}` → `Target: {{TARGET}}`
- `token-audit`: `FILE: {{FILE_PATH}}` → `Target: {{TARGET}}`

**Important:** Use the Edit tool for each preset individually since the templates are multiline strings.

- [ ] **Step 2: Update IES_STEPS in App.jsx**

The IES_STEPS templates (~lines 136-152) also use `{{FILE_PATH}}`. Update each one:

- `ies-1`: `CREATE/UPDATE token file: {{FILE_PATH}}` → `Target: {{TARGET}}\n(File path or description — Claude Code will find the right files.)`
- `ies-2`: `SET UP in: {{FILE_PATH}}` → `Target: {{TARGET}}\n(File path or description.)`
- `ies-3`: `TOKEN FILE: {{FILE_PATH}}` → `Target: {{TARGET}}`
- `ies-4`: `RESTYLE: {{FILE_PATH}}` → `Target: {{TARGET}}\n(File path or description — Claude Code will find the relevant files.)`
- `ies-5b`: `LOCAL DIR: {{FILE_PATH}}` → `Target: {{TARGET}}\n(Directory path or description like "the icons folder".)`
- `ies-6`: `TOKEN FILE: {{FILE_PATH}}` → `Target: {{TARGET}}`

Steps 5a and 7 don't have `{{FILE_PATH}}` — leave them alone.

- [ ] **Step 3: Update IDS_COMPONENT_PRESETS template in idsData.js**

Find the template string in the `IDS_COMPONENT_PRESETS` generator loop (~line 281 of idsData.js):

```js
Update: {{FILE_PATH}}
Use ONLY IDS tokens — no hardcoded values.
```

Replace with:

```js
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
Use ONLY IDS tokens — no hardcoded values.
```

- [ ] **Step 4: Update DATAVIZ_PRESETS templates in idsData.js**

Find the two template sections in idsData.js that use `{{FILE_PATH}}`:

In the widget type presets (~line 355):
```js
Update: {{FILE_PATH}}
```
Replace with:
```js
Target: {{TARGET}}
(File path or description — Claude Code will find the relevant files.)
```

In the cross-cutting presets (~line 410):
```js
Update: {{FILE_PATH}}
```
Replace with:
```js
Target: {{TARGET}}
(File path or description — Claude Code will find the relevant files.)
```

- [ ] **Step 5: Update the quick-insert bar**

Find the quick-insert buttons (~line 1140-1141 of App.jsx):

```jsx
                  { l:"{{FIGMA_LINK}}", t:"{{FIGMA_LINK}}" },
                  { l:"{{FILE_PATH}}", t:"{{FILE_PATH}}" },
```

Replace with:

```jsx
                  { l:"{{FIGMA_LINK}}", t:"{{FIGMA_LINK}}" },
                  { l:"{{TARGET}}", t:"{{TARGET}}" },
                  { l:"{{FILE_PATH}}", t:"{{FILE_PATH}}" },
```

- [ ] **Step 6: Update the editor placeholder text**

Find the textarea/editor placeholder (~line 1012):

```jsx
placeholder={`Pick a preset, or start typing…\n\nType {{FIGMA_LINK}} or {{FILE_PATH}} anywhere and they'll become clickable chips in Visual mode.\n\nEvery preset follows:\n  1. Screenshot Figma design\n  2. Read exact values via MCP\n  3. Apply changes\n  4. Self-check with implementation screenshot`}
```

Replace with:

```jsx
placeholder={`Pick a preset, or start typing…\n\nType {{FIGMA_LINK}} or {{TARGET}} anywhere and they'll become clickable chips in Visual mode.\n\nEvery preset follows:\n  1. Screenshot Figma design\n  2. Read exact values via MCP\n  3. Apply changes\n  4. Self-check with implementation screenshot`}
```

- [ ] **Step 7: Update the custom preset creation hint**

Find the template hint in the preset creation form (~line 766):

```jsx
<div style={{ fontSize:9, color:"#444", ...mono, marginBottom:4 }}>TEMPLATE <span style={{ color:"#333" }}>— use {"{{FIGMA_LINK}}"} {"{{FILE_PATH}}"}</span></div>
```

Replace with:

```jsx
<div style={{ fontSize:9, color:"#444", ...mono, marginBottom:4 }}>TEMPLATE <span style={{ color:"#333" }}>— use {"{{FIGMA_LINK}}"} {"{{TARGET}}"} {"{{FILE_PATH}}"}</span></div>
```

- [ ] **Step 8: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 9: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx src/idsData.js
git commit -m "feat: update all built-in presets to use TARGET instead of FILE_PATH"
```

---

### Task 4: Add Create/Update Intent Toggle to IDS Component Pack

**Files:**
- Modify: `src/App.jsx` (state + IDS Components overlay)
- Modify: `src/idsData.js` (add createTemplate to IDS_COMPONENT_PRESETS)

- [ ] **Step 1: Add createTemplate to IDS_COMPONENT_PRESETS in idsData.js**

Find the `IDS_COMPONENT_PRESETS.push` call (~line 278). Currently it has a `template` field. Add a `createTemplate` field after it.

Replace the entire push block:

```js
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
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
Use ONLY IDS tokens — no hardcoded values.

STEP 4 — SELF-CHECK:
Screenshot the component in every state and compare against the Figma spec.

Do NOT change the component's props, API, or behavior — only visual styling.`,
      createTemplate: `Create a new ${link.label} component that matches the IDS design spec exactly.

STEP 1 — SCREENSHOT THE DESIGN:
Use Figma MCP get_screenshot on:
${link.url}

STEP 2 — READ FULL SPEC:
Use Figma MCP get_design_context to extract:
- All dimensions, padding, spacing (map to IDS spacing tokens)
- Colors for every state (map to IDS color tokens)
- Typography for all text elements (map to IDS type tokens)
- Border radius (map to IDS radius tokens)
- Shadows/elevation (map to IDS elevation tokens)
- Every interactive state: default, hover, focus, active, disabled, error

STEP 3 — CREATE:
Target location: {{TARGET}}
(This can be a path like src/components/${link.label}/ OR a description like "in the components folder alongside the other UI components".)

Build the component with:
- Clean, well-structured code following the project's existing patterns
- Props for common variants (size, variant/style, disabled state, etc.)
- All IDS tokens used — no hardcoded values anywhere
- Accessible: proper ARIA attributes, keyboard navigation, focus management
- Every visual state matching the Figma spec

STEP 4 — SELF-CHECK:
Render the component in a test page showing every variant and state. Screenshot and compare against the Figma spec.`,
    });
```

- [ ] **Step 2: Add intentStep state in App.jsx**

Find the state declarations in App.jsx, after `const [showDataViz, setShowDataViz] = useState(false);` (~line 256), add:

```jsx
  // Intent toggle (Create vs Update)
  const [intentStep, setIntentStep] = useState(null);
```

- [ ] **Step 3: Replace the IDS Components overlay with intent toggle**

Find the `{/* ─── IDS COMPONENTS OVERLAY ─── */}` section (~line 607-631). Replace the entire block with:

```jsx
      {/* ─── IDS COMPONENTS OVERLAY ─── */}
      {showIDSComponents && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(8,8,8,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #181818",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>❖ IDS Component Presets</div><div style={{ fontSize:11, color:"#777", maxWidth:600 }}>{intentStep ? `${intentStep.label} — what do you want to do?` : "Pick a component to restyle or create."}</div></div>
            <button onClick={() => { setShowIDSComponents(false); setIntentStep(null); }} style={{ background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer" }}>×</button>
          </div>

          {/* Intent step */}
          {intentStep && intentStep.overlay === "ids" && (
            <div style={{ maxWidth:500, margin:"0 auto 20px", animation:"slideUp 0.15s ease" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, textAlign:"center" }}>{intentStep.label}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={() => { loadPreset({ ...intentStep.preset, phase:"apply" }); setShowIDSComponents(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#64B5F6"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                  <div style={{ fontSize:18, marginBottom:6 }}>✏️</div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#E8E4DF" }}>Update existing</div>
                  <div style={{ fontSize:10, color:"#555" }}>Restyle an existing component</div>
                </button>
                <button onClick={() => { loadPreset({ ...intentStep.preset, template: intentStep.preset.createTemplate, phase:"apply" }); setShowIDSComponents(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                  <div style={{ fontSize:18, marginBottom:6 }}>✚</div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#E8E4DF" }}>Create from scratch</div>
                  <div style={{ fontSize:10, color:"#555" }}>Build a new IDS-compliant component</div>
                </button>
              </div>
              <button onClick={() => setIntentStep(null)} style={{ display:"block", margin:"12px auto 0", background:"none", border:"none", color:"#444", fontSize:10, cursor:"pointer", ...mono }}>← Back to components</button>
            </div>
          )}

          {/* Component grid (hidden during intent step) */}
          {(!intentStep || intentStep.overlay !== "ids") && Object.entries(IDS_LINK_LIBRARY.components.groups).map(([grpKey, grp]) => (
            <div key={grpKey} style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, ...mono, color:"#64B5F6", letterSpacing:"0.04em", marginBottom:6, textTransform:"uppercase" }}>{grp.label}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:8 }}>
                {IDS_COMPONENT_PRESETS.filter(p => p.group === grp.label).map((p, i) => (
                  <button key={p.id} onClick={() => setIntentStep({ label: p.label, preset: p, overlay: "ids" })} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
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

- [ ] **Step 4: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx src/idsData.js
git commit -m "feat: add Create/Update intent toggle to IDS Component Pack overlay"
```

---

### Task 5: Add Create/Update Intent Toggle to Data Viz Pack

**Files:**
- Modify: `src/idsData.js` (add createTemplate to DATAVIZ_PRESETS)
- Modify: `src/App.jsx` (Data Viz overlay)

- [ ] **Step 1: Add createTemplate to widget-type DATAVIZ_PRESETS in idsData.js**

Find the DATAVIZ_PRESETS push for widget types (~line 330 of idsData.js). After the `template` field, add a `createTemplate` field.

Replace the push block inside the `for (const sizeLink of sizeLinks)` loop:

```js
    DATAVIZ_PRESETS.push({
      id: `dviz-${sizeLink.id}`,
      label: `${grp.label}${gridSize ? ` — ${gridSize}` : ""}`,
      icon: "◈",
      group: grp.label,
      figmaUrl: sizeLink.url,
      featUrl: featLink ? featLink.url : null,
      template: `Restyle the existing ${grp.label} data visualization widget${gridSize ? ` at ${gridSize} size` : ""} to match Butterscotch spec.

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
Target: {{TARGET}}
(File path or description — Claude Code will find the relevant files.)
Reference the IDS data viz color tokens. Match the grid sizing spec exactly.

STEP ${featLink ? "5" : "4"} — SELF-CHECK:
Screenshot the widget with sample data and compare against ${featLink ? "both Figma frames" : "the Figma frame"}.`,
      createTemplate: `Build a new ${grp.label} data visualization component${gridSize ? ` at ${gridSize} size` : ""} from the Butterscotch spec.

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

STEP ${featLink ? "4" : "3"} — CREATE:
Target location: {{TARGET}}
(Path or description like "in the data-viz components folder".)

Build the widget with:
- A suitable chart library (Recharts, Victory, or D3 — check what the project already uses)
- Sample data structure matching the widget type
- Responsive behavior across grid sizes (1x, 2x, 3x)
- All IDS data viz color tokens — no hardcoded colors
- Interactive states: hover, selected, empty, loading, error
- Tooltip and legend matching the Figma spec

STEP ${featLink ? "5" : "4"} — SELF-CHECK:
Render the widget with sample data and compare against ${featLink ? "both Figma frames" : "the Figma frame"}.`,
    });
```

- [ ] **Step 2: Add createTemplate to cross-cutting DATAVIZ_PRESETS**

Find the cross-cutting push block (~line 397). These are primarily "update" actions so the createTemplate is simpler. Add:

```js
      createTemplate: `Build a new implementation for: ${cc.desc}

STEP 1 — SCREENSHOT:
Use Figma MCP get_screenshot on:
${cc.url}
${cc.url2 ? `\nAlso screenshot validation states:\n${cc.url2}\n` : ""}
STEP 2 — READ SPEC:
Use Figma MCP get_design_context to extract all relevant properties.

STEP 3 — CREATE:
Target location: {{TARGET}}
(Path or description — Claude Code will find the right location.)
Build following project patterns. Use IDS tokens for all values.

STEP 4 — SELF-CHECK:
Screenshot and compare against the Figma spec.`,
```

- [ ] **Step 3: Replace the Data Viz overlay with intent toggle**

Find the `{/* ─── DATA VIZ OVERLAY ─── */}` section in App.jsx (~line 634-659). Replace with:

```jsx
      {/* ─── DATA VIZ OVERLAY ─── */}
      {showDataViz && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(8,8,8,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #181818",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>◈ Butterscotch Data Viz Presets</div><div style={{ fontSize:11, color:"#777", maxWidth:600 }}>{intentStep && intentStep.overlay==="dataviz" ? `${intentStep.label} — what do you want to do?` : "Pick a widget type and grid size."}</div></div>
            <button onClick={() => { setShowDataViz(false); setIntentStep(null); }} style={{ background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer" }}>×</button>
          </div>

          {/* Intent step */}
          {intentStep && intentStep.overlay === "dataviz" && (
            <div style={{ maxWidth:500, margin:"0 auto 20px", animation:"slideUp 0.15s ease" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, textAlign:"center" }}>{intentStep.label}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={() => { loadPreset({ ...intentStep.preset, phase:"apply" }); setShowDataViz(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#F4A024"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                  <div style={{ fontSize:18, marginBottom:6 }}>✏️</div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#E8E4DF" }}>Update existing</div>
                  <div style={{ fontSize:10, color:"#555" }}>Restyle an existing widget</div>
                </button>
                <button onClick={() => { loadPreset({ ...intentStep.preset, template: intentStep.preset.createTemplate, phase:"apply" }); setShowDataViz(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1C1C1C"}>
                  <div style={{ fontSize:18, marginBottom:6 }}>✚</div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#E8E4DF" }}>Create from scratch</div>
                  <div style={{ fontSize:10, color:"#555" }}>Build a new data viz widget</div>
                </button>
              </div>
              <button onClick={() => setIntentStep(null)} style={{ display:"block", margin:"12px auto 0", background:"none", border:"none", color:"#444", fontSize:10, cursor:"pointer", ...mono }}>← Back to widgets</button>
            </div>
          )}

          {/* Widget grid (hidden during intent step) */}
          {(!intentStep || intentStep.overlay !== "dataviz") && datavizGroups.map(([groupLabel, presets]) => (
              <div key={groupLabel} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, ...mono, color:"#F4A024", letterSpacing:"0.04em", marginBottom:6, textTransform:"uppercase" }}>{groupLabel}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8 }}>
                  {presets.map((p, i) => (
                    <button key={p.id} onClick={() => setIntentStep({ label: p.label, preset: p, overlay: "dataviz" })} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
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
            ))}
        </div>
      )}
```

- [ ] **Step 4: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx src/idsData.js
git commit -m "feat: add Create/Update intent toggle to Data Viz Pack overlay"
```

---

### Task 6: Add Scope Snippets to Quick-Insert Bar

**Files:**
- Modify: `src/App.jsx` (~line 1136-1149 quick-insert section)

- [ ] **Step 1: Add the two scope snippets**

Find the quick-insert array (~line 1139). Currently ends with `"+ Token enforcement"`. Add the two new scope snippets after it:

```jsx
                {[
                  { l:"{{FIGMA_LINK}}", t:"{{FIGMA_LINK}}" },
                  { l:"{{TARGET}}", t:"{{TARGET}}" },
                  { l:"{{FILE_PATH}}", t:"{{FILE_PATH}}" },
                  { l:"+ Screenshot compare", t:"\n\nScreenshot the implementation and compare side-by-side with the Figma screenshot." },
                  { l:"+ Style-only guard", t:"\n\nDo NOT change functionality — only visual styling." },
                  { l:"+ Token enforcement", t:"\n\nUse ONLY design tokens — no hardcoded values." },
                  { l:"+ Scope: element", t:"\n\nSCOPE: Only change the following specific element — do not touch anything else:\n[Describe the exact element here]" },
                  { l:"+ Scope: state", t:"\n\nSCOPE: Only fix the following state — all other states should remain unchanged:\n[e.g., hover state, focus state, disabled state]" },
                ].map(s => (
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
git commit -m "feat: add scope snippets to quick-insert bar"
```

---

### Task 7: Update Help Overlay

**Files:**
- Modify: `src/App.jsx` (HELP_SECTIONS)
- Modify: `src/idsData.js` (IDS_HELP_ITEMS)

- [ ] **Step 1: Update existing help entries that reference FILE_PATH**

In `src/App.jsx`, find the help entry about creating presets (~line 1195):

```jsx
In the template, type {{FIGMA_LINK}} where you want a Figma link to go, and {{FILE_PATH}} where you want a file path. These become clickable chips when you use the preset.
```

Replace with:

```jsx
In the template, type {{FIGMA_LINK}} where you want a Figma link, {{TARGET}} where you want a file path or description, or {{FILE_PATH}} for a specific file path. These become clickable chips when you use the preset.
```

- [ ] **Step 2: Update the "What's a file path" help entry**

Find the Q&A about file paths (~line 1209). Replace the question and answer:

Current: `{ q:"What's a file path and how do I find it?", ...`

Replace with:

```jsx
            { q:"What's the TARGET chip and how is it different from FILE_PATH?", a:"TARGET is a flexible placeholder that accepts EITHER a file path (like src/components/Button.tsx) OR a plain English description (like 'the primary button component'). Claude Code can use either to find the right files.\n\nFILE_PATH still works and is for when you know the exact file path. TARGET is better when you're not sure — just describe what you want changed and Claude Code will find it.\n\nWhen you click a TARGET chip, the Targets panel opens. You can save both file paths and descriptions there.", tags:["target","file path","path","find","where","location","what","how","file","description","difference"] },
```

- [ ] **Step 3: Update the quick-insert help entry**

Find the Q&A about quick-insert buttons (~line 1215). Update the list:

Current: `• {{FIGMA_LINK}} / {{FILE_PATH}} — adds a new placeholder chip`

Replace with the updated answer:

```jsx
            { q:"What are the quick-insert buttons at the bottom?", a:"These are one-click snippets that append useful instructions to your prompt:\n\n• {{FIGMA_LINK}} / {{TARGET}} / {{FILE_PATH}} — adds placeholder chips\n• Screenshot compare — tells Claude Code to take before/after screenshots\n• Style-only guard — tells Claude Code not to change any behavior, just visuals\n• Token enforcement — tells Claude Code to use design tokens, not hardcoded values\n• Scope: element — limits changes to a specific element you describe\n• Scope: state — limits changes to a specific interactive state\n\nThey save you from typing the same reminders over and over.", tags:["quick insert","buttons","bottom","snippet","append","add","shortcut","scope"] },
```

- [ ] **Step 4: Add new help entries to IDS_HELP_ITEMS in idsData.js**

Find `IDS_HELP_ITEMS` in `src/idsData.js` (~line 415). Add a new entry about Create vs Update:

After the "Can I add my own links to the library?" entry, add:

```js
  { q: "What's the difference between 'Update' and 'Create' in the packs?", a: "When you pick a component from the IDS Component Pack or Data Viz Pack, you'll see two options:\n\nUpdate — for restyling an existing component to match IDS specs. It preserves your component's props and API, only changing visual styling.\n\nCreate — for building a brand new component from the Figma spec. It generates clean code with proper variants, accessibility, and all IDS tokens.\n\nPick whichever matches your situation.", tags: ["create", "update", "new", "existing", "difference", "intent", "restyle", "build"] },
```

- [ ] **Step 5: Verify build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
npm run build
```

- [ ] **Step 6: Commit**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add src/App.jsx src/idsData.js
git commit -m "feat: update help overlay with TARGET, Create/Update, and scope documentation"
```

---

### Task 8: Final Build Verification

- [ ] **Step 1: Clean build**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
rm -rf build/renderer
npm run build
```

Expected: Build succeeds.

- [ ] **Step 2: Verify key features**

Start dev mode and check:
- Type `{{TARGET}}` in raw mode → renders as white/neutral chip in visual mode
- Type `{{FILE_PATH}}` → still renders as amber chip (backward compat)
- Type `{{FIGMA_LINK}}` → still renders as amber chip
- Click a TARGET chip → sidebar switches to Targets tab
- Targets tab shows "File path" / "Description" toggle when adding
- Load an IDS Component preset → shows Update/Create choice
- Pick "Update" → loads update template with `{{TARGET}}` chip
- Pick "Create" → loads create template with `{{TARGET}}` chip
- Load a Data Viz preset → shows Update/Create choice
- Quick-insert bar shows `{{TARGET}}`, scope snippets
- Help overlay has new entries about TARGET, Create/Update, scope

- [ ] **Step 3: Commit any fixes**

```bash
cd "/Users/vhong2/Desktop/Prompt Composer"
git add -A
git commit -m "fix: address issues found during workflow improvements testing"
```

Skip if no fixes needed.
