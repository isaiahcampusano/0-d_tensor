# Tensor Atlas — 4D Tensor Visualizer

Tensor Atlas is a frontend-only teaching tool for image-style tensors with shape `[B, H, W, C]`: batch, height, width, and color channels. It links a rotatable 3D voxel grid and 2D channel planes to the tensor's contiguous row-major storage.

## Run locally

```bash
npm install
npm run dev
```

Use `npm test`, `npm run lint`, and `npm run build` to verify the project.

## Using the visualizer

- Adjust `B`, `H`, `W`, and `C` in the top bar. Existing overlapping coordinates are preserved; new cells are zero-filled.
- Choose a batch in the sample rail and switch between **3D Voxel Grid**, **Channel Planes**, and **Flat List only**.
- Hover a voxel, plane cell, or storage row to highlight the corresponding value everywhere. Click any value to edit it.
- Use Play or the arrow buttons to trace row-major traversal. Keyboard shortcuts: arrows traverse values, `[` / `]` switch batches, and `Space` plays or pauses.
- Enable **2D fallback** for low-power devices or environments where WebGL is undesirable.
- Import a rectangular nested JSON list, `{ "shape": [...], "data": [...] }`, or CSV whose first line is `shape: B,H,W,C`. The documented JSON export round-trips without a backend.

Shapes are limited to `B ≤ 8`, `H,W ≤ 16`, `C ≤ 4`, and 16,384 total elements. Large reshapes run in a Web Worker, while the flat storage panel renders a virtualized window.

## Row-major mapping

Every coordinate uses one canonical mapping:

```text
flatIndex = b × (H × W × C) + h × (W × C) + w × C + c
```

The last dimension changes fastest. After channels, traversal advances through width, then height, then batch.

## Manual QA walkthrough

1. Set `B=4, H=3, W=3, C=3`.
2. Select batch 0 and rotate the 3×3×3 voxel view.
3. Click `(0,1,2,0)` and edit its value.
4. Confirm the same value is selected in flat storage at index `15` (`0×27 + 1×9 + 2×3 + 0`).
5. Start Play and confirm the highlight advances through both views in row-major order.

> The source implementation plan listed index `9` for step 4, but its stated row-major formula evaluates that coordinate to `15`. The app and tests use the formula as specified.

## Architecture

React and TypeScript manage state and accessible controls, Three.js renders the instanced voxel mesh with OrbitControls, and a module Web Worker handles larger resizes. Data never leaves the browser.
