import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { IDS_LINK_LIBRARY, getAllLibraryLinks, IDS_COMPONENT_PRESETS, DATAVIZ_PRESETS, IDS_HELP_ITEMS } from "./idsData";
import IdsIcon, { ICON_NAMES } from "./IdsIcon";

/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */
const DEFAULT_PRESETS = [
  { id:"match-layout", label:"Match Layout", icon:"grid-tile", category:"Apply", phase:"apply", custom:false,
    template:`Match the layout and spacing of this Figma frame in the implementation.

STEP 1 — SCREENSHOT THE DESIGN:
Use Figma MCP get_screenshot on this frame to see the target:
{{FIGMA_LINK}}

STEP 2 — READ EXACT VALUES:
Use Figma MCP get_design_context on the same frame to extract:
- Padding, margins, and gap values
- Flex/grid alignment and direction
- Container widths and constraints

STEP 3 — APPLY:
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
Match every spatial value from the design context.

STEP 4 — SELF-CHECK:
After making changes, screenshot the running implementation and compare it side-by-side with the Figma screenshot. List any remaining differences.

Do NOT change colors, typography, or functionality — only layout and spacing.` },
  { id:"fix-typo", label:"Fix Typography", icon:"editor-text-bold", category:"Apply", phase:"apply", custom:false,
    template:`The typography doesn't match the design.

STEP 1 — SCREENSHOT:
Use Figma MCP get_screenshot on:
{{FIGMA_LINK}}

STEP 2 — READ TYPE SPECS:
Use Figma MCP get_design_context to extract for every text element:
- Font family, weight, size
- Line height and letter spacing
- Text color and opacity

STEP 3 — APPLY:
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)

STEP 4 — SELF-CHECK:
Screenshot implementation and compare text rendering against Figma.

Only change typography — not layout, spacing, or functionality.` },
  { id:"colors", label:"Correct Colors", icon:"eyedropper", category:"Apply", phase:"apply", custom:false,
    template:`Fix the color palette to match the design.

STEP 1 — SCREENSHOT:
Use Figma MCP get_screenshot:
{{FIGMA_LINK}}

STEP 2 — READ COLORS:
Use get_design_context to extract all colors: backgrounds, text, borders, shadows.

STEP 3 — APPLY:
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)

STEP 4 — SELF-CHECK:
Screenshot and compare. Only change colors.` },
  { id:"style-comp", label:"Style Component", icon:"integration-puzzle", category:"Apply", phase:"apply", custom:false,
    template:`Restyle this component to match design spec.

STEP 1 — SCREENSHOT:
Use Figma MCP get_screenshot on:
{{FIGMA_LINK}}

STEP 2 — READ FULL SPEC:
Use get_design_context for dimensions, padding, radius, colors, typography, shadows, and all states.

STEP 3 — APPLY:
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
Match every visual property. Use design tokens where available.

STEP 4 — SELF-CHECK:
Screenshot every state (default, hover, focus, active, disabled) and compare.

Do NOT change props, API, or behavior — only visual styling.` },
  { id:"responsive", label:"Responsive Fix", icon:"all-devices", category:"Apply", phase:"apply", custom:false,
    template:`Fix responsive behavior at smaller viewports.

STEP 1 — SCREENSHOT mobile design:
Use Figma MCP get_screenshot:
{{FIGMA_LINK}}

STEP 2 — READ mobile specs via get_design_context.

STEP 3 — APPLY:
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)
Fix breakpoints at 768px and 375px. Touch targets ≥44px. No overflow.

STEP 4 — SELF-CHECK at 375px and 768px widths.` },
  { id:"motion", label:"Add Motion", icon:"play", category:"Apply", phase:"apply", custom:false,
    template:`Add transitions and animations.

REFERENCE: {{FIGMA_LINK}}
Target: {{TARGET}}
(This can be a file path like src/components/Button.tsx OR a description like "the primary button component" — find the relevant files and update them.)

Use transform/opacity only. Duration 150-300ms. Add prefers-reduced-motion.` },
  { id:"visual-qa", label:"Visual QA Audit", icon:"checklist", category:"Review", phase:"review", custom:false,
    template:`Thorough visual comparison between implementation and design.

STEP 1 — SCREENSHOT BOTH:
Figma: use get_screenshot on {{FIGMA_LINK}}
Implementation: screenshot at same viewport size.

STEP 2 — COMPARE everything: layout, typography, colors, radius, states.

STEP 3 — REPORT (do NOT fix):
| Element | Current | Expected | File:Line | CSS Fix |
Sort by severity: Critical → Moderate → Minor.` },
  { id:"correction", label:"Targeted Correction", icon:"edit", category:"Review", phase:"review", custom:false,
    template:`Previous changes need specific corrections.

DESIGN: {{FIGMA_LINK}}
Target: {{TARGET}}

WHAT'S STILL WRONG:
[Describe specific issues here]

For each: screenshot current state → read Figma values → fix → screenshot to verify.
Only touch the specific things listed.` },
  { id:"token-audit", label:"Token Audit", icon:"flag", category:"Review", phase:"review", custom:false,
    template:`Audit for hardcoded values that should use design tokens.

Target: {{TARGET}}

Flag: hardcoded colors, spacing, fonts, radius, shadows.
Report: | Line | Current | Recommended Token | Confidence |
Ask before replacing.` },
];

const IES_STEPS = [
  { id:"ies-1", label:"1. Tokens & Colors", icon:"eyedropper", cat:"DS",
    template:`Adopt IES design tokens.\n\nSCREENSHOT token reference: use get_screenshot on:\n{{FIGMA_LINK}}\n\nEXTRACT all color tokens via get_design_context: primitives + semantic aliases.\n\nCREATE/UPDATE token file: {{TARGET}}\n\nREPLACE all hardcoded colors codebase-wide with tokens.\n\nSELF-CHECK: screenshot 3 key screens before/after.` },
  { id:"ies-2", label:"2. Typography Scale", icon:"editor-text-bold", cat:"DS",
    template:`Adopt IES type scale.\n\nSCREENSHOT: {{FIGMA_LINK}}\nREAD via get_design_context: families, weights, sizes, line-heights, letter-spacing.\n\nSET UP in: {{TARGET}}\nAdd @font-face, create type tokens, map semantic roles.\n\nAPPLY across codebase. Check for overflow/truncation.\nSELF-CHECK: screenshot key pages.` },
  { id:"ies-3", label:"3. Spacing & Radius", icon:"ruler-pencil", cat:"DS",
    template:`Adopt IES spacing, radius, elevation.\n\nREFERENCE: {{FIGMA_LINK}}\nTOKEN FILE: {{TARGET}}\n\nExtract spacing scale, radius scale, elevation scale.\nCreate tokens. Replace all hardcoded values.\nFlag anything that doesn't map cleanly.\n\nSELF-CHECK: screenshot cards, buttons, inputs.` },
  { id:"ies-4", label:"4. Component — [Name]", icon:"integration-puzzle", cat:"DS",
    template:`Restyle ONE component to IES specs. Run per-component.\n\nCOMPONENT: [Button / Input / Card / etc.]\n\nSCREENSHOT: {{FIGMA_LINK}}\nREAD full spec via get_design_context.\n\nRESTYLE: {{TARGET}}\nUse ONLY IES tokens. Cover every state.\n\nSELF-CHECK: screenshot all states and compare.` },
  { id:"ies-5a", label:"5a. Icons — Inventory", icon:"dots-nine", cat:"DS",
    template:`Scan IES icon library — DO NOT change anything.\n\nSCREENSHOT icon frame: {{FIGMA_LINK}}\nENUMERATE via get_design_context: names, sizes, variants.\n\nCROSS-REFERENCE with codebase usage.\nREPORT: available, used, matched, missing.` },
  { id:"ies-5b", label:"5b. Icons — Export", icon:"dots-nine", cat:"DS",
    template:`Export IES icons and set up icon system.\n\nFIGMA FRAME: {{FIGMA_LINK}}\nLOCAL DIR: {{TARGET}}\n\nExport SVGs via Figma MCP. Save as icon-name.svg.\nCreate Icon component (sizes: 16,20,24,32; currentColor).\nReplace all existing icon implementations.\n\nSELF-CHECK: screenshot page with icons.` },
  { id:"ies-6", label:"6. Motion System", icon:"play", cat:"DS",
    template:`Adopt IES motion.\n\nREFERENCE: {{FIGMA_LINK}}\nTOKEN FILE: {{TARGET}}\n\nExtract durations + easings. Create motion tokens.\nApply to all interactive elements.\nAdd prefers-reduced-motion.\n\nSELF-CHECK: interact with every animated element.` },
  { id:"ies-7", label:"7. Final Audit", icon:"checklist", cat:"DS",
    template:`Full DS compliance audit.\n\nREFERENCE: {{FIGMA_LINK}}\n\nScreenshot every screen vs Figma.\nSearch for hardcoded values.\nVerify component states.\nCheck a11y: contrast, focus, touch targets.\n\nREPORT only — do NOT fix.` },
];

const ICON_OPTS = [
  "grid-tile","editor-text-bold","eyedropper","integration-puzzle","all-devices",
  "play","checklist","edit","flag","ruler-pencil","dots-nine","diamond","chart-pie",
  "star","lightning","search","settings","paintbrush","image","document","bookmark",
  "tag","hexagon","circle-check","circle-info","circle-exclamation","copy",
  "globe-spindle","rocket","lightbulb","tools","atom","growth","magic-wand",
  "browser-window",
];
const CAT_OPTS = ["Apply","Review","Layout","Typography","Color","Component","Motion","Custom"];

const SKILLS = [
  { id:"fs", name:"Figma Screenshot", desc:"get_screenshot — visual image of any node" },
  { id:"fc", name:"Figma Context", desc:"get_design_context — properties & specs" },
  { id:"fds", name:"Figma DS Search", desc:"search_design_system — components & variables" },
  { id:"fe", name:"File Edit", desc:"Targeted file changes by path" },
  { id:"mf", name:"Multi-file Edit", desc:"Edit multiple files in one pass" },
  { id:"cs", name:"Codebase Search", desc:"Find patterns across all files" },
  { id:"bs", name:"Browser Screenshot", desc:"Screenshot running implementation" },
  { id:"a11", name:"Accessibility", desc:"Contrast, focus, ARIA audit" },
];

/* ═══════════════════════════════════════════════
   HELPERS — parse prompt into segments
   ═══════════════════════════════════════════════ */
const PLACEHOLDER_RE = /(\{\{FIGMA_LINK\}\}|\{\{FILE_PATH\}\}|\{\{TARGET\}\})/g;
const FILLED_RE = /(\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}|\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}|\{\{TARGET_FILLED:([^|]*)\|([^}]*)\}\})/g;
const ANY_TOKEN_RE = /(\{\{(?:FIGMA_LINK|FILE_PATH|TARGET|FIGMA_FILLED:[^}]*|FILE_FILLED:[^}]*|TARGET_FILLED:[^}]*)\}\})/g;

function parsePrompt(text) {
  const parts = text.split(ANY_TOKEN_RE).filter(Boolean);
  const raw = parts.map((part, i) => {
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
  // Ensure text segments exist between/around chips so the user always has a place to click and type
  const result = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].type !== "text" && (i === 0 || result[result.length - 1].type !== "text")) {
      result.push({ type:"text", value:"", key:`pad-${i}` });
    }
    result.push(raw[i]);
  }
  if (result.length === 0 || result[result.length - 1].type !== "text") {
    result.push({ type:"text", value:"", key:`pad-end` });
  }
  return result;
}

