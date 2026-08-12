# FRONTEND_IMPLEMENTATION_PLAN.md

Repository: `isaiahcampusano/0-d_tensor`
Scope: Add a static, interactive, GitHub Pages–hosted tensor playground alongside the existing Python implementation. This document is a handoff plan only — no frontend files are created here.

---

## 1. Executive summary

**What will be built:** A single-page, dependency-free, static web app — the "0-D Tensor Playground" — published from this repository via GitHub Pages. It lets a visitor type or paste a scalar or nested numeric list, see its inferred rank (`ndim`), shape, row-major flat storage, and bracket-nested visualization, apply `expand_dims` interactively, and step through built-in 0-D→4-D examples. It is a teaching companion to the existing Python `Tensor` class, not a replacement for it.

**Who it is for:** Beginners learning what rank, shape, and row-major storage mean, and how nested-list notation maps onto a flat memory layout — the same audience the "What I learned" section of `README.md` is written for, given an interactive surface instead of a script they have to run locally.

**Recommended technical approach:** A native, dependency-free HTML/CSS/JavaScript implementation using ES modules, with a small hand-written JavaScript port of `tensor.py`'s pure functions (shape inference, flattening, `expand_dims`, formatting). No framework, no bundler, no build step, no CDN dependency. Pyodide is rejected — see Section 3 for the full comparison. The JS port is intentionally small (mirrors `tensor.py`'s ~130 lines) and is pinned to a written behavior contract (Section 7) and a unit-test suite that encodes `demo.py`'s exact documented output, so it cannot silently drift from the Python original.

The site is published from a `docs/` folder on `main` via GitHub Pages "Deploy from a branch," requiring no GitHub Actions workflow.

---

## 2. Repository assessment

### 2.1 Current structure

```
0-d_tensor/
├── README.md         # Project overview, 0-D→4-D table, "why flat list", how to run, example, what I learned
├── TENSOR_SPEC.md     # Implementation contract: constraints, Tensor class, construction, expand_dims, visualize, repr, validation, demo output
├── tensor.py          # The Tensor class and its helper functions (no dependencies)
└── demo.py            # Script demonstrating 0-D→4-D expansion and a 2-D matrix, with documented exact output
```

### 2.2 Behaviors the frontend must mirror

Read directly from `tensor.py` and confirmed against `TENSOR_SPEC.md`:

