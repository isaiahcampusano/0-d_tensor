# Release Certification Checklist

This file separates reproducible automated evidence from checks that require specific browsers, assistive technology, or hardware.

## Automated evidence — August 12, 2026

- [x] `npm run lint`
- [x] `npm test` — 13 tests across tensor math, import/export, accessible naming, and dialog focus behavior
- [x] `npm run build`
- [x] Desktop Lighthouse — Performance 99, Accessibility 100, Best Practices 100
- [x] Automated color-contrast audit
- [x] Automated label-content-name audit
- [x] Production interaction check — worker-backed JSON import, focus placement/restoration, and flat-row accessible naming
- [x] Maximum tensor `[8,16,16,4]` — 59.94fps over five seconds on the audit host with no console errors
- [x] Responsive layout check at 390×844

The initial bundle is approximately 209 KB minified / 66 KB gzip. The Three.js view is a separate on-demand chunk.

## External certification matrix

Record browser, operating-system, assistive-technology, and hardware versions with each result.

- [ ] Latest Firefox: 3D rendering, OrbitControls, worker import, editing, keyboard shortcuts, and JSON round trip
- [ ] Latest native Safari on macOS: the same functional sequence plus WebGL recovery/fallback
- [ ] NVDA + Chrome: headings/landmarks, shape sliders, view tabs, storage list, dialogs, status updates, and traversal state
- [ ] NVDA + Firefox: same screen-reader sequence
- [ ] VoiceOver + Safari: same screen-reader sequence
- [ ] Keyboard-only: logical tab order, visible focus, dialog containment, Escape close, focus restoration, view/batch/traversal controls
- [ ] Documented mid-range device: `[8,16,16,4]` active 3D view remains near 60fps for at least five seconds while rotating

## Manual walkthrough

1. Set `B=4, H=3, W=3, C=3`.
2. Select batch 0 and rotate the 3×3×3 voxel view.
3. Click `(0,1,2,0)`, enter a new finite value, and save.
4. Confirm flat index 15 shows the same value and highlight.
5. Run traversal and confirm both views advance together.
6. Export JSON, import it again, and confirm shape and values are unchanged.
7. Open each dialog from the keyboard, cycle through it with Tab/Shift+Tab, close with Escape, and confirm focus returns to its trigger.

Full certification is appropriate only after every external checkbox has recorded evidence.