function promptToPlainText(text) {
  return text
    .replace(/\{\{FIGMA_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v)
    .replace(/\{\{FILE_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v)
    .replace(/\{\{TARGET_FILLED:([^|]*)\|([^}]*)\}\}/g, (_, _l, v) => v);
}

function replaceNthToken(text, idx, replacement) {
  let count = 0;
  return text.replace(ANY_TOKEN_RE, (match) => {
    if (count === idx) { count++; return replacement; }
    count++;
    return match;
  });
}

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

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function PromptComposerV4() {
  const [prompt, setPrompt] = useState("");
  const [presets, setPresets] = useState([...DEFAULT_PRESETS]);
  const [figmaLinks, setFigmaLinks] = useState([]);
  const [filePaths, setFilePaths] = useState([]);

  const [activePanel, setActivePanel] = useState("presets");
  const [activePhase, setActivePhase] = useState("all");
  const [activeCategory, setActiveCategory] = useState("All");
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [promptHistory, setPromptHistory] = useState([]);

  // Preset creation
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ label:"", icon:"star", category:"Custom", template:"" });

  // Add link/file
  const [addingLink, setAddingLink] = useState(false);
  const [newLink, setNewLink] = useState({ url:"", label:"" });
  const [addingFile, setAddingFile] = useState(false);
  const [newFile, setNewFile] = useState({ path:"", label:"", isDescription:false });

  // DS Pack
  const [showDS, setShowDS] = useState(false);
  // Skills
  const [showSkills, setShowSkills] = useState(false);
  // Help
  const [showHelp, setShowHelp] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");
  const [helpCategory, setHelpCategory] = useState("all");

  // IDS Library state
  const [figmaSearch, setFigmaSearch] = useState("");
  const [collapsedCats, setCollapsedCats] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [myLinksCollapsed, setMyLinksCollapsed] = useState(false);
  const [recentLinkIds, setRecentLinkIds] = useState([]);
  // New pack overlays
  const [showIDSComponents, setShowIDSComponents] = useState(false);
  const [showDataViz, setShowDataViz] = useState(false);
  // Intent toggle (Create vs Update)
  const [intentStep, setIntentStep] = useState(null);

  // ═══ CHIP INTERACTION STATE ═══
  const [selectingFor, setSelectingFor] = useState(null);
  const [popover, setPopover] = useState(null);
  const [inlineNew, setInlineNew] = useState("");
  // Editor mode: "raw" (textarea) or "visual" (chips + editable text)
  const [editorMode, setEditorMode] = useState("raw");

  // ═══ PERSISTENCE ═══
  const isElectron = typeof window !== "undefined" && window.electronAPI;

  // Hydrate state from store on mount
  useEffect(() => {
    if (!isElectron) return;
    const hydrate = async () => {
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

  const trackRecentLink = useCallback((linkId) => {
    setRecentLinkIds(prev => [linkId, ...prev.filter(id => id !== linkId)].slice(0, 30));
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
    persistToStore("preferences", { editorMode, activePanel });
  }, [editorMode, activePanel]);
  useEffect(() => { persistToStore("recentLinkIds", recentLinkIds); }, [recentLinkIds]);

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

  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const uiFont = "'Avenir Next for Intuit','Avenir Next',system-ui,sans-serif";
  const mono = { fontFamily:"'JetBrains Mono',monospace" };
  const accent = "#00d0e0";

  const showToast = useCallback((m) => { setToast(m); setTimeout(() => setToast(null), 2000); }, []);
  const copy = async (t, id) => { try { await navigator.clipboard.writeText(t); setCopiedId(id); showToast("Copied"); setTimeout(() => setCopiedId(null), 2000); } catch {} };

  // ── Parsed segments ──
  const segments = useMemo(() => parsePrompt(prompt), [prompt]);
  const tokenCount = segments.filter(s => s.type==="placeholder").length;
  const filledCount = segments.filter(s => s.type==="filled").length;

  // ── Convert segment index to token-only index ──
  // segments includes text + tokens, but replaceNthToken only counts token matches
  const segToTokenIdx = useCallback((segIdx) => {
    let tokenCount = 0;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].type !== "text") {
        if (i === segIdx) return tokenCount;
        tokenCount++;
      }
    }
    return -1;
  }, [segments]);

  // ── Convert token-only index back to segment index ──
  const tokenToSegIdx = useCallback((tokIdx) => {
    let tokenCount = 0;
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].type !== "text") {
        if (tokenCount === tokIdx) return i;
        tokenCount++;
      }
    }
    return -1;
  }, [segments]);

  // ── Click placeholder chip → enter selecting mode ──
  // Store BOTH the segment index (for visual highlighting) and token index (for replacement)
  const handleChipClick = (segIdx, kind) => {
    const tokIdx = segToTokenIdx(segIdx);
    if (tokIdx < 0) return;
    setSelectingFor({ segIndex: segIdx, tokenIndex: tokIdx, kind });
    setActivePanel(kind==="figma" ? "figma" : "files");
    setPopover(null);
    setInlineNew("");
  };

  // ── Click filled chip → show popover ──
  const handleFilledClick = (segIdx, kind, label, value, e) => {
    const tokIdx = segToTokenIdx(segIdx);
    const rect = e.currentTarget.getBoundingClientRect();
    const editorRect = editorRef.current?.getBoundingClientRect() || { left:0, top:0 };
    setPopover({
      segIndex: segIdx, tokenIndex: tokIdx, kind, label, value,
      x: rect.left - editorRect.left,
      y: rect.bottom - editorRect.top + 4,
    });
    setSelectingFor(null);
  };

  // ── Select from sidebar (in selecting mode) ──
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

  // ── Inline new value (from selecting mode) ──
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

  // ── Save inline value to library ──
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

  const saveLibraryLinkToMyLinks = (link) => {
    if (figmaLinks.some(l => l.url === link.url)) { showToast("Already in My Links"); return; }
    setFigmaLinks(p => [{ id: "" + Date.now(), url: link.url, label: link.label, lastUsed: Date.now() }, ...p]);
    showToast(`Saved "${link.label}" to My Links`);
  };

  // ── Popover actions ──
  const handleSwap = () => {
    if (!popover) return;
    setSelectingFor({ segIndex: popover.segIndex, tokenIndex: popover.tokenIndex, kind: popover.kind });
    setActivePanel(popover.kind==="figma"?"figma":"files");
    setPopover(null);
  };
  const handleUnlink = () => {
    if (!popover) return;
    const placeholderMap = { figma: "{{FIGMA_LINK}}", file: "{{TARGET}}", target: "{{TARGET}}" };
    setPrompt(replaceNthToken(prompt, popover.tokenIndex, placeholderMap[popover.kind]));
    setPopover(null);
    showToast("Unlinked");
  };
  const handlePopoverSave = () => { if (!popover) return; handleSaveToLibrary(popover.kind, popover.label, popover.value); setPopover(null); };

  // ── Load preset ──
  const loadPreset = (p) => {
    setPrompt(p.template); setPopover(null); setSelectingFor(null);
    // Auto-switch to visual if preset has tokens
    if (p.template.includes("{{")) setEditorMode("visual");
    showToast(`Loaded "${p.label}"`);
  };

  // ── Copy final prompt (plain text) ──
  const copyPrompt = () => {
    const plain = promptToPlainText(prompt);
    if (!plain.trim()) return;
    copy(plain, "main");
    setPromptHistory(p => [{ text:prompt, plain, ts:Date.now() }, ...p].slice(0,50));
  };

  // ── Preset CRUD ──
  const savePreset = () => {
    if (!draft.label.trim()||!draft.template.trim()) return;
    if (editingId) { setPresets(p => p.map(x => x.id===editingId?{...x,...draft,custom:true}:x)); }
    else { setPresets(p => [...p, { ...draft, id:"c-"+Date.now(), custom:true, phase:"apply" }]); }
    showToast(editingId?"Updated":"Created");
    setDraft({ label:"", icon:"star", category:"Custom", template:"" }); setShowCreate(false); setEditingId(null);
  };

  // ── Add figma/file ──
  const addFigma = () => { if (!newLink.url.trim()) return; setFigmaLinks(p => [{ id:""+Date.now(), url:newLink.url.trim(), label:newLink.label.trim()||"Untitled", lastUsed:Date.now() }, ...p]); setNewLink({url:"",label:""}); setAddingLink(false); showToast("Saved"); };
  const addFileItem = () => { if (!newFile.path.trim()) return; const val = newFile.path.trim(); const isDes = newFile.isDescription; setFilePaths(p => [{ id:""+Date.now(), path:val, label:newFile.label.trim()||(isDes ? val : val.split("/").pop()), isDescription:isDes }, ...p]); setNewFile({path:"",label:"",isDescription:false}); setAddingFile(false); showToast("Saved"); };

  // ── Filters ──
  const allCats = ["All", ...new Set(presets.map(p => p.category))];
  const filtered = presets.filter(p => {
    if (activeCategory!=="All"&&p.category!==activeCategory) return false;
    if (activePhase!=="all"&&p.phase!==activePhase) return false;
    return true;
  });

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

  // Grouped dataviz presets (static data, compute once)
  const datavizGroups = useMemo(() => {
    const groups = {};
    for (const p of DATAVIZ_PRESETS) {
      if (!groups[p.group]) groups[p.group] = [];
      groups[p.group].push(p);
    }
    return Object.entries(groups);
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popover && !e.target.closest('[data-popover]') && !e.target.closest('[data-filled-chip]')) setPopover(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popover]);

  // ── Styles ──
  // IDS Button base tokens
  const btnBase = { borderRadius:6, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:uiFont, transition:"all 0.15s", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:4, lineHeight:1 };
  const S = {
    card: { background:"#0a2e52", border:"1px solid #1a4a7a", borderRadius:10, padding:"12px 14px", marginBottom:6, transition:"border-color 0.2s", cursor:"pointer" },
    chip: { background:"#103a68", border:"1px solid #1e5080", borderRadius:5, padding:"3px 8px", fontSize:10, cursor:"pointer", fontFamily:uiFont, transition:"all 0.15s" },
    input: { width:"100%", background:"#0d3460", border:"1px solid #1e5080", borderRadius:7, padding:"8px 11px", color:"#ebf1f3", fontSize:12, fontFamily:uiFont },
    // IDS Primary: solid accent fill, dark text — for primary actions (active toggles, CTA)
    sBtn: (a) => ({ ...btnBase, background:a?accent:"transparent", color:a?"#00254a":"#a8bfcf", border:`1px solid ${a?accent:"#5d7a9a"}`, padding:"6px 14px", fontWeight:a?600:500 }),
    // IDS Primary large: bigger padding for main CTA (Copy Prompt)
    btnPrimaryLg: (enabled) => ({ ...btnBase, background:enabled?accent:"#103a68", color:enabled?"#00254a":"#5d7a9a", border:"none", borderRadius:8, padding:"10px 22px", fontWeight:600, cursor:enabled?"pointer":"default", boxShadow:enabled?"0 4px 20px rgba(0,208,224,0.1)":"none" }),
    // IDS Secondary: transparent bg, border — for secondary actions (Clear, Cancel)
    btnSecondary: { ...btnBase, background:"transparent", color:"#a8bfcf", border:"1px solid #5d7a9a", borderRadius:8, padding:"10px 14px" },
    // IDS Tertiary/Ghost: no border, text only — for minor actions (Cancel link, Back)
    btnGhost: { ...btnBase, background:"none", border:"none", color:"#7a93aa", padding:"4px 8px", fontSize:10 },
    // IDS Icon button: square, for icon-only actions (close, help)
    btnIcon: { ...btnBase, width:32, height:32, borderRadius:8, background:"transparent", border:"1px solid #5d7a9a", color:"#a8bfcf", padding:0, fontSize:15 },
    // IDS Small: compact for inline use (category pills, phase toggles)
    btnSmall: (a) => ({ ...btnBase, padding:"4px 10px", borderRadius:5, fontSize:10, background:a?"rgba(255,255,255,0.05)":"transparent", color:a?"#d5e3ec":"#5d7a9a", border:`1px solid ${a?"#5d7a9a":"transparent"}`, fontWeight:a?500:400 }),
    // IDS Pill: for category/filter selections
    btnPill: (a) => ({ ...btnBase, padding:"3px 10px", borderRadius:4, fontSize:9, background:a?accent:"transparent", color:a?"#00254a":"#7a93aa", border:`1px solid ${a?accent:"#5d7a9a"}`, fontWeight:a?600:400 }),
    // IDS Confirm: full-width accent for forms (Save link, Save file)
    btnConfirm: { ...btnBase, width:"100%", background:accent, color:"#00254a", border:"none", borderRadius:6, padding:7, fontWeight:600 },
    // IDS Create/Save: flex for form dual-button layouts
    btnCreate: (enabled) => ({ ...btnBase, flex:1, background:enabled?accent:"#103a68", color:enabled?"#00254a":"#5d7a9a", border:"none", borderRadius:7, padding:9, fontWeight:600, cursor:enabled?"pointer":"default" }),
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:"#00254a", color:"#ebf1f3", fontFamily:uiFont }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes selectGlow{0%,100%{box-shadow:0 0 0 2px rgba(0,208,224,0.2)}50%{box-shadow:0 0 0 4px rgba(0,208,224,0.35)}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a4a7a;border-radius:4px}
        textarea:focus,input:focus{outline:none}
      `}</style>

      {/* Toast */}
      {toast && <div style={{ position:"fixed",top:16,right:16,zIndex:300,background:accent,color:"#00254a",padding:"9px 18px",borderRadius:8,fontSize:12,fontWeight:500,animation:"fadeIn 0.2s ease",boxShadow:"0 6px 24px rgba(0,208,224,0.2)" }}>{toast}</div>}

      {/* ─── HEADER ─── */}
      <div style={{ padding:"12px 20px", borderBottom:"1px solid #1a4a7a", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#001a38" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:`linear-gradient(135deg,${accent},#00b0c0)`, display:"flex", alignItems:"center", justifyContent:"center", }}><IdsIcon name="logo" size={16} color="#00254a" /></div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, letterSpacing:"-0.02em" }}>Prompt Composer</div>
            <div style={{ fontSize:9, color:"#5d7a9a" }}>Apply → Review → Correct</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => { setShowDS(!showDS); setShowSkills(false); setShowIDSComponents(false); setShowDataViz(false); }} style={S.sBtn(showDS)}><IdsIcon name="diamond" size={14} style={{ marginRight:4 }} /> IES Pack</button>
          <button onClick={() => { setShowIDSComponents(!showIDSComponents); setShowDS(false); setShowSkills(false); setShowDataViz(false); }} style={S.sBtn(showIDSComponents)}><IdsIcon name="integration-puzzle" size={14} style={{ marginRight:4 }} /> IDS Components</button>
          <button onClick={() => { setShowDataViz(!showDataViz); setShowDS(false); setShowSkills(false); setShowIDSComponents(false); }} style={S.sBtn(showDataViz)}><IdsIcon name="chart-pie" size={14} style={{ marginRight:4 }} /> Data Viz</button>
          <button onClick={() => { setShowSkills(!showSkills); setShowDS(false); setShowIDSComponents(false); setShowDataViz(false); }} style={S.sBtn(showSkills)}>Skills</button>
          <button onClick={() => setShowHelp(true)} style={S.btnIcon}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,208,224,0.08)"; e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a8bfcf"; e.currentTarget.style.borderColor = "#5d7a9a"; }}
          title="Help & How-to Guide"><IdsIcon name="question" size={16} /></button>
        </div>
      </div>

      {/* ─── DS OVERLAY ─── */}
      {showDS && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(0,26,56,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #1a4a7a",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}><IdsIcon name="diamond" size={16} style={{ marginRight:6 }} />IES Design System Adoption</div><div style={{ fontSize:11, color:"#9bb3c5", maxWidth:600 }}>Work through in order. Step 4 runs per-component. Steps 5a/5b handle icon inventory then export.</div></div>
            <button onClick={() => setShowDS(false)} style={S.btnGhost}><IdsIcon name="close" size={14} /></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:8 }}>
            {IES_STEPS.map((s,i) => (
              <button key={s.id} onClick={() => { loadPreset(s); setShowDS(false); }} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.03}s both` }}
                onMouseEnter={e => e.currentTarget.style.borderColor=accent}
                onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <span style={{ width:24,height:24,borderRadius:6,background:"rgba(0,208,224,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:accent }}><IdsIcon name={s.icon} size={14} /></span>
                  <span style={{ fontSize:11, fontWeight:500, color:"#ebf1f3" }}>{s.label}</span>
                </div>
                <div style={{ fontSize:9, color:"#5d7a9a", ...mono, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.template.split("\n")[0]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── IDS COMPONENTS OVERLAY ─── */}
      {showIDSComponents && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(0,26,56,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #1a4a7a",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}><IdsIcon name="integration-puzzle" size={16} style={{ marginRight:6 }} />IDS Component Presets</div><div style={{ fontSize:11, color:"#9bb3c5", maxWidth:600 }}>{intentStep ? `${intentStep.label} — what do you want to do?` : "Pick a component to restyle or create."}</div></div>
            <button onClick={() => { setShowIDSComponents(false); setIntentStep(null); }} style={S.btnGhost}><IdsIcon name="close" size={14} /></button>
          </div>

          {/* Intent step */}
          {intentStep && intentStep.overlay === "ids" && (
            <div style={{ maxWidth:500, margin:"0 auto 20px", animation:"slideUp 0.15s ease" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, textAlign:"center" }}>{intentStep.label}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={() => { loadPreset({ ...intentStep.preset, phase:"apply" }); setShowIDSComponents(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#64B5F6"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                  <div style={{ marginBottom:6 }}><IdsIcon name="edit" size={20} color="#64B5F6" /></div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#ebf1f3" }}>Update existing</div>
                  <div style={{ fontSize:10, color:"#7a93aa" }}>Restyle an existing component</div>
                </button>
                <button onClick={() => { loadPreset({ ...intentStep.preset, template: intentStep.preset.createTemplate, phase:"apply" }); setShowIDSComponents(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                  <div style={{ marginBottom:6 }}><IdsIcon name="create" size={20} color={accent} /></div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#ebf1f3" }}>Create from scratch</div>
                  <div style={{ fontSize:10, color:"#7a93aa" }}>Build a new IDS-compliant component</div>
                </button>
              </div>
              <button onClick={() => setIntentStep(null)} style={{ ...S.btnGhost, display:"block", margin:"12px auto 0" }}><IdsIcon name="arrow-left" size={12} style={{ marginRight:4 }} />Back to components</button>
            </div>
          )}

          {/* Component grid (hidden during intent step) */}
          {(!intentStep || intentStep.overlay !== "ids") && Object.entries(IDS_LINK_LIBRARY.components.groups).map(([grpKey, grp]) => (
            <div key={grpKey} style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, color:"#64B5F6", letterSpacing:"0.04em", fontWeight:600, marginBottom:6, textTransform:"uppercase" }}>{grp.label}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:8 }}>
                {IDS_COMPONENT_PRESETS.filter(p => p.group === grp.label).map((p, i) => (
                  <button key={p.id} onClick={() => setIntentStep({ label: p.label, preset: p, overlay: "ids" })} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#64B5F6"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ width:22,height:22,borderRadius:5,background:"rgba(100,181,246,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:"#64B5F6" }}><IdsIcon name="integration-puzzle" size={14} /></span>
                      <span style={{ fontSize:11, fontWeight:500, color:"#ebf1f3" }}>{p.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── DATA VIZ OVERLAY ─── */}
      {showDataViz && (
        <div style={{ position:"absolute",top:56,left:0,right:0,zIndex:50,background:"rgba(0,26,56,0.97)",backdropFilter:"blur(12px)",borderBottom:"1px solid #1a4a7a",padding:"20px 24px",maxHeight:"70vh",overflowY:"auto",animation:"slideUp 0.2s ease" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div><div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}><IdsIcon name="chart-pie" size={16} style={{ marginRight:6 }} />Butterscotch Data Viz Presets</div><div style={{ fontSize:11, color:"#9bb3c5", maxWidth:600 }}>{intentStep && intentStep.overlay==="dataviz" ? `${intentStep.label} — what do you want to do?` : "Pick a widget type and grid size."}</div></div>
            <button onClick={() => { setShowDataViz(false); setIntentStep(null); }} style={S.btnGhost}><IdsIcon name="close" size={14} /></button>
          </div>

          {/* Intent step */}
          {intentStep && intentStep.overlay === "dataviz" && (
            <div style={{ maxWidth:500, margin:"0 auto 20px", animation:"slideUp 0.15s ease" }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:12, textAlign:"center" }}>{intentStep.label}</div>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={() => { loadPreset({ ...intentStep.preset, phase:"apply" }); setShowDataViz(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#F4A024"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                  <div style={{ marginBottom:6 }}><IdsIcon name="edit" size={20} color="#F4A024" /></div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#ebf1f3" }}>Update existing</div>
                  <div style={{ fontSize:10, color:"#7a93aa" }}>Restyle an existing widget</div>
                </button>
                <button onClick={() => { loadPreset({ ...intentStep.preset, template: intentStep.preset.createTemplate, phase:"apply" }); setShowDataViz(false); setIntentStep(null); }}
                  style={{ ...S.card, flex:1, maxWidth:220, textAlign:"center", padding:"16px 12px", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor=accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                  <div style={{ marginBottom:6 }}><IdsIcon name="create" size={20} color={accent} /></div>
                  <div style={{ fontSize:12, fontWeight:600, marginBottom:4, color:"#ebf1f3" }}>Create from scratch</div>
                  <div style={{ fontSize:10, color:"#7a93aa" }}>Build a new data viz widget</div>
                </button>
              </div>
              <button onClick={() => setIntentStep(null)} style={{ ...S.btnGhost, display:"block", margin:"12px auto 0" }}><IdsIcon name="arrow-left" size={12} style={{ marginRight:4 }} />Back to widgets</button>
            </div>
          )}

          {/* Widget grid (hidden during intent step) */}
          {(!intentStep || intentStep.overlay !== "dataviz") && datavizGroups.map(([groupLabel, presets]) => (
              <div key={groupLabel} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:"#F4A024", letterSpacing:"0.04em", fontWeight:600, marginBottom:6, textTransform:"uppercase" }}>{groupLabel}</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:8 }}>
                  {presets.map((p, i) => (
                    <button key={p.id} onClick={() => setIntentStep({ label: p.label, preset: p, overlay: "dataviz" })} style={{ ...S.card, textAlign:"left", animation:`slideUp 0.25s ease ${i*0.02}s both` }}
                      onMouseEnter={e => e.currentTarget.style.borderColor="#F4A024"}
                      onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ width:22,height:22,borderRadius:5,background:"rgba(244,160,36,0.07)",display:"flex",alignItems:"center",justifyContent:"center",color:"#F4A024" }}><IdsIcon name="chart-pie" size={14} /></span>
                        <span style={{ fontSize:11, fontWeight:500, color:"#ebf1f3" }}>{p.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Skills */}
      {showSkills && (
        <div style={{ padding:"10px 20px",borderBottom:"1px solid #1a4a7a",background:"#001a38",animation:"slideUp 0.15s ease" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {SKILLS.map(s => (
              <div key={s.id} title={s.desc} style={{ padding:"4px 10px", borderRadius:5, fontSize:10, background:"rgba(0,208,224,0.06)", color:accent, border:"1px solid rgba(0,208,224,0.15)" }}><IdsIcon name="checkmark" size={12} style={{ marginRight:4 }} />{s.name}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", height:`calc(100vh - ${56 + (showSkills?42:0)}px)` }}>

        {/* ═══ LEFT PANEL ═══ */}
        <div style={{ width:320, borderRight:"1px solid #1a4a7a", display:"flex", flexDirection:"column", background:"#001a38", flexShrink:0 }}>

          {/* Selecting mode banner */}
          {selectingFor && (
            <div style={{ padding:"10px 14px", background:"rgba(0,208,224,0.06)", borderBottom:`1px solid rgba(0,208,224,0.15)`, animation:"fadeIn 0.15s ease" }}>
              <div style={{ fontSize:11, fontWeight:600, color:accent, marginBottom:6 }}>
                Select a {selectingFor.kind==="figma"?"Figma link":"file path"} for the highlighted chip
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <input value={inlineNew} onChange={e => setInlineNew(e.target.value)} placeholder={selectingFor.kind==="figma"?"Or paste a new Figma URL…":selectingFor.kind==="target"?"Or type a file path or description…":"Or type a new file path…"} style={{ ...S.input, fontSize:11, ...mono, flex:1 }}
                  onKeyDown={e => e.key==="Enter" && handleInlineSubmit(selectingFor.kind)} />
                {selectingFor.kind!=="figma" && isElectron && (
                  <button onClick={async () => { const fp = await window.electronAPI.dialog.openFile(); if (fp) { setInlineNew(fp); } }} style={{ ...S.sBtn(false), padding:"6px 10px", fontSize:10, whiteSpace:"nowrap" }}><IdsIcon name="document" size={12} style={{ marginRight:3 }} />Browse</button>
                )}
                <button onClick={() => handleInlineSubmit(selectingFor.kind)} disabled={!inlineNew.trim()} style={{ ...S.sBtn(!!inlineNew.trim()), padding:"6px 12px", fontSize:10 }}>Use</button>
              </div>
              {inlineNew.trim() && (
                <label style={{ display:"flex", alignItems:"center", gap:6, marginTop:6, fontSize:10, color:"#8ba3b8", cursor:"pointer" }}>
                  <input type="checkbox" id="save-new" style={{ accentColor:accent }} />
                  Also save to library
                </label>
              )}
              <button onClick={() => setSelectingFor(null)} style={{ ...S.btnGhost, marginTop:6 }}><IdsIcon name="close" size={12} style={{ marginRight:4 }} />Cancel selection</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display:"flex", borderBottom:"1px solid #1a4a7a" }}>
            {[{ id:"presets", icon:"lightning", label:"Presets" }, { id:"figma", icon:"figma", label:"Figma" }, { id:"files", icon:"circle-plus", label:"Targets" }].map(t => (
              <button key={t.id} onClick={() => { setActivePanel(t.id); setShowCreate(false); }} style={{
                ...btnBase, flex:1, padding:"9px 6px", background:activePanel===t.id?"#0a2e52":"transparent",
                border:"none", borderRadius:0, borderBottom:`2px solid ${activePanel===t.id ? accent : "transparent"}`,
                color: selectingFor && ((selectingFor.kind==="figma"&&t.id==="figma")||((selectingFor.kind==="file"||selectingFor.kind==="target")&&t.id==="files")) ? accent : activePanel===t.id?"#ebf1f3":"#7a93aa",
                fontSize:11,
                animation: selectingFor && ((selectingFor.kind==="figma"&&t.id==="figma")||((selectingFor.kind==="file"||selectingFor.kind==="target")&&t.id==="files")) ? "selectGlow 1.5s ease infinite" : "none",
              }}><IdsIcon name={t.icon} size={14} style={{ marginRight:2 }} />{t.label}</button>
            ))}
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:12 }}>

            {/* ── PRESETS ── */}
            {activePanel==="presets" && !showCreate && (
              <div>
                <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                  {[{ id:"all", l:"All", icon:null },{ id:"apply", l:"Apply", icon:"lightning" },{ id:"review", l:"Review", icon:"checklist" }].map(ph => (
                    <button key={ph.id} onClick={() => setActivePhase(ph.id)} style={S.btnSmall(activePhase===ph.id)}>{ph.icon && <IdsIcon name={ph.icon} size={12} style={{ marginRight:3 }} />}{ph.l}</button>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:9, color:"#3a6a9a" }}>{filtered.length} presets</span>
                  <button onClick={() => { setShowCreate(true); setEditingId(null); setDraft({ label:"",icon:"star",category:"Custom",template:"" }); }} style={S.sBtn(false)}>+ Create</button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:10 }}>
                  {allCats.map(c => <button key={c} onClick={() => setActiveCategory(c)} style={S.btnPill(activeCategory===c)}>{c}</button>)}
                </div>
                {filtered.map(p => (
                  <div key={p.id} style={S.card} onClick={() => loadPreset(p)}
                    onMouseEnter={e => e.currentTarget.style.borderColor=p.phase==="review"?"#64B5F6":accent}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:3 }}>
                      <span style={{ width:22,height:22,borderRadius:5,background:"#103a68",display:"flex",alignItems:"center",justifyContent:"center",color:p.phase==="review"?"#64B5F6":accent }}>{ICON_NAMES.includes(p.icon) ? <IdsIcon name={p.icon} size={14} /> : <span style={{ fontSize:11 }}>{p.icon}</span>}</span>
                      <span style={{ fontSize:11, fontWeight:500 }}>{p.label}</span>
                      {p.custom && <span style={{ fontSize:7, color:"#F4A024", background:"rgba(244,160,36,0.08)", padding:"1px 5px", borderRadius:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.03em" }}>custom</span>}
                      <span style={{ marginLeft:"auto", fontSize:8, color:p.phase==="review"?"#64B5F6":"#5d7a9a", background:p.phase==="review"?"rgba(100,181,246,0.06)":"#002040", padding:"1px 5px", borderRadius:3, fontWeight:500 }}>{p.phase}</span>
                    </div>
                    <div style={{ fontSize:9, color:"#5d7a9a", ...mono, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.template.split("\n")[0]}</div>
                    {p.custom && (
                      <div style={{ display:"flex", gap:3, marginTop:6 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditingId(p.id); setDraft({ label:p.label,icon:p.icon,category:p.category,template:p.template }); setShowCreate(true); }} style={{ ...S.btnGhost, color:"#9bb3c5", fontSize:10 }}>Edit</button>
                        <button onClick={() => { setPresets(pr => pr.filter(x => x.id!==p.id)); showToast("Deleted"); }} style={{ ...S.btnGhost, color:"#b61a37", fontSize:10 }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── CREATE PRESET ── */}
            {activePanel==="presets" && showCreate && (
              <div style={{ animation:"slideUp 0.15s ease" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                  <span style={{ fontSize:12, fontWeight:600 }}>{editingId?"Edit":"Create"} Preset</span>
                  <button onClick={() => { setShowCreate(false); setEditingId(null); }} style={S.btnGhost}><IdsIcon name="close" size={14} /></button>
                </div>
                <input value={draft.label} onChange={e => setDraft(d => ({...d,label:e.target.value}))} placeholder="Preset name" style={{ ...S.input, marginBottom:10 }} />
                <div style={{ fontSize:9, color:"#5d7a9a", fontWeight:600, letterSpacing:"0.03em", textTransform:"uppercase", marginBottom:4 }}>ICON</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:10 }}>
                  {ICON_OPTS.map(ic => <button key={ic} onClick={() => setDraft(d => ({...d,icon:ic}))} style={{ width:28,height:28,borderRadius:6,border:`1px solid ${draft.icon===ic?accent:"#5d7a9a"}`,background:draft.icon===ic?"rgba(0,208,224,0.08)":"transparent",color:draft.icon===ic?accent:"#a8bfcf",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}><IdsIcon name={ic} size={14} /></button>)}
                </div>
                <div style={{ fontSize:9, color:"#5d7a9a", fontWeight:600, letterSpacing:"0.03em", textTransform:"uppercase", marginBottom:4 }}>CATEGORY</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom:10 }}>
                  {CAT_OPTS.map(c => <button key={c} onClick={() => setDraft(d => ({...d,category:c}))} style={S.btnPill(draft.category===c)}>{c}</button>)}
                </div>
                <div style={{ fontSize:9, color:"#5d7a9a", fontWeight:600, letterSpacing:"0.03em", textTransform:"uppercase", marginBottom:4 }}>TEMPLATE <span style={{ color:"#3a6a9a" }}>— use {"{{FIGMA_LINK}}"} {"{{TARGET}}"}</span></div>
                <textarea value={draft.template} onChange={e => setDraft(d => ({...d,template:e.target.value}))} placeholder="STEP 1 — SCREENSHOT:\n{{FIGMA_LINK}}..." style={{ ...S.input, height:160, ...mono, fontSize:10, lineHeight:1.7, resize:"vertical", marginBottom:10 }} />
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={savePreset} disabled={!draft.label.trim()||!draft.template.trim()} style={S.btnCreate(draft.label.trim()&&draft.template.trim())}>{editingId?"Save":"Create"}</button>
                  <button onClick={() => setShowCreate(false)} style={{ ...S.btnSecondary, padding:"9px 14px", fontSize:11 }}>Cancel</button>
                </div>
              </div>
            )}

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
                    <span style={{ fontSize:10, fontWeight:600, color:"#a8bfcf", letterSpacing:"0.04em" }}>
                      <IdsIcon name={myLinksCollapsed ? "chevron-right" : "chevron-down"} size={12} style={{ marginRight:4 }} />MY LINKS
                    </span>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:9, color:"#3a6a9a" }}>{filteredMyLinks.length}</span>
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
                          <button onClick={addFigma} style={S.btnConfirm}>Save</button>
                        </div>
                      )}
                      {filteredMyLinks.sort((a,b) => b.lastUsed-a.lastUsed).map(l => (
                        <div key={l.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2a5a8a" : "#1a4a7a" }}
                          onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", l.label, l.url, l.id) : null}
                          onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&selectingFor.kind==="figma" ? accent : "#2a5a8a"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2a5a8a" : "#1a4a7a"}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:11, fontWeight:500 }}><IdsIcon name="figma" size={12} style={{ marginRight:4 }} />{l.label}</span>
                            {selectingFor && selectingFor.kind==="figma" ? (
                              <span style={{ fontSize:10, color:accent, fontWeight:500 }}><IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this</span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setFigmaLinks(p => p.filter(x => x.id!==l.id)); }} style={{ ...S.btnGhost, color:"#5d7a9a" }}><IdsIcon name="close" size={12} /></button>
                            )}
                          </div>
                          <div style={{ fontSize:9, color:"#5d7a9a", ...mono, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom: selectingFor ? 0 : 8 }}>{l.url}</div>
                          {!selectingFor && (
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={() => copy(l.url, l.id)} style={{ ...S.btnSmall(false), flex:1, color:copiedId===l.id?accent:"#a8bfcf", textAlign:"center" }}><IdsIcon name={copiedId===l.id?"checkmark":"copy"} size={12} style={{ marginRight:3 }} />Copy</button>
                            </div>
                          )}
                        </div>
                      ))}
                      {filteredMyLinks.length === 0 && !addingLink && (
                        <div style={{ fontSize:10, color:"#3a6a9a", padding:"8px 0", textAlign:"center" }}>
                          {figmaSearchLower ? "No matches" : "No saved links yet"}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* ── IDS LIBRARY section ── */}
                <div style={{ borderTop:"1px solid #1a4a7a", paddingTop:10 }}>
                  <div style={{ fontSize:10, fontWeight:600, color:"#a8bfcf", letterSpacing:"0.04em", marginBottom:8 }}>
                    IDS LIBRARY
                  </div>

                  {/* Search results mode */}
                  {figmaSearchLower && filteredLibraryLinks ? (
                    <div>
                      <div style={{ fontSize:9, color:"#5d7a9a", marginBottom:6 }}>{filteredLibraryLinks.length} results</div>
                      {filteredLibraryLinks.map(link => (
                        <div key={link.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderLeft:`2px solid ${link.categoryColor}`, borderColor: selectingFor ? "#2a5a8a" : "#1a4a7a", borderLeftColor: link.categoryColor }}
                          onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", link.label, link.url, link.id) : null}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = selectingFor ? accent : "#2a5a8a"; e.currentTarget.style.borderLeftColor = link.categoryColor; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = selectingFor ? "#2a5a8a" : "#1a4a7a"; e.currentTarget.style.borderLeftColor = link.categoryColor; }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:500 }}><IdsIcon name={link.categoryIcon} size={12} style={{ marginRight:4 }} />{link.label}</span>
                            {selectingFor && selectingFor.kind==="figma" ? (
                              <span style={{ fontSize:10, color:accent, fontWeight:500 }}><IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this</span>
                            ) : (
                              <div style={{ display:"flex", gap:3 }}>
                                <button onClick={(e) => { e.stopPropagation(); saveLibraryLinkToMyLinks(link); }} style={{ ...S.btnGhost, color:"#7a93aa", fontSize:9 }}><IdsIcon name="star" size={12} style={{ marginRight:3 }} />Save</button>
                                <button onClick={(e) => { e.stopPropagation(); copy(link.url, link.id); }} style={{ ...S.btnGhost, color:copiedId===link.id?accent:"#7a93aa", fontSize:9 }}><IdsIcon name={copiedId===link.id?"checkmark":"copy"} size={12} /></button>
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize:8, color:"#3a6a9a" }}>{link.groupLabel}</div>
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
                            <span style={{ fontSize:11, fontWeight:600, color:"#c8dae5" }}>
                              <IdsIcon name={catCollapsed ? "chevron-right" : "chevron-down"} size={12} style={{ marginRight:4 }} /><IdsIcon name={cat.icon} size={14} style={{ marginRight:4 }} />{cat.label}
                            </span>
                            <span style={{ fontSize:9, color:"#3a6a9a", background:"#0d3460", padding:"1px 6px", borderRadius:3 }}>{catLinkCount}</span>
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
                                  <span style={{ fontSize:10, color:"#8ba3b8" }}>
                                    <IdsIcon name={grpCollapsed ? "chevron-right" : "chevron-down"} size={10} style={{ marginRight:3 }} />{grp.label}
                                  </span>
                                  <span style={{ fontSize:8, color:"#2a5a8a" }}>{grp.links.length}</span>
                                </div>

                                {!grpCollapsed && grp.links.map(link => (
                                  <div key={link.id} style={{ ...S.card, marginLeft:8, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2a5a8a" : "#1a4a7a", padding:"8px 10px" }}
                                    onClick={() => selectingFor && selectingFor.kind==="figma" ? handleSelectItem("figma", link.label, link.url, link.id) : null}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&selectingFor.kind==="figma" ? accent : "#2a5a8a"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2a5a8a" : "#1a4a7a"}>
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                                      <span style={{ fontSize:10, fontWeight:500 }}>{link.label}</span>
                                      {selectingFor && selectingFor.kind==="figma" ? (
                                        <span style={{ fontSize:9, color:accent, fontWeight:500 }}><IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use</span>
                                      ) : (
                                        <div style={{ display:"flex", gap:3 }}>
                                          <button onClick={(e) => { e.stopPropagation(); saveLibraryLinkToMyLinks(link); }} style={{ ...S.btnGhost, color:"#7a93aa", fontSize:8 }}><IdsIcon name="star" size={12} /></button>
                                          <button onClick={(e) => { e.stopPropagation(); copy(link.url, link.id); }} style={{ ...S.btnGhost, color:copiedId===link.id?accent:"#7a93aa", fontSize:8 }}><IdsIcon name={copiedId===link.id?"checkmark":"copy"} size={12} /></button>
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

            {/* ── FILE PATHS ── */}
            {activePanel==="files" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <span style={{ fontSize:9, color:"#3a6a9a" }}>{filePaths.length} targets</span>
                  {!selectingFor && <button onClick={() => setAddingFile(!addingFile)} style={S.sBtn(addingFile)}>{addingFile?"Cancel":"+ Add"}</button>}
                </div>
                {addingFile && !selectingFor && (
                  <div style={{ ...S.card, cursor:"default", animation:"slideUp 0.1s ease", padding:12, marginBottom:10 }}>
                    <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                      {[{ l:"File path", v:false }, { l:"Description", v:true }].map(opt => (
                        <button key={opt.l} onClick={() => setNewFile(f => ({...f,isDescription:opt.v}))}
                          style={{ ...S.btnSmall(newFile.isDescription===opt.v), flex:1, textAlign:"center", color: newFile.isDescription===opt.v ? accent : "#7a93aa", borderColor: newFile.isDescription===opt.v ? accent : "transparent" }}>
                          <IdsIcon name={opt.v?"comment":"document"} size={12} style={{ marginRight:4 }} />{opt.l}
                        </button>
                      ))}
                    </div>
                    <input value={newFile.label} onChange={e => setNewFile(f => ({...f,label:e.target.value}))} placeholder="Label (optional)" style={{ ...S.input, marginBottom:6 }} />
                    <div style={{ display:"flex", gap:4, marginBottom:7 }}>
                      <input value={newFile.path} onChange={e => setNewFile(f => ({...f,path:e.target.value}))}
                        placeholder={newFile.isDescription ? "e.g. the primary button component" : "e.g. src/components/Button.tsx"}
                        style={{ ...S.input, fontSize:10, ...(newFile.isDescription ? {} : mono), flex:1, marginBottom:0 }}
                        onKeyDown={e => e.key==="Enter"&&addFileItem()} />
                      {!newFile.isDescription && isElectron && (
                        <button onClick={async () => { const fp = await window.electronAPI.dialog.openFile(); if (fp) { setNewFile(f => ({...f, path:fp, label: f.label || fp.split("/").pop()})); } }} style={{ ...S.sBtn(false), padding:"6px 10px", fontSize:10, whiteSpace:"nowrap" }}><IdsIcon name="document" size={12} style={{ marginRight:3 }} />Browse</button>
                      )}
                    </div>
                    <button onClick={addFileItem} style={S.btnConfirm}>Save</button>
                  </div>
                )}
                {filePaths.map(f => (
                  <div key={f.id} style={{ ...S.card, cursor:selectingFor?"pointer":"default", borderColor: selectingFor ? "#2a5a8a" : "#1a4a7a" }}
                    onClick={() => selectingFor && (selectingFor.kind==="file"||selectingFor.kind==="target") ? handleSelectItem(selectingFor.kind, f.label, f.path, f.id) : null}
                    onMouseEnter={e => e.currentTarget.style.borderColor = selectingFor&&(selectingFor.kind==="file"||selectingFor.kind==="target") ? accent : "#2a5a8a"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = selectingFor ? "#2a5a8a" : "#1a4a7a"}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:11, fontWeight:500 }}><IdsIcon name={f.isDescription?"comment":"document"} size={12} style={{ marginRight:4 }} />{f.label}</span>
                      {selectingFor && (selectingFor.kind==="file"||selectingFor.kind==="target") ? (
                        <span style={{ fontSize:10, color:accent, fontWeight:500 }}><IdsIcon name="arrow-left" size={10} style={{ marginRight:3 }} />Use this</span>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setFilePaths(p => p.filter(x => x.id!==f.id)); }} style={{ ...S.btnGhost, color:"#5d7a9a" }}><IdsIcon name="close" size={12} /></button>
                      )}
                    </div>
                    <div style={{ fontSize:10, color:f.isDescription?"#9bb3c5":accent, ...(f.isDescription?{}:mono), opacity:f.isDescription?1:.5, marginBottom: selectingFor ? 0 : 8 }}>{f.path}</div>
                    {!selectingFor && (
                      <div style={{ display:"flex", gap:4 }}>
                        <button onClick={() => copy(f.path, f.id)} style={{ ...S.btnSmall(false), flex:1, color:copiedId===f.id?accent:"#a8bfcf", textAlign:"center" }}><IdsIcon name={copiedId===f.id?"checkmark":"copy"} size={12} style={{ marginRight:3 }} />Copy</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ MAIN EDITOR ═══ */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
          <div style={{ flex:1, padding:18, display:"flex", flexDirection:"column", minHeight:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:9, color:"#5d7a9a", fontWeight:600, letterSpacing:"0.05em" }}>COMPOSE YOUR PROMPT</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {tokenCount > 0 && <span style={{ fontSize:10, color:"#F4A024", fontWeight:500, animation:"pulse 2s ease infinite" }}><IdsIcon name="triangle-exclamation" size={12} style={{ marginRight:3 }} />{tokenCount} unfilled</span>}
                {filledCount > 0 && <span style={{ fontSize:10, color:accent, fontWeight:500 }}><IdsIcon name="checkmark" size={12} style={{ marginRight:3 }} />{filledCount} linked</span>}
              </div>
            </div>

            {/* ── Editor area with mode toggle ── */}
            <div ref={editorRef} style={{ flex:1, borderRadius:10, border:"1px solid #1a4a7a", background:"#002040", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:200, position:"relative" }}>

              {/* Mode toggle: Visual (chips) vs Raw (textarea) */}
              {prompt && segments.some(s => s.type!=="text") && (
                <div style={{ padding:"6px 14px", borderBottom:"1px solid #1a4a7a", display:"flex", alignItems:"center", gap:6 }}>
                  <button onClick={() => setEditorMode("visual")} style={S.btnSmall(editorMode==="visual")}><IdsIcon name="figma" size={12} style={{ marginRight:3 }} />Visual</button>
                  <button onClick={() => setEditorMode("raw")} style={S.btnSmall(editorMode==="raw")}><IdsIcon name="edit" size={12} style={{ marginRight:3 }} />Raw</button>
                  <span style={{ fontSize:9, color:"#2a5a8a", marginLeft:6 }}>
                    {editorMode==="visual" ? "Click chips to link/swap. Click text to edit." : "Edit the full prompt including tags."}
                  </span>
                </div>
              )}

              {/* RAW MODE — always a textarea */}
              {(editorMode === "raw" || !segments.some(s => s.type!=="text")) && (
                <textarea ref={textareaRef} value={prompt} onChange={e => { setPrompt(e.target.value); setPopover(null); }}
                  placeholder={`Pick a preset, or start typing…\n\nType {{FIGMA_LINK}} or {{TARGET}} anywhere and they'll become clickable chips in Visual mode.\n\nEvery preset follows:\n  1. Screenshot Figma design\n  2. Read exact values via MCP\n  3. Apply changes\n  4. Self-check with implementation screenshot`}
                  style={{ flex:1, background:"transparent", border:"none", padding:"16px 18px", color:"#ebf1f3", fontSize:13, fontFamily:uiFont, lineHeight:1.8, resize:"none" }} />
              )}

              {/* VISUAL MODE — editable text segments + interactive chips */}
              {editorMode === "visual" && segments.some(s => s.type!=="text") && (
                <div style={{ flex:1, padding:"12px 14px", overflowY:"auto", position:"relative" }}>
                  <div data-visual-editor style={{ lineHeight:2.1, fontSize:13, color:"#ebf1f3", minHeight:"100%" }}>
                    {segments.map((seg, idx) => {
                      // ── Text segment: editable inline ──
                      if (seg.type === "text") {
                        return (
                          <span key={idx} data-seg-idx={idx}
                            contentEditable
                            suppressContentEditableWarning
                            spellCheck={false}
                            onBlur={(e) => {
                              const newText = e.currentTarget.innerText;
                              if (newText !== seg.value) {
                                setPrompt(rebuildPromptWithTextChange(segments, idx, newText));
                              }
                            }}
                            onKeyDown={(e) => {
                              // Prevent Enter from creating divs — insert newline text
                              if (e.key === "Enter") {
                                e.preventDefault();
                                document.execCommand("insertText", false, "\n");
                              }
                              // Backspace at start of text → delete previous chip
                              if (e.key === "Backspace") {
                                const sel = window.getSelection();
                                if (sel && sel.isCollapsed && sel.getRangeAt(0).startOffset === 0 && idx > 0) {
                                  const prev = segments[idx - 1];
                                  if (prev && prev.type !== "text") {
                                    e.preventDefault();
                                    let tokenIdx = 0;
                                    for (let si = 0; si < idx - 1; si++) { if (segments[si].type !== "text") tokenIdx++; }
                                    setPrompt(replaceNthToken(prompt, tokenIdx, ""));
                                  }
                                }
                              }
                              // Delete at end of text → delete next chip
                              if (e.key === "Delete") {
                                const sel = window.getSelection();
                                const len = e.currentTarget.innerText.length;
                                if (sel && sel.isCollapsed && sel.getRangeAt(0).startOffset >= len && idx < segments.length - 1) {
                                  const next = segments[idx + 1];
                                  if (next && next.type !== "text") {
                                    e.preventDefault();
                                    let tokenIdx = 0;
                                    for (let si = 0; si <= idx; si++) { if (segments[si].type !== "text") tokenIdx++; }
                                    setPrompt(replaceNthToken(prompt, tokenIdx, ""));
                                  }
                                }
                              }
                            }}
                            style={{
                              whiteSpace:"pre-wrap", wordBreak:"break-word",
                              outline:"none", borderRadius:3,
                              caretColor: accent,
                              transition:"background 0.15s",
                              minWidth: seg.value === "" ? 8 : undefined,
                              minHeight: seg.value === "" ? "1.4em" : undefined,
                              display: seg.value === "" ? "inline-block" : undefined,
                              padding: seg.value === "" ? "0 2px" : undefined,
                            }}
                            onFocus={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                            onBlurCapture={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >{seg.value}</span>
                        );
                      }

                      // ── Placeholder chip (unfilled) ──
                      if (seg.type === "placeholder") {
                        const isSelecting = selectingFor && selectingFor.segIndex === idx;
                        return (
                          <span key={idx} data-seg-idx={idx} onClick={() => handleChipClick(idx, seg.kind)}
                            style={{
                              display:"inline-flex", alignItems:"center", gap:4,
                              background: isSelecting ? "rgba(0,208,224,0.15)" : seg.kind==="target" ? "rgba(255,255,255,0.06)" : "rgba(244,160,36,0.1)",
                              border:`1px solid ${isSelecting ? accent : seg.kind==="target" ? "rgba(255,255,255,0.15)" : "rgba(244,160,36,0.25)"}`,
                              borderRadius:6, padding:"2px 10px 2px 8px", margin:"0 3px",
                              fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.2s",
                              color: isSelecting ? accent : seg.kind==="target" ? "#b5cad8" : "#F4A024",
                              animation: isSelecting ? "selectGlow 1.5s ease infinite" : "pulse 2.5s ease infinite",
                              verticalAlign:"middle", userSelect:"none",
                            }}>
                            <IdsIcon name={seg.kind==="figma"?"figma":seg.kind==="target"?"circle-plus":"document"} size={14} />
                            {isSelecting ? "Selecting…" : seg.kind==="figma" ? "FIGMA_LINK" : seg.kind==="target" ? "TARGET" : "FILE_PATH"}
                            <span onClick={(e) => { e.stopPropagation(); let ti = 0; for (let si = 0; si < idx; si++) { if (segments[si].type !== "text") ti++; } setPrompt(replaceNthToken(prompt, ti, "")); }}
                              style={{ marginLeft:2, opacity:0.5, cursor:"pointer", lineHeight:1 }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
                              <IdsIcon name="close" size={10} />
                            </span>
                          </span>
                        );
                      }

                      // ── Filled chip ──
                      if (seg.type === "filled") {
                        return (
                          <span key={idx} data-seg-idx={idx} data-filled-chip onClick={(e) => handleFilledClick(idx, seg.kind, seg.label, seg.value, e)}
                            style={{
                              display:"inline-flex", alignItems:"center", gap:5,
                              background:"rgba(0,208,224,0.08)",
                              border:"1px solid rgba(0,208,224,0.2)",
                              borderRadius:6, padding:"2px 10px 2px 8px", margin:"0 3px",
                              fontSize:11, fontWeight:500, cursor:"pointer", transition:"all 0.2s",
                              color:accent, verticalAlign:"middle", userSelect:"none",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.background = "rgba(0,208,224,0.12)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,208,224,0.2)"; e.currentTarget.style.background = "rgba(0,208,224,0.08)"; }}>
                            <IdsIcon name={seg.kind==="figma"?"figma":seg.kind==="target"?"circle-plus":"document"} size={14} />
                            <span style={{ fontWeight:500 }}>{seg.label}</span>
                            <span style={{ fontSize:9, color:"#7a93aa", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {seg.value.length > 30 ? "…"+seg.value.slice(-25) : seg.value}
                            </span>
                            <span onClick={(e) => { e.stopPropagation(); let ti = 0; for (let si = 0; si < idx; si++) { if (segments[si].type !== "text") ti++; } setPrompt(replaceNthToken(prompt, ti, "")); }}
                              style={{ marginLeft:2, opacity:0.5, cursor:"pointer", lineHeight:1 }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "0.5"}>
                              <IdsIcon name="close" size={10} />
                            </span>
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  {/* Popover for filled chips */}
                  {popover && (
                    <div data-popover style={{
                      position:"absolute", left:Math.min(popover.x, 280), top:popover.y, zIndex:60,
                      background:"#103a68", border:`1px solid ${accent}`, borderRadius:10,
                      padding:14, minWidth:220, boxShadow:`0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,208,224,0.1)`,
                      animation:"fadeIn 0.15s ease",
                    }}>
                      <div style={{ fontSize:11, fontWeight:600, marginBottom:4, color:accent }}>
                        <IdsIcon name={popover.kind==="figma"?"figma":popover.kind==="target"?"circle-plus":"document"} size={14} style={{ marginRight:4 }} />{popover.label}
                      </div>
                      <div style={{ fontSize:9, color:"#7a93aa", ...mono, marginBottom:12, wordBreak:"break-all", lineHeight:1.5 }}>{popover.value}</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <button onClick={handleSwap} style={{ ...S.btnSecondary, width:"100%", padding:"7px 10px", fontSize:11, textAlign:"left", gap:8 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor=accent; e.currentTarget.style.background="rgba(0,208,224,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="#5d7a9a"; e.currentTarget.style.background="transparent"; }}>
                          <IdsIcon name="swap" size={14} color={accent} /> Swap — choose a different {popover.kind==="figma"?"link":"path"}
                        </button>
                        <button onClick={handleUnlink} style={{ ...S.btnSecondary, width:"100%", padding:"7px 10px", fontSize:11, textAlign:"left", gap:8 }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor="#F4A024"; e.currentTarget.style.background="rgba(244,160,36,0.04)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor="#5d7a9a"; e.currentTarget.style.background="transparent"; }}>
                          <IdsIcon name="unlink" size={14} color="#F4A024" /> Unlink — revert to placeholder
                        </button>
                        {!((popover.kind==="figma"?figmaLinks:filePaths).some(x => (popover.kind==="figma"?x.url:x.path)===popover.value)) && (
                          <button onClick={handlePopoverSave} style={{ ...S.btnSecondary, width:"100%", padding:"7px 10px", fontSize:11, textAlign:"left", gap:8 }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor="#64B5F6"; e.currentTarget.style.background="rgba(100,181,246,0.04)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor="#5d7a9a"; e.currentTarget.style.background="transparent"; }}>
                            <IdsIcon name="plus" size={14} color="#64B5F6" /> Save to library
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quick insert bar */}
              <div style={{ padding:"7px 12px", borderTop:"1px solid #1a4a7a", display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                <span style={{ fontSize:8, color:"#2a5a8a", fontWeight:500 }}>Insert:</span>
                {[
                  { l:"{{FIGMA_LINK}}", t:"{{FIGMA_LINK}}" },
                  { l:"{{TARGET}}", t:"{{TARGET}}" },
                  { l:"+ Screenshot compare", t:"\n\nScreenshot the implementation and compare side-by-side with the Figma screenshot." },
                  { l:"+ Style-only guard", t:"\n\nDo NOT change functionality — only visual styling." },
                  { l:"+ Token enforcement", t:"\n\nUse ONLY design tokens — no hardcoded values." },
                  { l:"+ Scope: element", t:"\n\nSCOPE: Only change the following specific element — do not touch anything else:\n[Describe the exact element here]" },
                  { l:"+ Scope: state", t:"\n\nSCOPE: Only fix the following state — all other states should remain unchanged:\n[e.g., hover state, focus state, disabled state]" },
                ].map(s => (
                  <button key={s.l} onMouseDown={e => e.preventDefault()} onClick={() => {
                    const ta = textareaRef.current;
                    const isRawMode = editorMode === "raw" || !segments.some(seg => seg.type!=="text");
                    if (ta && isRawMode) {
                      const start = ta.selectionStart ?? prompt.length;
                      const end = ta.selectionEnd ?? prompt.length;
                      const before = prompt.slice(0, start);
                      const after = prompt.slice(end);
                      const newPrompt = before + s.t + after;
                      setPrompt(newPrompt);
                      requestAnimationFrame(() => {
                        const cursorPos = start + s.t.length;
                        ta.selectionStart = cursorPos;
                        ta.selectionEnd = cursorPos;
                        ta.focus();
                      });
                    } else {
                      // Visual mode: rebuild prompt from current DOM state, then insert at selection
                      const sel = window.getSelection();
                      const visualDiv = editorRef.current?.querySelector("[data-visual-editor]");
                      if (sel && sel.rangeCount > 0 && visualDiv) {
                        // Find which text span the cursor is in and get its current DOM text
                        const range = sel.getRangeAt(0);
                        const spans = visualDiv.querySelectorAll("[data-seg-idx]");
                        let insertPos = prompt.length; // fallback: end
                        // First, rebuild the prompt from DOM to capture any unsaved edits
                        let rebuilt = "";
                        let found = false;
                        for (const span of spans) {
                          const si = parseInt(span.getAttribute("data-seg-idx"), 10);
                          const seg = segments[si];
                          if (!seg) continue;
                          if (seg.type === "text") {
                            const domText = span.innerText;
                            if (span.contains(range.startContainer) && !found) {
                              // If range container is the span itself (empty span), offset is child index not char offset
                              const charOffset = range.startContainer === span ? 0 : range.startOffset;
                              insertPos = rebuilt.length + Math.min(charOffset, domText.length);
                              found = true;
                            }
                            rebuilt += domText;
                          } else if (seg.type === "placeholder") {
                            const token = seg.kind === "figma" ? "{{FIGMA_LINK}}" : seg.kind === "file" ? "{{FILE_PATH}}" : "{{TARGET}}";
                            rebuilt += token;
                          } else if (seg.type === "filled") {
                            const prefix = seg.kind === "figma" ? "FIGMA" : seg.kind === "file" ? "FILE" : "TARGET";
                            rebuilt += `{{${prefix}_FILLED:${seg.label}|${seg.value}}}`;
                          }
                        }
                        const newPrompt = rebuilt.slice(0, insertPos) + s.t + rebuilt.slice(insertPos);
                        setPrompt(newPrompt);
                      } else {
                        setPrompt(p => p + s.t);
                      }
                    }
                  }} style={{ ...S.btnSmall(false), color:"#7a93aa" }}
                    onMouseEnter={e => { e.currentTarget.style.color=accent; e.currentTarget.style.borderColor=accent; }}
                    onMouseLeave={e => { e.currentTarget.style.color="#7a93aa"; e.currentTarget.style.borderColor="transparent"; }}>{s.l}</button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:8, marginTop:12, alignItems:"center" }}>
              <button onClick={copyPrompt} disabled={!prompt.trim()} style={S.btnPrimaryLg(prompt.trim())}><>{copiedId==="main"?<><IdsIcon name="checkmark" size={14} style={{ marginRight:4 }} />Copied!</>:<><IdsIcon name="copy" size={14} style={{ marginRight:4 }} />Copy Prompt</>}</></button>
              <button onClick={() => { setPrompt(""); setPopover(null); setSelectingFor(null); setEditorMode("raw"); }} style={S.btnSecondary}>Clear</button>
              <div style={{ flex:1 }} />
              <div style={{ fontSize:8, color:"#1a4a7a" }}>Apply → Review → Correct</div>
            </div>

            {/* History */}
            {promptHistory.length > 0 && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:8, color:"#1e5080", fontWeight:600, letterSpacing:"0.04em", marginBottom:5 }}>HISTORY</div>
                {promptHistory.slice(0,3).map((h,i) => (
                  <button key={i} onClick={() => { setPrompt(h.text); showToast("Restored"); }} style={{ ...S.btnSecondary, display:"block", width:"100%", background:"transparent", padding:"5px 9px", marginBottom:2, textAlign:"left", borderColor:"#1a4a7a" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor="#5d7a9a"}
                    onMouseLeave={e => e.currentTarget.style.borderColor="#1a4a7a"}>
                    <span style={{ fontSize:9, color:"#5d7a9a", ...mono }}>{promptToPlainText(h.text).substring(0,80)}…</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* ═══════════════════════════════════════════════════
          HELP OVERLAY — Full-screen how-to guide
          ═══════════════════════════════════════════════════ */}
      {showHelp && (() => {
        const HELP_SECTIONS = [
          { cat:"getting-started", title:"Getting Started", items:[
            { q:"What is Prompt Composer?", a:"Prompt Composer is a tool that helps you write instructions for Claude Code — the AI that edits your code. Instead of typing long, complex instructions directly into a terminal (that black window with text), you build your instructions here where it's easier to see, edit, and organize everything.", tags:["intro","what","purpose","basics"] },
            { q:"I've never used Claude Code. What do I need to know?", a:"Claude Code is an AI that can read and edit code files in your project. You give it instructions (called 'prompts'), and it makes the changes. Think of it like giving directions to a very literal assistant — the more specific you are, the better the result. This tool helps you write those directions clearly.", tags:["intro","beginner","new","first time","claude code"] },
            { q:"What's the basic workflow?", a:"It's 4 steps:\n\n1. Pick a preset (a ready-made template) from the left panel\n2. Fill in your Figma links and file paths by clicking the colored chips\n3. Edit the text if you need to add specifics\n4. Hit 'Copy Prompt' and paste it into Claude Code\n\nThat's it. The preset does the heavy lifting of writing the instruction — you just point it at the right design and the right file.", tags:["workflow","steps","how","basics","process","start"] },
            { q:"Do I need to know how to code to use this?", a:"No. You don't write any code in this tool. You're writing instructions in plain English that tell Claude Code what to do. The presets already include the technical language Claude Code needs — you just fill in which design to reference and which file to change.", tags:["code","coding","developer","technical","beginner","no code"] },
          ]},
          { cat:"presets", title:"Using Presets", items:[
            { q:"What are presets?", a:"Presets are ready-made prompt templates for common design tasks. Instead of writing 'Please look at this Figma design and fix the fonts to match...' from scratch every time, you click 'Fix Typography' and the whole instruction is written for you — with blank spots for your specific Figma link and file.", tags:["preset","template","what"] },
            { q:"What do the green 'Apply' and blue 'Review' labels mean?", a:"Green 'Apply' presets tell Claude Code to make changes — fix colors, match layouts, restyle a component.\n\nBlue 'Review' presets tell Claude Code to look and report without changing anything — like 'Visual QA Audit' which lists every difference between your design and the code.\n\nUse Apply first, then Review to check the work, then 'Targeted Correction' to fix what's still off.", tags:["apply","review","green","blue","phase","type","category"] },
            { q:"How do I create my own preset?", a:"Click '+ Create' in the Presets panel. You'll fill in:\n\n• Name — what you'll see in the list\n• Icon — pick one from the grid\n• Category — helps with filtering\n• Template — your prompt text\n\nIn the template, type {{FIGMA_LINK}} where you want a Figma link to go, and {{TARGET}} where you want a file path or description, or {{FILE_PATH}} for a specific file path. These become clickable chips when you use the preset.", tags:["create","custom","new preset","make","build","own"] },
            { q:"Can I edit or delete a preset?", a:"Only custom presets (ones you created) can be edited or deleted. They show an orange 'custom' badge. Click the preset to load it, and you'll see 'Edit' and 'Delete' buttons below it. Built-in presets can't be changed, but you can create a custom one based on them.", tags:["edit","delete","change","modify","remove","custom"] },
            { q:"What's the 'Targeted Correction' preset for?", a:"This is your most-used preset after the first pass. When Claude Code makes changes but they're not quite right, load 'Targeted Correction', fill in the Figma link and file, then describe specifically what's still wrong. For example: 'The button padding is too large — should be 12px not 20px' or 'The heading color is wrong, it should be darker.' Be specific.", tags:["correction","fix","wrong","still off","not right","adjust","targeted"] },
          ]},
          { cat:"chips", title:"Chips & Linking", items:[
            { q:"What are those colored pill-shaped things in my prompt?", a:"Those are 'chips' — interactive placeholders for your Figma links and file paths.\n\nAmber/orange pulsing chips = unfilled, need your input\nGreen chips = filled with a link or path, showing the name\n\nClick an amber chip to fill it. Click a green chip to change it or unlink it.", tags:["chip","pill","colored","orange","green","placeholder","what"] },
            { q:"How do I fill a chip?", a:"Click the amber chip. Two things happen:\n\n1. The left sidebar switches to the right panel (Figma or Files)\n2. Every saved item gets a green 'Use this' label\n\nClick any saved item to link it. Or type a new URL/path in the input box at the top of the sidebar and click 'Use'.\n\nThe chip turns green and shows the name of what you linked.", tags:["fill","link","connect","select","choose","use","how"] },
            { q:"How do I change a chip that's already filled?", a:"Click the green chip. A popup appears with three options:\n\n• Swap — pick a different link/path\n• Unlink — turn it back into an empty amber chip\n• Save to library — if you typed a new value, save it for reuse\n\n'Swap' puts you right back into selection mode.", tags:["change","swap","replace","different","switch","unlink","already filled"] },
            { q:"I have two FIGMA_LINK chips. How do I fill them separately?", a:"Click each one individually. When you click a specific chip, only that chip enters selection mode (it says 'Selecting...'). When you pick a link from the sidebar, it fills only that chip. The other one stays unfilled until you click it.\n\nThis means you can point one chip to your design system tokens and another to a specific component design.", tags:["multiple","two","several","separate","different links","each","both"] },
            { q:"What if I want to paste a Figma link that's not saved?", a:"When in selection mode (after clicking a chip), there's an input field at the top of the sidebar that says 'Or paste a new Figma URL...' — paste your link there and click 'Use'. Check the 'Also save to library' checkbox if you want to keep it for next time.", tags:["paste","new link","not saved","unsaved","fresh","direct","new url"] },
          ]},
          { cat:"figma", title:"Figma Links & Files", items:[
            { q:"How do I get a Figma link?", a:"In Figma:\n\n1. Click on the frame or component you want to reference\n2. Right-click → 'Copy link to selection'\n   OR press Ctrl+L (Cmd+L on Mac)\n3. Come back here, go to the Figma tab, click '+ Add'\n4. Paste the URL and give it a label like 'Hero Section' or 'Button Component'\n\nThe link contains a 'node-id' that tells Claude Code exactly which frame to look at.", tags:["figma","link","url","how","get","copy","frame","find"] },
            { q:"Why should I save Figma links instead of pasting every time?", a:"Because you'll use the same frames over and over. When you're tweaking a component, you might reference the same Figma design 5-10 times across different prompts. Saving it once means one click to insert it instead of switching to Figma, finding the frame, copying the link, and coming back.", tags:["save","why","reuse","multiple","again","repeat","library"] },
            { q:"What's the TARGET chip and how is it different from FILE_PATH?", a:"TARGET is a flexible placeholder that accepts EITHER a file path (like src/components/Button.tsx) OR a plain English description (like 'the primary button component'). Claude Code can use either to find the right files.\n\nFILE_PATH still works and is for when you know the exact file path. TARGET is better when you're not sure — just describe what you want changed and Claude Code will find it.\n\nWhen you click a TARGET chip, the Targets panel opens. You can save both file paths and descriptions there.", tags:["target","file path","path","find","where","location","what","how","file","description","difference"] },
            { q:"What does 'recently used' mean for Figma links?", a:"Figma links are sorted by when you last used them. The ones you inserted most recently appear at the top. This way, when you're actively working on a specific component, its links are always right there without scrolling.", tags:["recent","sort","order","top","last used"] },
          ]},
          { cat:"editor", title:"Editing Prompts", items:[
            { q:"What's the difference between Visual and Raw mode?", a:"Visual mode shows your prompt with the nice colored chips. You can click into the text between chips and edit normally — type, delete, add new lines.\n\nRaw mode shows the plain text including the tag markup (like {{FIGMA_FILLED:Label|url}}). Use Raw mode when you need to make big structural changes or if the visual editor feels awkward.\n\nBoth modes edit the same prompt — switching between them doesn't lose anything.", tags:["visual","raw","mode","edit","switch","difference","toggle"] },
            { q:"How do I add extra instructions to a preset?", a:"After loading a preset, just click into the text (in Visual mode) or use Raw mode and type wherever you want. Common things to add:\n\n• Specific details: 'The heading should be 24px not 20px'\n• Warnings: 'Don't touch the navigation component'\n• Context: 'This is a dark mode variant'\n\nYou can also use the quick-insert buttons at the bottom of the editor to append common clauses.", tags:["add","extra","more","customize","edit","instructions","text","type"] },
            { q:"What are the quick-insert buttons at the bottom?", a:"These are one-click snippets that append useful instructions to your prompt:\n\n• {{FIGMA_LINK}} / {{TARGET}} / {{FILE_PATH}} — adds placeholder chips\n• Screenshot compare — tells Claude Code to take before/after screenshots\n• Style-only guard — tells Claude Code not to change any behavior, just visuals\n• Token enforcement — tells Claude Code to use design tokens, not hardcoded values\n• Scope: element — limits changes to a specific element you describe\n• Scope: state — limits changes to a specific interactive state\n\nThey save you from typing the same reminders over and over.", tags:["quick insert","buttons","bottom","snippet","append","add","shortcut","scope"] },
            { q:"Where does the prompt go after I click 'Copy'?", a:"It goes to your clipboard — the same as Ctrl+C (Cmd+C). Then you:\n\n1. Switch to your terminal where Claude Code is running\n2. Click in the input area\n3. Press Ctrl+V (Cmd+V) to paste\n4. Press Enter to send it\n\nThe copied text is clean — all the chip tags are replaced with the actual Figma URLs and file paths.", tags:["copy","clipboard","paste","send","terminal","where","how","after"] },
            { q:"What's the prompt history?", a:"Every time you click 'Copy Prompt', it saves that prompt in a history list at the bottom of the editor. If you need to reuse or tweak a previous prompt, click it to reload it. History shows the last few prompts from this session.", tags:["history","previous","past","old","reuse","again","recent"] },
          ]},
          { cat:"ies", title:"IES Design System Pack", items:[
            { q:"What is the IES Pack?", a:"It's a set of 8 step-by-step prompts that guide Claude Code through adopting the Intuit IES design system in a project. Each step handles a different layer: color tokens, typography, spacing, component styling, icons, motion, and a final audit.\n\nThink of it as a recipe — follow the steps in order, and your project gets migrated to IES.", tags:["ies","pack","what","design system","intuit","migration"] },
            { q:"Do I need to run all 8 steps?", a:"Ideally yes, in order. But you can also run individual steps if you only need to update one layer. For example, if only the colors changed, just run Step 1 (Tokens & Colors).\n\nThe steps are designed to build on each other — Step 1 creates the tokens that Steps 2-7 reference.", tags:["all steps","order","skip","individual","partial","one step","some"] },
            { q:"How do icons work? (Steps 5a and 5b)", a:"Icons are split into two steps because they involve actual image files, not just code changes:\n\nStep 5a (Inventory) — Claude Code scans the Figma icon frame and your project, then gives you a report: which icons exist in IES, which ones your project uses, and which are missing. You don't need to do anything except review the list.\n\nStep 5b (Export) — After you review, Claude Code exports the SVG icon files from Figma, saves them to your project, and sets up the icon system. No more manually downloading icons one by one.\n\nSave your local icons folder (like src/assets/icons/) in the Files panel before starting.", tags:["icons","svg","download","export","5a","5b","inventory","assets","manual"] },
            { q:"What Figma links do I need for the IES Pack?", a:"For each step, you'll need to link to the relevant part of the IES design system in Figma:\n\n• Step 1 → IES color/token documentation frame\n• Step 2 → IES typography documentation frame\n• Step 3 → IES spacing/radius documentation frame\n• Step 4 → The specific component spec (button, input, etc.)\n• Step 5 → The IES icon library frame\n• Step 6 → IES motion guidelines\n• Step 7 → Your actual screen designs\n\nSave these in the Figma panel before starting — you'll reuse them across steps.", tags:["figma links","which","what links","need","ies","frames","where"] },
          ]},
          { cat:"troubleshooting", title:"Common Issues", items:[
            { q:"Claude Code didn't match my design exactly", a:"This is normal for a first pass. Claude Code typically gets 80-90% right initially. The key is the review-and-correct cycle:\n\n1. Run a 'Visual QA Audit' preset to get a discrepancy list\n2. Use 'Targeted Correction' to describe what's still wrong\n3. Be very specific: 'The padding on .card-header should be 16px, currently 24px'\n\nUsually 1-2 correction rounds gets you to pixel-perfect.", tags:["not matching","wrong","close","almost","not right","still off","not exact","pixel perfect","inaccurate"] },
            { q:"Claude Code changed things I didn't want it to change", a:"Add the 'Style-only guard' quick-insert to your prompt. It adds: 'Do NOT change any functionality — only adjust visual styling.'\n\nYou can also be specific: 'Only modify Button.tsx — do not touch any other files' or 'Do not change the component's props or API.'\n\nThe more boundaries you set in the prompt, the less Claude Code will wander.", tags:["changed too much","unexpected","broke","broken","unwanted","wrong file","other files","too many changes"] },
            { q:"My prompt is really long. Is that okay?", a:"Yes. Longer, more detailed prompts usually get better results. Claude Code handles long instructions well. The presets are already structured with clear steps, and adding specifics only helps.\n\nIf your prompt is very long (500+ words), just make sure the most important instructions are near the top and bottom, as those get the most attention.", tags:["long","too long","length","words","big","large","verbose"] },
            { q:"How do I know which file path to use?", a:"Ask a developer or check your project structure. As a general guide:\n\n• Look for folders named 'components', 'styles', 'pages', or 'views'\n• Component files usually match the UI element name: Button.tsx, Card.tsx, Header.tsx\n• Style files are often .css, .scss, or .module.css\n• Token files might be called tokens.css, variables.css, or theme.ts\n\nWhen in doubt, describe the component in your prompt and Claude Code can often find the right file itself.", tags:["file","path","which","find","don't know","where","unsure","what file"] },
            { q:"I clicked a chip but nothing happened", a:"Make sure you're looking at the left sidebar. When you click a chip:\n\n1. The sidebar should switch to the Figma or Files tab\n2. A green banner appears at the top of the sidebar saying 'Select a...' \n3. Click one of the saved items, or type a new value in the input\n\nIf the sidebar didn't switch, try clicking the chip again. If you want to cancel, click 'Cancel selection' in the sidebar banner.", tags:["chip","click","nothing","didn't work","broken","not working","stuck","bug"] },
            { q:"I want to undo filling a chip", a:"Click the green (filled) chip. A popup appears — click 'Unlink' to turn it back into an empty amber chip. You can then fill it with something different.", tags:["undo","unfill","revert","go back","remove","clear chip","empty"] },
          ]},
          { cat:"ids-library", title:"IDS Design System Library", items: IDS_HELP_ITEMS.map(i => ({ ...i, tags: i.tags })) },
        ];

        const allItems = HELP_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, cat:s.cat, catTitle:s.title })));
        const searchLower = helpSearch.toLowerCase().trim();
        const filteredItems = searchLower
          ? allItems.filter(i =>
              i.q.toLowerCase().includes(searchLower) ||
              i.a.toLowerCase().includes(searchLower) ||
              i.tags.some(t => t.includes(searchLower))
            )
          : helpCategory === "all"
            ? allItems
            : allItems.filter(i => i.cat === helpCategory);

        // Highlight matching text
        const highlight = (text) => {
          if (!searchLower || searchLower.length < 2) return text;
          const parts = text.split(new RegExp(`(${searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
          return parts.map((part, i) =>
            part.toLowerCase() === searchLower
              ? <mark key={i} style={{ background:"rgba(0,208,224,0.25)", color:accent, borderRadius:2, padding:"0 2px" }}>{part}</mark>
              : part
          );
        };

        return (
          <div style={{
            position:"fixed", inset:0, zIndex:200,
            background:"rgba(5,5,5,0.97)", backdropFilter:"blur(16px)",
            display:"flex", flexDirection:"column",
            animation:"fadeIn 0.2s ease",
          }}>
            {/* Help header */}
            <div style={{ padding:"20px 28px", borderBottom:"1px solid #1a4a7a", display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"rgba(0,208,224,0.1)", border:"1px solid rgba(0,208,224,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:accent }}><IdsIcon name="question" size={20} /></div>
                <div>
                  <div style={{ fontSize:16, fontWeight:600 }}>How to Use Prompt Composer</div>
                  <div style={{ fontSize:11, color:"#7a93aa" }}>Search or browse — no coding knowledge needed</div>
                </div>
              </div>
              <button onClick={() => { setShowHelp(false); setHelpSearch(""); setHelpCategory("all"); }}
                style={{ ...S.btnIcon, width:36, height:36, borderRadius:9 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#b61a37"; e.currentTarget.style.color = "#b61a37"; e.currentTarget.style.background = "rgba(182,26,55,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#5d7a9a"; e.currentTarget.style.color = "#a8bfcf"; e.currentTarget.style.background = "transparent"; }}
              ><IdsIcon name="close" size={16} /></button>
            </div>

            {/* Search bar */}
            <div style={{ padding:"16px 28px 12px", borderBottom:"1px solid #1a4a7a", flexShrink:0 }}>
              <div style={{ position:"relative", maxWidth:600 }}>
                <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#5d7a9a", pointerEvents:"none" }}><IdsIcon name="search" size={16} /></span>
                <input
                  value={helpSearch}
                  onChange={e => setHelpSearch(e.target.value)}
                  placeholder="Search — try 'chip', 'figma link', 'not matching', 'icons', 'file path'..."
                  autoFocus
                  style={{
                    width:"100%", background:"#0a2e52", border:"1px solid #1e5080", borderRadius:10,
                    padding:"13px 16px 13px 40px", color:"#ebf1f3", fontSize:14,
                    fontFamily:uiFont,
                    transition:"border-color 0.2s",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = accent}
                  onBlur={e => e.currentTarget.style.borderColor = "#1e5080"}
                />
                {helpSearch && (
                  <button onClick={() => setHelpSearch("")} style={{ ...S.btnGhost, position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}><IdsIcon name="close" size={12} /></button>
                )}
              </div>
              {/* Category pills */}
              {!searchLower && (
                <div style={{ display:"flex", gap:5, marginTop:12, flexWrap:"wrap" }}>
                  {[{ id:"all", l:"All Topics" }, ...HELP_SECTIONS.map(s => ({ id:s.cat, l:s.title }))].map(c => (
                    <button key={c.id} onClick={() => setHelpCategory(c.id)} style={{ ...S.btnPill(helpCategory===c.id), padding:"5px 14px", borderRadius:6, fontSize:11 }}>{c.l}</button>
                  ))}
                </div>
              )}
              {searchLower && (
                <div style={{ marginTop:10, fontSize:12, color:"#7a93aa" }}>
                  {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for "{helpSearch}"
                </div>
              )}
            </div>

            {/* Results */}
            <div style={{ flex:1, overflowY:"auto", padding:"16px 28px 40px" }}>
              {filteredItems.length === 0 && (
                <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <div style={{ marginBottom:12 }}><IdsIcon name="search" size={32} color="#5d7a9a" /></div>
                  <div style={{ fontSize:15, fontWeight:500, marginBottom:8 }}>No results for "{helpSearch}"</div>
                  <div style={{ fontSize:13, color:"#7a93aa" }}>Try different words — for example, "how to fill a chip" or "colors not matching"</div>
                </div>
              )}

              {/* Group by category when not searching */}
              {!searchLower ? (
                HELP_SECTIONS.filter(s => helpCategory === "all" || s.cat === helpCategory).map(section => (
                  <div key={section.cat} style={{ marginBottom:32 }}>
                    <div style={{
                      fontSize:11, color:accent, letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:600,
                      marginBottom:14, paddingBottom:8, borderBottom:"1px solid #1a4a7a",
                      display:"flex", alignItems:"center", gap:10,
                    }}>
                      {section.title}
                      <span style={{ fontSize:9, color:"#3a6a9a", fontWeight:400, textTransform:"none", letterSpacing:0 }}>{section.items.length} topics</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {section.items.map((item, i) => (
                        <HelpCard key={i} item={item} highlight={highlight} mono={mono} accent={accent} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filteredItems.map((item, i) => (
                    <HelpCard key={i} item={item} highlight={highlight} mono={mono} accent={accent} showCat />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   HELP CARD COMPONENT — collapsible Q&A
   ═══════════════════════════════════════════════ */
function HelpCard({ item, highlight, mono, accent, showCat }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        background: open ? "#0a2e52" : "#001a38",
        border: `1px solid ${open ? "#2a5a8a" : "#1a4a7a"}`,
        borderRadius: 11, padding: "16px 20px", cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = "#1e5080"; }}
      onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = "#1a4a7a"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
          background: open ? "rgba(0,208,224,0.1)" : "#1a4a7a",
          border: `1px solid ${open ? "rgba(0,208,224,0.2)" : "#1a4a7a"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: open ? accent : "#7a93aa",
          transition: "all 0.2s",
        }}>{open ? "−" : "+"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, color: open ? "#ebf1f3" : "#c8dae5" }}>
            {highlight(item.q)}
          </div>
          {showCat && (
            <span style={{ fontSize: 9, color: "#5d7a9a", background: "#1a4a7a", padding: "1px 6px", borderRadius: 3, marginTop: 4, display: "inline-block" }}>
              {item.catTitle}
            </span>
          )}
          {open && (
            <div style={{
              marginTop: 14, fontSize: 13, color: "#b5cad8", lineHeight: 1.85,
              whiteSpace: "pre-wrap", animation: "slideUp 0.2s ease",
            }}>
              {highlight(item.a)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