1. **`_flatten_and_infer(value)`** — recursively flattens a scalar or nested list into `(flat_data, shape)`:
   - A non-list value must be `int` or `float` and **not** `bool` (Python's `bool` is a subclass of `int`, so it is explicitly excluded via `isinstance(value, bool)`). Anything else raises `TypeError("tensor values must be numbers or nested lists of numbers")`.
   - A non-list scalar returns `([value], ())` — this is the 0-D case.
   - An empty list returns `([], (0,))` immediately, without inspecting further nesting.
   - A non-empty list recurses into each item; every item's inferred shape must be identical to the first item's, or it raises `ValueError("nested lists must have a rectangular shape")`. The final shape is `(len(value),) + child_shape`.
2. **`prod(shape)`** — product of the shape tuple; `prod(())` is `1` (used for the 0-D scalar's single value).
3. **`Tensor.__init__`** — infers shape from data when no explicit shape is given, and asserts `len(flat_data) == prod(shape)`.
4. **`Tensor.shape`** and **`Tensor.ndim`** — `ndim == len(shape)`.
5. **`Tensor.expand_dims(axis)`**:
   - `axis` must be an `int` and not a `bool`, or it raises `TypeError("axis must be an integer")`.
   - Negative axes are normalized as `axis = ndim + axis + 1`.
   - The (possibly normalized) axis is then **clamped**, not rejected: `axis = max(0, min(axis, ndim))`.
   - A new tensor is returned with shape `shape[:axis] + (1,) + shape[axis:]`; the underlying flat data is untouched and unreordered.
6. **`Tensor.visualize()`** — recursively formats the flat data according to shape: a 0-D tensor renders as a bare value (`"5"`, no brackets); every other rank wraps comma-space-joined children in `[...]`.
7. **Shape display convention** (from `TENSOR_SPEC.md`'s examples) — Python tuple `repr` conventions: `()`, `(3,)` (note the trailing comma for a 1-element tuple), `(2, 3)`.

### 2.3 Inconsistencies, risks, and edge cases to design around

These are not bugs to "fix" in `tensor.py` (which is out of scope — the Python implementation must remain untouched), but they are behaviors the frontend must consciously replicate or knowingly diverge from and document.

1. **`expand_dims` never errors on axis range, only on type.** Any integer, however large or negative, is silently clamped into `[0, ndim]`. A naive frontend that treats out-of-range axis input as a validation error would not match `tensor.py`. **Decision (Section 7):** the browser implementation must also clamp, never reject, for range — but the UI should visibly explain when a clamp occurred, since silent clamping is easy to misread as a bug.
2. **Nested empty-list shape inference is subtler than it looks.** `[]` alone infers shape `(0,)`. But `[[], []]` correctly infers `(2, 0)`, because each empty child independently resolves to `(0,)` before the parent's rectangular check runs. However, there is **no way to express a shape like `(0, 3)`** (an empty first axis whose child axis would be size 3) purely from a nested-list literal — there are no elements from which to infer the size-3 inner shape. This is an inherent limitation of shape-by-example inference (NumPy's `array([])` has the same limitation), not a defect. The frontend must reproduce the same recursive algorithm exactly, and the plan documents this limitation rather than trying to work around it, since fixing it would require an explicit-shape input mode that is out of scope.
3. **Python distinguishes `int` and `float`; JavaScript's `Number` does not.** `str(5)` is `"5"`, `str(5.0)` is `"5.0"`, but JavaScript has one numeric type, so `5` and `5.0` are indistinguishable once parsed by `JSON.parse` or the `Number()` constructor. To keep the browser's formatted output meaningfully parallel to Python's `visualize()`/`repr()` conventions, the frontend must track, per input literal, whether it was written with a decimal point or exponent (this is defined precisely in Section 7) rather than relying on the parsed numeric value alone.
4. **Explicit boolean rejection matters more in Python than in JS, but the browser grammar should reject booleans anyway**, to keep validation-message parity with `TypeError("tensor values must be numbers or nested lists of numbers")`.
5. **No maximum rank or input-size guard exists in `tensor.py`.** That's fine for a script, but a browser UI rendering nested brackets and a flat-storage grid needs a sane upper bound to stay usable (especially on mobile). This is a frontend-only addition, not a Python contract requirement — see Section 7.4.
6. **Numeric range divergence.** JavaScript numbers are IEEE-754 doubles (~15–17 significant digits, exact integers only up to `2^53`); Python integers are arbitrary precision. Values entered near or beyond `Number.MAX_SAFE_INTEGER`, or extreme floats that would print in Python's scientific notation, may format slightly differently between the two implementations. This is called out as an accepted, documented divergence (Section 7.9), not something the frontend will attempt to fully reconcile.
7. **`demo.py` reads `t0._data` directly** (a "private" attribute by convention). This has no bearing on the frontend but confirms the flat list is the implementation's real source of truth — the frontend's data model should treat the flat array the same way (single source of truth, shape is a view over it).

None of the above block implementation; they are resolved explicitly in Section 7 so the implementing agent does not have to make judgment calls.

---

## 3. Architecture decision

### 3.1 Options compared

| Criterion | Native HTML/CSS/JS | Lightweight JS framework (e.g. Preact/Alpine/Svelte) | Pyodide running `tensor.py` |
|---|---|---|---|
| GitHub Pages compatibility | Perfect — static files, zero config | Good, but most setups assume a build step (even "lightweight" ones typically want bundling for production) | Works, but requires shipping/loading a WASM CPython runtime (tens of MB) from a CDN or vendored into the repo |
| Loading performance | Fastest possible — a few KB of HTML/CSS/JS, no parse/hydrate overhead | Slightly heavier; still small if used without a build step, but then you lose most of the framework's benefit | Slow first load (multi-MB WASM + stdlib fetch/instantiate) before any interaction is possible; poor on mobile/slow connections |
| Maintainability | High for a project this size: one small state object, a handful of pure render functions | Adds a dependency and idioms someone must learn later; not justified by the interaction surface here (one form, one derived-state view) | Requires understanding both Python-in-WASM bridging *and* the existing Python API; more moving parts than the problem needs |
| Educational clarity | The DOM and data flow are fully visible in plain JS — appropriate for a project whose whole point is teaching internals | Neutral to slightly worse — framework reactivity can obscure the "shape/flat-data" relationship the site is trying to teach | Actually undermines clarity: learners would be staring at a black-box runtime rather than a transparent, readable port they (or the repo owner) could read alongside `tensor.py` |
| Testing complexity | Low — pure functions are trivially unit-testable with Node's built-in test runner, no DOM needed for the core logic | Similar once you introduce component testing tooling, which is more setup for the same coverage | Higher — must test both the Python logic (already covered by the Python project) and the JS↔Pyodide bridge and its error surface |
| Duplication between Python and browser | Real, but small and controlled: the browser only needs to port `_flatten_and_infer`, `expand_dims`'s math, and `visualize`'s formatting — three small pure functions, pinned to a written contract (Section 7) and tests derived from `demo.py`'s documented output | Same duplication as native JS, plus framework overhead on top | None — but at the cost of every other row in this table |

### 3.2 Decision

**Use native HTML, CSS, and JavaScript (ES modules), with a small hand-written JavaScript port of the three pure Python functions.** No framework, no bundler, no npm dependencies, no CDN scripts.

Justification, in priority order for this project:
- The interaction surface is genuinely small: one input, a handful of derived read-only views, and a small set of buttons/controls. A framework's main value (efficient re-rendering of large, deeply reactive UIs) isn't needed here; a tiny hand-rolled state module (Section 9, `app.mjs`) is simpler to read, debug, and hand off than introducing a dependency.
- GitHub Pages wants static files; native JS/CSS/HTML is a perfect impedance match — zero build step means zero chance of a broken build pipeline blocking deployment.
- Pyodide's load-time cost directly contradicts the "beginner-friendly, works comfortably on mobile" requirement, and it does not actually reduce meaningful duplication for this specific project, since only three small functions need porting — porting them is cheap, and the size/complexity of shipping a WASM Python runtime for three functions is not proportionate.
- Duplication risk is mitigated structurally (Section 7's behavior contract + Section 11's tests validated against `demo.py`'s literal documented output), not by architecture — so the "duplication" downside of native JS is bounded and low-risk in practice.

### 3.3 What is explicitly not being built

No TypeScript, no bundler (Webpack/Vite/Rollup/esbuild), no CSS preprocessor, no UI component library, no state-management library, no test framework beyond Node's built-in `node:test`/`node:assert`. All JS files are plain ES modules (`.mjs`) runnable unmodified by both browsers (`<script type="module">`) and Node (`import`), with no `package.json` required.

---

## 4. Information architecture

Single scrolling page (`docs/index.html`), sections in this order:

1. **Header / project introduction** — title, one-sentence description, link to the GitHub repository, link to the "learning notes" section.
2. **Tensor dimension explainer** — a short, static recap of rank/shape/row-major storage (adapted from `README.md`'s 0-D→4-D table), oriented as "read this before you play" context.
3. **Interactive playground** — the core feature: input field, built-in example buttons, Load/Reset controls, and immediately below it the derived output (ndim, shape, flat storage, nested visualization).
4. **Shape and flat-storage visualization** — the richer, linked nested-bracket + flat-storage-grid view (this may visually live inside or directly beneath the playground; see Section 5).
5. **Dimension-expansion controls** — the `expand_dims` axis selector and before/after comparison, operating on whatever tensor is currently loaded in the playground.
6. **Learning notes** — expanded version of `README.md`'s "What I learned" list, phrased as takeaways, plus a note on this site's known limitations (the empty-shape and int/float caveats from Section 2.3, written for a general audience).
7. **Repository link and footer** — link back to the GitHub repo, link to `TENSOR_SPEC.md`, license/attribution line if applicable, and a note that this page is a JavaScript port with `tensor.py` as the source of truth.

Sections 3–5 are functionally one interconnected component (shared state), but are visually separated for readability, per Section 5's wireframe.

---

## 5. Interface specification

### 5.1 Components

**A. Example selector**
- Purpose: let a visitor load a known-good 0-D→4-D example without typing.
- Visible content: a row (desktop) / stacked list (mobile) of labeled buttons: "0-D scalar", "1-D vector", "2-D matrix", "3-D tensor", "4-D tensor", matching `README.md`'s table and `demo.py`'s sequence.
- Controls: buttons, one per example, plus the free-form input field described below.
- States: default; one example marked as "currently loaded" (`aria-pressed="true"`) when its exact literal is active in the input.
- Interaction: clicking/activating a button populates the input field and immediately runs the same load path as manual submission (Section 5.1.B), so there's exactly one code path for "load a tensor."
- Validation: none needed — example literals are known-valid and defined once in `examples.mjs`.
- Responsive: horizontal wrap → vertical stack under ~480px.
- Accessibility: each button is a real `<button>` with visible text (not icon-only), grouped in a `<fieldset>`/`role="group"` with a legend "Load an example."

**B. Tensor input**
- Purpose: accept a scalar or nested numeric list.
- Visible content: a labeled `<textarea>` (multi-line, monospace), placeholder `e.g. 5 or [[1, 2, 3], [4, 5, 6]]`, and a primary "Load" button.
- Controls: textarea, "Load" button (submits), "Reset" button (Section 5.1.F).
- States: empty/default; valid-and-loaded (success styling + updated outputs); invalid (inline error message, outputs from the last valid load remain visible and are not cleared — see 5.1.E).
- Interactions: `Enter` inside the textarea inserts a newline (multi-line input must remain possible for readability of larger examples), so submission is via the explicit "Load" button or `Ctrl/Cmd+Enter` as a keyboard shortcut, documented in a visible hint under the field.
- Validation: on submit, the input is parsed and validated (Section 7); on failure, an inline, specific error message appears (not a generic "invalid input"), the textarea gets `aria-invalid="true"`, and focus is not stolen away from the textarea.
- Responsive: full-width textarea at all breakpoints; minimum 4 visible rows.
- Accessibility: `<label for>` association, error message linked via `aria-describedby`, error text also present as visible text (not color-only).

**C. Result summary strip**
- Purpose: show `ndim` and `shape` at a glance.
- Visible content: two labeled stat blocks — "Rank (ndim): 2" and "Shape: (2, 3)" — using the exact Python tuple-notation string (Section 7.7).
- States: populated after a successful load; shows a neutral placeholder ("—") before any load.
- Responsive: side-by-side on desktop, stacked on mobile.
- Accessibility: plain text, no reliance on icons for meaning.

**D. Nested-vs-flat visualization**
- Purpose: the core teaching visual — show the bracket-nested structure and the flat row-major array together, linked.
- Visible content: two panels —
  - Left/top: nested bracket diagram (Section 8) with depth badges per axis.
  - Right/bottom: a horizontal, indexed flat-storage strip: each cell shows its flat index (small, above) and value (large, centered).
- Controls: hover and keyboard focus on either a nested leaf or a flat cell.
- States: default (nothing selected); hover-preview (temporary highlight, dismissed on mouseout); pinned selection (persists until another selection or Escape/click-elsewhere, works identically via keyboard).
- Interactions: selecting a nested leaf highlights its single corresponding flat cell and vice versa; selecting a nested *group* (an inner bracket, not a leaf) highlights the contiguous flat-index range it owns. Full behavior in Section 8.
- Validation: n/a (read-only view of already-validated data).
- Responsive: two panels stack vertically on mobile (nested view above flat view) instead of side-by-side; flat-storage strip becomes horizontally scrollable with visible scroll affordance if it doesn't fit the viewport, never truncated silently.
- Accessibility: each nested leaf and each flat cell is a focusable element (`tabindex="0"` in a roving-tabindex pattern) with an `aria-label` stating both its nested index path and its flat index (e.g. `"value 6, index (1, 0, 2), flat index 8"`); selection changes are announced via a visually-hidden `aria-live="polite"` region.

**E. Validation / error messaging**
- Purpose: give specific, actionable feedback for malformed input, ragged arrays, non-numeric values, and invalid operations.
- Visible content: a single inline message region directly under the input, styled distinctly from the success state but not relying on color alone (an icon + the word "Error:" prefix + border).
- Content rules: every error message names the *specific* problem (ragged shape, non-numeric value and its location, unparseable syntax, size/rank guardrail exceeded) — never a generic "invalid input." Exact message catalogue is in Section 7.8.
- States: hidden when there is no error; visible with `role="alert"` when an error is present so assistive tech announces it immediately.

**F. Reset control**
- Purpose: return the playground to its initial, empty state.
- Visible content: a …7213 tokens truncated…st docs/tests/tensor.test.mjs docs/tests/parser.test.mjs` passes fully, with test cases directly traceable to `demo.py`'s documented output and `TENSOR_SPEC.md`'s examples.
- Verification: run the Node test command; all assertions green; manually diff a few outputs against actually running `python demo.py`.
- Dependencies: Phase 0.

**Phase 2 — Static content and layout**
- Files: `docs/index.html` (filled in), `docs/styles.css` (full layout rules).
- Work: build out the header, dimension explainer, learning notes, footer/repo-link sections with real copy (adapted from `README.md`); implement the responsive layout (desktop/mobile) from Section 5.2 without any interactivity yet.
- Expected result: a fully-styled, readable static page with no working playground yet.
- Verification: resize the viewport across common breakpoints (375px, 768px, 1280px); confirm no horizontal scroll, no overlapping text, readable line lengths.
- Dependencies: Phase 0.

**Phase 3 — Playground wiring (plain output)**
- Files: `docs/js/app.mjs`, `docs/js/examples.mjs`, `docs/index.html` (playground markup).
- Work: wire the input textarea, Load button, example buttons, and Reset button to `tensor.mjs`/`parser.mjs`; render `ndim`, `formatShape(shape)`, the flat array, and `visualize()`'s string output as plain text (no rich visualization yet); wire the error-message region per Section 7.8.
- Expected result: a functioning playground where every example loads correctly and every invalid example in 7.14 produces the exact specified message.
- Verification: manually run through every example in Sections 7.13 and 7.14; confirm Reset returns to the empty state; confirm keyboard-only operation reaches Load/Reset/example buttons via Tab.
- Dependencies: Phase 1, Phase 2.

**Phase 4 — Rich visualization**
- Files: `docs/js/render.mjs`, `docs/styles.css` (visualization-specific styles).
- Work: replace the plain-text nested/flat output from Phase 3 with the bracket-diagram and flat-storage-grid components from Sections 5.1.D and 8 (no hover/focus linking yet — static rendering only).
- Expected result: the nested and flat views render correctly for all example tensors, with axis badges and depth styling per Section 6.
- Verification: visually compare rendered output against the worked examples in 7.13 for correctness of nesting depth and flat ordering.
- Dependencies: Phase 3.

**Phase 5 — `expand_dims` controls**
- Files: `docs/js/app.mjs` (extended), `docs/index.html` (expand_dims markup), `docs/styles.css`.
- Work: implement the axis input, Apply button, before/after shape comparison, and the clamp-notice messaging exactly per Section 7.10/7.8.
- Expected result: applying `expand_dims` updates the active tensor's shape (not its data) and the visualization reflects the new axis; clamp notices appear only when clamping actually occurred (not on ordinary negative-axis use).
- Verification: reproduce the exact `demo.py` sequence (Section 7.13) via the UI, one `expand_dims` click at a time, confirming shape/flat/nested match at every step; test an out-of-range axis (e.g. `99`) and confirm the clamp notice and resulting shape.
- Dependencies: Phase 4.

**Phase 6 — Interaction linking and keyboard navigation**
- Files: `docs/js/interactions.mjs`, `docs/js/render.mjs` (extended for focus/ARIA attributes).
- Work: implement hover/focus/selection linking between nested and flat views (Section 8); implement roving-tabindex keyboard navigation across nested leaves and flat cells; implement the `aria-live` announcement region.
- Expected result: hovering or focusing any nested leaf/group highlights the corresponding flat cell(s) and vice versa; the same is fully operable via keyboard alone.
- Verification: manual keyboard-only pass (Tab/Shift+Tab/Arrow keys/Enter/Escape) confirming every interactive element is reachable and operable; manual screen-reader spot-check (Section 11) confirming announcements are meaningful.
- Dependencies: Phase 5.

**Phase 7 — Accessibility and responsive polish**
- Files: `docs/styles.css`, `docs/index.html`, `docs/js/render.mjs`.
- Work: run a full accessibility pass — color-contrast check against WCAG AA, confirm no information is color-only (Section 6), add/adjust `aria-label`s, confirm `prefers-reduced-motion` disables all transitions, confirm all interactive elements have visible focus indicators.
- Expected result: page passes a manual accessibility audit (Section 11) with no color-only signals and full keyboard operability.
- Verification: automated check with a browser accessibility inspector (e.g., the browser's built-in Lighthouse/Accessibility panel) plus the manual checklist in `docs/tests/manual-checklist.md`.
- Dependencies: Phase 6.

**Phase 8 — Edge-case hardening**
- Files: `docs/js/tensor.mjs`, `docs/js/parser.mjs`, `docs/js/app.mjs`, associated tests.
- Work: implement and test the frontend-only guardrails (Section 7.9), re-verify every error message in Section 7.8 renders with the exact copy specified, confirm Reset fully clears state including any pinned selection from Phase 6.
- Expected result: all automated tests (Section 11) pass; manual pass through every edge case in Sections 7.14 and 7.9 produces the specified message and no console errors.
- Verification: `node --test docs/tests/`; manual walkthrough of the edge-case list.
- Dependencies: Phase 7.

**Phase 9 — Deployment configuration**
- Files: repository Settings (GitHub UI, not a file), `docs/index.html`/`styles.css`/`js/*` (relative-path audit only).
- Work: audit every asset reference in `docs/` to ensure it is relative (`./styles.css`, `./js/app.mjs`, `./favicon.svg`), not root-absolute (`/styles.css`); configure GitHub Pages per Section 12.
- Expected result: the site works identically whether opened via `file://`, a local static server at the root, or the deployed subpath.
- Verification: local subpath smoke test (Section 12) plus the live-deployment checks in Section 12.
- Dependencies: Phase 8.

**Phase 10 — Documentation and final QA**
- Files: `README.md`.
- Work: apply the README updates in Section 13; run the full Acceptance Criteria checklist (Section 14) end-to-end against the deployed site.
- Expected result: every acceptance criterion in Section 14 is verifiably true.
- Verification: manual pass through the Section 14 checklist against the live GitHub Pages URL.
- Dependencies: Phase 9.

---

## 11. Testing strategy

### Automated (Node's built-in test runner, `node --test docs/tests/`, zero dependencies)

- `tensor.test.mjs`:
  - Shape inference for scalars, vectors, matrices, 3-D, 4-D (matching Section 7.13 exactly).
  - Flattening order (row-major) for a 3-D and a 4-D example, asserting the exact flat array.
  - `formatShape` for `()`, `(3,)`, `(2, 3)`.
  - `formatNumber` for integer literals, float literals with a whole-number value (`5.0` → `"5.0"`), float literals with a fractional value (`2.5` → `"2.5"`), and exponent literals (`1e3` → `"1000.0"`).
  - `expandDims` for: axis `0`, axis `= ndim` (append at end), a negative axis that lands in range, an out-of-range positive axis (confirms clamping, not rejection), an extremely negative axis (confirms clamp to `0`), and a non-integer axis (confirms the type error).
  - Ragged-array rejection at multiple nesting depths.
  - Empty-tensor handling: `[]` → `(0,)`; `[[], []]` → `(2, 0)`.
  - Frontend guardrails: an input exceeding `maxRank` and one exceeding `maxElements` both produce the specified error and do not throw an unhandled exception.
- `parser.test.mjs`:
  - Valid: scalars (`5`, `-5`, `2.5`, `1e3`, `-1.5e-2`), all five worked examples from 7.13, deeply nested empty arrays.
  - Invalid JSON/syntax: unbalanced brackets, trailing commas, empty input, non-numeric tokens (`true`, `"a"`, `null`), confirming each produces the specific message from 7.8 (or the generic syntax message where the grammar simply has no token for it).

### Manual (tracked in `docs/tests/manual-checklist.md`)

- **Responsive layout:** verify the desktop and mobile wireframes (Section 5.2) at 375px, 480px, 768px, 1024px, 1440px — no horizontal scroll except the intentionally-scrollable flat-storage strip, no overlapping/clipped text.
- **Keyboard navigation:** Tab through the entire page in order; confirm every button, the textarea, the axis input, and every nested-leaf/flat-cell is reachable and operable without a mouse; confirm Escape clears a pinned selection; confirm no keyboard trap.
- **Screen-reader labeling:** spot-check with at least one screen reader (VoiceOver on macOS/iOS or NVDA on Windows) — confirm the textarea's label and error state are announced, confirm example buttons announce their pressed state, confirm selection changes in the visualization are announced via the live region without being overly verbose (announce the value/index, not the entire tensor on every hover).
- **GitHub Pages subpath deployment:** serve the repository root locally (`python3 -m http.server 8000` from the repo root) and browse to `http://localhost:8000/docs/` to emulate a non-root subpath; confirm every asset (CSS, JS, favicon) loads with no 404s in the console, since all paths must be relative (Section 12).
- **Cross-browser smoke check:** confirm the page loads and the core Load/expand_dims flow works in at least two current browser engines (e.g., a Chromium-based browser and Firefox or Safari).

---

## 12. GitHub Pages deployment

**Recommendation: Deploy from a branch, not GitHub Actions.** The site has no build step (Section 3), so there is nothing for a workflow to compile — "Deploy from a branch" is the simplest option that fully satisfies the requirement to avoid unnecessary tooling.

- **Repository settings:** Settings → Pages → "Build and deployment" → Source: **Deploy from a branch**. Branch: **`main`**, folder: **`/docs`**. Save.
- **Base path / relative-asset handling for `/0-d_tensor/`:** because this is a project (not user/organization) Pages site, the live URL will include the repo name as a path segment. Every asset reference inside `docs/` **must be relative**, never root-absolute:
  - Correct: `<link rel="stylesheet" href="./styles.css">`, `<script type="module" src="./js/app.mjs">`, `import ... from "./tensor.mjs"` (relative to the importing file).
  - Incorrect: `href="/styles.css"` (would resolve to `https://isaiahcampusano.github.io/styles.css`, a 404, because it ignores the `/0-d_tensor/` segment).
  - This rule is called out explicitly in Phase 9 and should be grep-checked before deployment (search `docs/` for any `href="/` or `src="/` that isn't `./` or a full `https://` URL).
- **Workflow file:** not applicable — no GitHub Actions workflow is required for this deployment method.
- **Testing the production build locally:** since there is no build step, "the production build" is simply the contents of `docs/`. Test it by:
  1. Opening `docs/index.html` directly via `file://` for a fast smoke check (acceptable for this project since there are no absolute-path or CORS-sensitive requests).
  2. Serving the repo root with `python3 -m http.server 8000` and browsing to `http://localhost:8000/docs/`, which reproduces the "site lives under a path segment" condition of the real Pages URL (Section 11's subpath check).
- **Verifying the live deployment:** after enabling Pages and pushing to `main`, wait for the deployment to complete (visible under the repo's "Deployments" / Settings → Pages banner), then visit the live URL and: confirm no 404s in the browser console/network tab, confirm all five examples load correctly, confirm `expand_dims` works, confirm the page is reachable and correctly styled with no external network dependency beyond the page's own files (no CDN calls to fail).
- **Expected Pages URL:** `https://isaiahcampusano.github.io/0-d_tensor/` (no custom domain assumed, per the constraints).

---

## 13. Documentation updates

Update `README.md` to add, without removing any existing Python-focused content:

1. **Live demo:** near the top, a line such as "Try the interactive playground: `https://isaiahcampusano.github.io/0-d_tensor/`" (add once Phase 9/10 confirms the live URL works).
2. **Local frontend usage:** a short subsection ("Running the frontend locally") explaining that `docs/index.html` can be opened directly, or served via `python3 -m http.server 8000` from the repo root and visited at `http://localhost:8000/docs/`, and that no install/build step is required.
3. **Python usage:** keep the existing "How to run" and "Example" sections exactly as-is — the Python implementation remains the documented, primary, runnable source of truth.
4. **Architecture:** a short subsection explaining that the frontend is an independent, dependency-free JavaScript port of `tensor.py`'s core logic (not a build artifact of the Python code, since GitHub Pages cannot execute Python), linking to this plan or to `docs/js/tensor.mjs` directly as the ported implementation, and noting that `tensor.py`/`TENSOR_SPEC.md` remain the canonical behavior definition.
5. **Testing:** a line noting `node --test docs/tests/` runs the JavaScript test suite (no install required — uses Node's built-in test runner), alongside a mention that the Python side has no test suite of its own beyond `demo.py`'s documented output (unchanged scope).
6. **Deployment:** a short line pointing to Settings → Pages configuration (branch: `main`, folder: `/docs`) so a future maintainer understands how the live site is published without needing to read this full plan.

---

## 14. Acceptance criteria

- [ ] `docs/index.html` loads with zero console errors, both via `file://` and via the deployed GitHub Pages URL.
- [ ] All five built-in examples (0-D through 4-D) load via their buttons and produce `ndim`, shape, flat data, and nested visualization exactly matching Section 7.13.
- [ ] Manually typing each of the five worked examples produces identical results to loading them via the example buttons.
- [ ] Each invalid-input case in Section 7.14 produces its exact specified error message, with no unhandled exception in the console.
- [ ] `expand_dims` reproduces every step of `demo.py`'s documented sequence (Section 7.13) exactly when driven through the UI.
- [ ] An out-of-range `expand_dims` axis is clamped (never rejected) and produces the informational clamp message from Section 7.8; an ordinary negative axis that lands in range produces no clamp message.
- [ ] A non-integer `expand_dims` axis produces the type-error message from Section 7.8.
- [ ] `Reset` returns the playground to its exact initial state (empty input, no result summary, no visualization, no error, no pinned selection).
- [ ] Frontend guardrails (max rank, max element count) trigger their specified messages and do not crash the page.
- [ ] The nested view and flat-storage view stay linked: selecting any nested leaf highlights exactly the correct flat cell, and vice versa, for at least one 2-D, one 3-D, and one 4-D example.
- [ ] The entire interactive flow (load an example, load custom input, apply `expand_dims`, use the linked visualization, reset) is completable using only the keyboard.
- [ ] No information in the interface is conveyed by color alone (verified per Section 6/8's non-color signals).
- [ ] The page respects `prefers-reduced-motion` (all transitions become instant) and `prefers-color-scheme` (light/dark).
- [ ] The layout has no horizontal overflow (other than the intentionally-scrollable flat-storage strip) at 375px, 480px, 768px, 1024px, and 1440px widths.
- [ ] `node --test docs/tests/` passes with zero failing assertions.
- [ ] All asset references in `docs/` are relative; the local subpath smoke test (Section 11/12) shows zero 404s.
- [ ] The live GitHub Pages URL (`https://isaiahcampusano.github.io/0-d_tensor/`) serves the site correctly with all functionality working.
- [ ] `tensor.py`, `demo.py`, and `TENSOR_SPEC.md` are unmodified.
- [ ] `README.md` includes all six updates listed in Section 13.
- [ ] No `eval()` (or `Function()` constructor, or equivalent) appears anywhere in `docs/js/`.
- [ ] No external network request (fonts, CDN scripts, analytics) is made by the deployed page.

---

## 15. Decisions and open questions

### Decisions recommended to lock in now

- Native HTML/CSS/JS, no framework, no build step, no bundler (Section 3).
- `.mjs` extension for all JS source and test files, avoiding any `package.json`/Node project setup (Section 9).
- GitHub Pages "Deploy from a branch" from `docs/` on `main`, no Actions workflow (Section 12).
- Frontend-only guardrails: max rank 6, max element count 512 (Section 7.9) — generous enough not to constrain any 0–4D example plus a few `expand_dims` steps, tight enough to keep the visualization legible.
- `expand_dims` axis input accepts any integer and clamps (never rejects) per the Python contract, with a non-error informational message when clamping actually occurs (Section 7.10/5.1.G).
- System font stack only, no external font requests (Section 6).
- Leading zeros in numeric literals (e.g. `007`) are accepted at the grammar level, since `Tensor()` itself has no opinion on how a caller obtained a given `int`/`float` value — this is a source-syntax nicety, not a runtime rule, so rejecting it would be an unjustified extra restriction (Section 7.1).

### Questions that genuinely require the repository owner's preference

- **Project name/branding on the live page.** This plan uses "0-D Tensor Playground" as a working title (derived from the repo name); the owner may prefer different wording for the header and page `<title>`.
- **Whether to add a repository "About" link / GitHub Pages URL** to the repo's sidebar description once the site is live (a GitHub UI setting, not a code change) — recommended, but it's a one-click owner action outside this plan's scope.
- **License.** Neither the current repository nor this plan specifies a license; if the owner wants one, the footer (Section 4.7) and README should reference it, but choosing a license is a product decision for the owner, not this plan.

### Optional future enhancements (must not block the initial release)

- Explicit-shape construction (`Tensor(data, shape=...)` equivalent in the UI), which would also resolve the "can't express shape `(0, 3)`" limitation (Section 2.3.2) — explicitly out of scope per the task's constraints (arithmetic/reshape/broadcasting are out of scope, and this is adjacent to reshape).
- A "copy as Python" button that reformats the currently-loaded tensor as a `Tensor(...)` constructor call, reinforcing the Python↔browser connection.
- Persisting the last-loaded tensor across page reloads via a URL query parameter (shareable links to a specific example), which is compatible with static hosting and requires no backend.
- Deeper axis-permutation or transpose visualizations — explicitly deferred, since the task scope is 0-D→4-D concepts plus `expand_dims` only.
- An automated Lighthouse/axe-core accessibility check wired into a future CI step — deferred because it would introduce the first piece of build/CI tooling into an otherwise zero-tooling project; the manual accessibility pass (Section 11) is sufficient for the initial release.
