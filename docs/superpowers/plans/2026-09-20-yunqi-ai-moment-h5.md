# Yunqi AI Moment H5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive, animated, in-page-editable H5 for the Yunqi Conference “My AI Yunqi Moment” visual.

**Architecture:** A dependency-light static site separates pure state logic from DOM rendering. A 941:1672 stage uses layered HTML, CSS, SVG, and provided image assets; the editor persists serializable state in localStorage and drives all visible components through stable IDs.

**Tech Stack:** HTML5, CSS3, SVG, vanilla JavaScript ES modules, Node.js built-in test runner, Playwright-compatible browser smoke checks, static Sites hosting.

**Spec:** `docs/superpowers/specs/2026-09-20-yunqi-ai-moment-h5-design.md`

## Global Constraints

- Mobile portrait first, based on a 941×1672 canvas, with a centered non-stretched stage on desktop.
- No external fonts, CDNs, remote runtime dependencies, authentication, database, or backend.
- Default to the person version; allow instant person/no-photo switching without losing edited text.
- Keep venue/building visuals as fixed image assets and rebuild foreground text, controls, labels, and motion as DOM/SVG layers.
- Respect `prefers-reduced-motion`; continuous motion must stop under reduced motion.
- Target mobile Safari, WeChat WebView, and Chromium browsers.

## Review Focus

- Corrupt or missing localStorage data must restore defaults without preventing render; Task 1 tests malformed JSON and wrong schema types.
- Empty/oversized editable text must remain serializable and safe to render; Task 1 tests sanitization and length caps.
- Unsupported Web Share or Clipboard APIs must fall back to an on-page message; Task 3 tests fallback selection logic.
- Drag coordinates must stay within the stage and preserve the original grab offset; Task 2 tests clamping math.
- Reduced-motion users must receive a static composition with no looping keyframes; Task 4 checks the CSS media query and browser-computed animation state.

---

### Task 1: Serializable Page State

**Files:**
- Create: `package.json`
- Create: `src/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Produces: `DEFAULT_STATE`, `normalizeState(value)`, `loadState(storage)`, `saveState(storage, state)`, and `updateComponent(state, id, patch)`.

- [ ] **Step 1: Write failing state tests** covering defaults, malformed JSON, wrong schema types, 120-character text caps, photo mode preservation, immutable updates, and storage write failures.
- [ ] **Step 2: Run `npm test -- tests/state.test.js`** and verify failure because `src/state.js` is missing.
- [ ] **Step 3: Implement the exported state API** with a versioned plain-object schema and defensive storage access.
- [ ] **Step 4: Run `npm test -- tests/state.test.js`** and verify all state tests pass without warnings.
- [ ] **Step 5: Commit** `package.json`, `src/state.js`, and `tests/state.test.js` with message `feat: add editable H5 state model`.

### Task 2: Stage Geometry and Drag Behavior

**Files:**
- Create: `src/geometry.js`
- Create: `tests/geometry.test.js`

**Interfaces:**
- Produces: `fitStage(viewportWidth, viewportHeight, designWidth, designHeight)`, `clampPosition(position, bounds, size)`, and `positionFromPointer(pointer, stageRect, grabOffset, scale)`.
- Consumes: No DOM; pure numeric inputs only.

- [ ] **Step 1: Write failing geometry tests** for portrait scaling, desktop centering, zero-size viewport fallback, pointer scaling, grab-offset preservation, and boundary clamping.
- [ ] **Step 2: Run `npm test -- tests/geometry.test.js`** and verify failure because the module is missing.
- [ ] **Step 3: Implement pure geometry helpers** returning finite numbers and clamped coordinates.
- [ ] **Step 4: Run the full `npm test` suite** and verify state and geometry tests pass.
- [ ] **Step 5: Commit** the geometry module and tests with message `feat: add responsive stage geometry`.

### Task 3: Share, Export, and Editor Decisions

**Files:**
- Create: `src/actions.js`
- Create: `tests/actions.test.js`

**Interfaces:**
- Produces: `chooseShareAction(capabilities)`, `editableText(value, maxLength)`, `serializeExportName(title, now)`, and `readImageFile(file)`.
- Consumes: capability flags rather than global browser APIs, allowing the UI layer to execute the selected action.

- [ ] **Step 1: Write failing action tests** for native share, clipboard fallback, manual-copy fallback, unsafe filename characters, deterministic date suffixes, empty text, long text, invalid file type, and oversized photo files.
- [ ] **Step 2: Run `npm test -- tests/actions.test.js`** and verify failure because the module is missing.
- [ ] **Step 3: Implement action-decision helpers** and return user-facing Chinese error messages for rejected uploads.
- [ ] **Step 4: Run the full `npm test` suite** and verify all pure behavior tests pass.
- [ ] **Step 5: Commit** with message `feat: add editor and sharing actions`.

### Task 4: Visual Stage and Motion System

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/main.js`
- Create: `assets/yunqi-person.png`
- Create: `assets/yunqi-empty.png`
- Create: `tests/page-structure.test.js`

**Interfaces:**
- Consumes: state, geometry, and action APIs from Tasks 1–3.
- Produces: DOM nodes with stable `data-component-id` values, `.stage`, `.holo-ring`, `.title-orbit`, `.sparkle`, `.particle-field`, `[data-editable]`, and the editor toolbar.

- [ ] **Step 1: Write failing structure tests** that parse source text and assert required metadata, stable component IDs, both image assets, editor controls, share/product links, all seven capability labels, reduced-motion media query, and no external HTTP asset dependencies.
- [ ] **Step 2: Run `npm test -- tests/page-structure.test.js`** and verify failure because the page files do not exist.
- [ ] **Step 3: Implement the layered H5 composition** with a recreated top/foreground UI, fixed venue artwork layer, SVG title orbit and holographic rings, particles, accessible buttons, glass editor drawer, photo upload, mode switching, content editing, drag controls, local persistence, restore, share fallback, and PNG export.
- [ ] **Step 4: Add responsive and accessibility CSS** including safe areas, focus-visible styles, high-contrast fallback, reduced transparency, and reduced motion that disables all infinite animations.
- [ ] **Step 5: Run the full `npm test` suite** and verify all source-level and pure behavior tests pass.
- [ ] **Step 6: Commit** the completed visual stage with message `feat: build interactive Yunqi AI moment H5`.

### Task 5: Browser Verification and Hosting

**Files:**
- Create: `.openai/hosting.json`
- Create: `README.md`
- Modify: files from Task 4 only if browser checks reveal a failing requirement.

**Interfaces:**
- Consumes: the complete static site.
- Produces: a static hosting bundle rooted at the project directory and a deployed preview URL.

- [ ] **Step 1: Start a local static server** and open the first meaningful preview at a 390×844 viewport.
- [ ] **Step 2: Verify browser behavior** for editor open/close, text edit/save/reload, person toggle, local photo replacement, drag bounds, restore, native/fallback sharing, and absence of console errors.
- [ ] **Step 3: Verify responsive views** at 375×667, 430×932, and 1440×1000; confirm no horizontal overflow and centered desktop stage.
- [ ] **Step 4: Emulate reduced motion** and verify computed styles have no looping animation; inspect keyboard focus and contrast.
- [ ] **Step 5: Run `npm test` and static file checks** immediately before publishing.
- [ ] **Step 6: Add hosting metadata and README**, then commit with message `chore: prepare Yunqi H5 preview`.
- [ ] **Step 7: Publish with Sites hosting** and return the hosted URL plus the downloadable project artifact.

