# Frontend manual verification checklist

## Responsive layout

- [ ] Check widths of 375, 480, 768, 1024, and 1440 pixels.
- [ ] Confirm no page-level horizontal overflow.
- [ ] Confirm the flat-storage strip scrolls horizontally when needed.
- [ ] Confirm controls remain readable and do not overlap.

## Keyboard use

- [ ] Tab through examples, input, Load, Reset, tensor targets, axis input, and Apply.
- [ ] Use Ctrl/Cmd+Enter to load the textarea value.
- [ ] Use arrow keys to move among nested and flat tensor targets.
- [ ] Use Enter or Space to pin a linked selection.
- [ ] Use Escape to clear a pinned selection.
- [ ] Confirm there are no keyboard traps.

## Assistive technology

- [ ] Confirm the textarea label, hint, and invalid state are announced.
- [ ] Confirm example buttons announce their pressed state.
- [ ] Confirm linked selections announce value, nested index, and flat index.
- [ ] Confirm errors and axis-clamping notices are announced.
- [ ] Confirm every interactive element has a visible focus indicator.
- [ ] Confirm no meaning relies on color alone.

## Themes and motion

- [ ] Check the page in light and dark system themes.
- [ ] Check all text and controls meet WCAG AA contrast expectations.
- [ ] Enable reduced motion and confirm axis/highlight transitions become instant.

## Functional smoke tests

- [ ] Load all five built-in examples.
- [ ] Load a custom 2-D matrix and confirm rank, shape, nested view, and flat order.
- [ ] Check ragged, malformed, empty, oversized, and over-ranked inputs.
- [ ] Reproduce the 0-D through 4-D `demo.py` expansion sequence.
- [ ] Try axis `-1`, `99`, `-99`, and `1.5`.
- [ ] Confirm Reset clears all state and returns focus to the textarea.

## GitHub Pages readiness

- [ ] Serve the repository root locally and open `/docs/`.
- [ ] Confirm the browser console contains no errors or missing assets.
- [ ] Smoke-test in one Chromium browser and Firefox or Safari.
- [ ] After deployment, repeat the functional smoke test at the Pages URL.
