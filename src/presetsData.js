export const DEFAULT_PRESETS = [
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

export const IES_STEPS = [
  { id:"ies-1", label:"1. Tokens & Colors", icon:"eyedropper", cat:"DS",
    template:`Adopt IES design tokens.\n\nSCREENSHOT token reference: use get_screenshot on:\n{{FIGMA_LINK}}\n\nEXTRACT all color tokens via get_design_context: primitives + semantic aliases.\n\nCREATE/UPDATE token file: {{TARGET}}\n\nREPLACE all hardcoded colors codebase-wide with tokens.\n\nSELF-CHECK: screenshot 3 key screens before/after.` },
  { id:"ies-2", label:"2. Typography Scale", icon:"editor-text-bold", cat:"DS",
    template:`Adopt IES type scale.\n\nSCREENSHOT: {{FIGMA_LINK}}\nREAD via get_design_context: families, weights, sizes, line-heights, letter-spacing.\n\nSET UP in: {{TARGET}}\nAdd @font-face, create type tokens, map semantic roles.\n\nAPPLY across codebase. Check for overflow/truncation.\nSELF-CHECK: screenshot key pages.` },
  { id:"ies-3", label:"3. Spacing & Radius", icon:"ruler-pencil", cat:"DS",
    template:`Adopt IES spacing, radius, elevation.\n\nREFERENCE: {{FIGMA_LINK}}\nTOKEN FILE: {{TARGET}}\n\nExtract spacing scale, radius scale, elevation scale.\nCreate tokens. Replace all hardcoded values.\nFlag anything that doesn't map cleanly.\n\nSELF-CHECK: screenshot cards, buttons, inputs.` },
  { id:"ies-4", label:"4. Style a Component", icon:"integration-puzzle", cat:"DS",
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

export const ICON_OPTS = [
  "grid-tile","editor-text-bold","eyedropper","integration-puzzle","all-devices",
  "play","checklist","edit","flag","ruler-pencil","dots-nine","diamond","chart-pie",
  "star","lightning","search","settings","paintbrush","image","document","bookmark",
  "tag","hexagon","circle-check","circle-info","circle-exclamation","copy",
  "globe-spindle","rocket","lightbulb","tools","atom","growth","magic-wand",
  "browser-window",
];

export const CAT_OPTS = ["Apply","Review","Layout","Typography","Color","Component","Motion","Custom"];

export const SKILLS = [
  { id:"fs", name:"Figma Screenshot", desc:"get_screenshot — visual image of any node" },
  { id:"fc", name:"Figma Context", desc:"get_design_context — properties & specs" },
  { id:"fds", name:"Figma DS Search", desc:"search_design_system — components & variables" },
  { id:"fe", name:"File Edit", desc:"Targeted file changes by path" },
  { id:"mf", name:"Multi-file Edit", desc:"Edit multiple files in one pass" },
  { id:"cs", name:"Codebase Search", desc:"Find patterns across all files" },
  { id:"bs", name:"Browser Screenshot", desc:"Screenshot running implementation" },
  { id:"a11", name:"Accessibility", desc:"Contrast, focus, ARIA audit" },
];
