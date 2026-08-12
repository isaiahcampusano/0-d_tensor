import assert from "node:assert/strict";
import test from "node:test";

import { parseTensorLiteral } from "../js/parser.mjs";
import {
  TensorError,
  createTensor,
  enforceDisplayLimits,
  expandDims,
  flattenAndInfer,
  formatIndex,
  formatNumber,
  formatShape,
  multiIndexFromFlat,
  prod,
  visualize,
} from "../js/tensor.mjs";

const fromLiteral = (literal) => createTensor(parseTensorLiteral(literal));

test("prod mirrors Python math.prod behavior for tensor shapes", () => {
  assert.equal(prod([]), 1);
  assert.equal(prod([2, 3, 4]), 24);
});

test("infers 0-D through 4-D shapes and row-major storage", () => {
  const examples = [
    ["5", [], [5], "5"],
    ["[1, 2, 3]", [3], [1, 2, 3], "[1, 2, 3]"],
    ["[[1, 2, 3], [4, 5, 6]]", [2, 3], [1, 2, 3, 4, 5, 6], "[[1, 2, 3], [4, 5, 6]]"],
    ["[[[1, 2], [3, 4]], [[5, 6], [7, 8]]]", [2, 2, 2], [1, 2, 3, 4, 5, 6, 7, 8], "[[[1, 2], [3, 4]], [[5, 6], [7, 8]]]"],
    ["[[[[1], [2]], [[3], [4]]], [[[5], [6]], [[7], [8]]]]", [2, 2, 2, 1], [1, 2, 3, 4, 5, 6, 7, 8], "[[[[1], [2]], [[3], [4]]], [[[5], [6]], [[7], [8]]]]"],
  ];

  for (const [literal, shape, data, nested] of examples) {
    const tensor = fromLiteral(literal);
    assert.deepEqual(tensor.shape, shape);
    assert.equal(tensor.ndim, shape.length);
    assert.deepEqual(tensor.data, data);
    assert.equal(visualize(tensor), nested);
  }
});

test("preserves Python-style integer and float display intent", () => {
  const tensor = fromLiteral("[5, 5.0, 2.5, 1e3]");
  assert.deepEqual(tensor.floatFlags, [false, true, true, true]);
  assert.equal(visualize(tensor), "[5, 5.0, 2.5, 1000.0]");
  assert.equal(formatNumber(5, false), "5");
  assert.equal(formatNumber(5, true), "5.0");
});

test("formats Python tuple-style shapes and indices", () => {
  assert.equal(formatShape([]), "()");
  assert.equal(formatShape([3]), "(3,)");
  assert.equal(formatShape([2, 3]), "(2, 3)");
  assert.equal(formatIndex([]), "()");
  assert.equal(formatIndex([1]), "(1,)");
  assert.equal(formatIndex([1, 0, 2]), "(1, 0, 2)");
});

test("handles empty tensors with inferred nested shape", () => {
  const empty = fromLiteral("[]");
  assert.deepEqual(empty.shape, [0]);
  assert.deepEqual(empty.data, []);
  assert.equal(visualize(empty), "[]");

  const nestedEmpty = fromLiteral("[[], []]");
  assert.deepEqual(nestedEmpty.shape, [2, 0]);
  assert.equal(visualize(nestedEmpty), "[[], []]");
});

test("rejects ragged arrays at different depths", () => {
  for (const literal of ["[1, [2, 3]]", "[[1, 2], [3]]", "[[[1]], [[2, 3]]]"]) {
    assert.throws(
      () => fromLiteral(literal),
      (error) => error instanceof TensorError && error.message === "Nested lists must have a rectangular shape.",
    );
  }
});

test("rejects an invalid semantic node", () => {
  assert.throws(
    () => flattenAndInfer({ type: "string", value: "5" }),
    /Tensor values must be numbers or nested lists of numbers/,
  );
});

test("expandDims follows Python negative normalization and clamping", () => {
  const vector = fromLiteral("[1, 2, 3]");
  assert.deepEqual(expandDims(vector, 0).tensor.shape, [1, 3]);
  assert.deepEqual(expandDims(vector, 1).tensor.shape, [3, 1]);
  assert.deepEqual(expandDims(vector, -1).tensor.shape, [3, 1]);
  assert.equal(expandDims(vector, -1).wasClamped, false);

  const high = expandDims(vector, 99);
  assert.deepEqual(high.tensor.shape, [3, 1]);
  assert.equal(high.clampedAxis, 1);
  assert.equal(high.wasClamped, true);

  const low = expandDims(vector, -99);
  assert.deepEqual(low.tensor.shape, [1, 3]);
  assert.equal(low.clampedAxis, 0);
  assert.equal(low.wasClamped, true);
});

test("expandDims changes shape without changing stored values", () => {
  let tensor = fromLiteral("5");
  for (const [axis, shape, nested] of [
    [0, [1], "[5]"],
    [0, [1, 1], "[[5]]"],
    [1, [1, 1, 1], "[[[5]]]"],
    [0, [1, 1, 1, 1], "[[[[5]]]]"],
  ]) {
    tensor = expandDims(tensor, axis).tensor;
    assert.deepEqual(tensor.shape, shape);
    assert.deepEqual(tensor.data, [5]);
    assert.equal(visualize(tensor), nested);
  }
});

test("expandDims rejects non-integer axes", () => {
  const tensor = fromLiteral("5");
  for (const axis of [1.5, NaN, "1", true]) {
    assert.throws(() => expandDims(tensor, axis), /Axis must be a whole number/);
  }
});

test("converts row-major flat positions back to multi-indices", () => {
  assert.deepEqual(multiIndexFromFlat([2, 2, 3], 8), [1, 0, 2]);
  assert.deepEqual(multiIndexFromFlat([], 0), []);
});

test("enforces frontend display guardrails", () => {
  assert.throws(
    () => enforceDisplayLimits({ data: [1], floatFlags: [false], shape: [1, 1, 1, 1, 1, 1, 1] }),
    /more than the playground's display limit of 6/,
  );
  assert.throws(
    () => enforceDisplayLimits({ data: new Array(513).fill(1), floatFlags: new Array(513).fill(false), shape: [513] }),
    /more than the playground's display limit of 512/,
  );
});
