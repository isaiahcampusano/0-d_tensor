export const MAX_RANK = 6;
export const MAX_ELEMENTS = 512;

export class TensorError extends Error {
  constructor(message) {
    super(message);
    this.name = "TensorError";
  }
}

export function prod(dimensions) {
  return dimensions.reduce((result, dimension) => result * dimension, 1);
}

function shapesEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function flattenAndInfer(node) {
  if (node?.type === "number") {
    return { data: [node.value], shape: [], floatFlags: [node.isFloat] };
  }
  if (node?.type !== "array" || !Array.isArray(node.items)) {
    throw new TensorError("Tensor values must be numbers or nested lists of numbers.");
  }
  if (node.items.length === 0) {
    return { data: [], shape: [0], floatFlags: [] };
  }

  const data = [];
  const floatFlags = [];
  let childShape = null;
  for (const item of node.items) {
    const result = flattenAndInfer(item);
    if (childShape === null) childShape = result.shape;
    else if (!shapesEqual(result.shape, childShape)) {
      throw new TensorError("Nested lists must have a rectangular shape.");
    }
    data.push(...result.data);
    floatFlags.push(...result.floatFlags);
  }
  return { data, shape: [node.items.length, ...childShape], floatFlags };
}

export function enforceDisplayLimits(tensor) {
  if (tensor.shape.length > MAX_RANK) {
    throw new TensorError(
      `This input has ${tensor.shape.length} axes, which is more than the playground's display limit of ${MAX_RANK}. Try a smaller example.`,
    );
  }
  if (tensor.data.length > MAX_ELEMENTS) {
    throw new TensorError(
      `This input has ${tensor.data.length} values, which is more than the playground's display limit of ${MAX_ELEMENTS}. Try a smaller example.`,
    );
  }
  return tensor;
}

export function createTensor(node) {
  const inferred = flattenAndInfer(node);
  return enforceDisplayLimits({ ...inferred, ndim: inferred.shape.length });
}

export function formatNumber(value, isFloat = false) {
  if (!isFloat) return String(value);
  if (Number.isInteger(value)) return `${String(value)}.0`;
  return String(value);
}

export function formatShape(shape) {
  if (shape.length === 0) return "()";
  if (shape.length === 1) return `(${shape[0]},)`;
  return `(${shape.join(", ")})`;
}

export function visualize(tensor) {
  let leafIndex = 0;
  function format(shape) {
    if (shape.length === 0) {
      const text = formatNumber(tensor.data[leafIndex], tensor.floatFlags[leafIndex]);
      leafIndex += 1;
      return text;
    }
    const pieces = [];
    for (let index = 0; index < shape[0]; index += 1) {
      pieces.push(format(shape.slice(1)));
    }
    return `[${pieces.join(", ")}]`;
  }
  return format(tensor.shape);
}

export function expandDims(tensor, axis) {
  if (typeof axis !== "number" || !Number.isInteger(axis)) {
    throw new TensorError("Axis must be a whole number.");
  }
  const ndim = tensor.shape.length;
  const normalizedAxis = axis < 0 ? ndim + axis + 1 : axis;
  const clampedAxis = Math.max(0, Math.min(normalizedAxis, ndim));
  const shape = [
    ...tensor.shape.slice(0, clampedAxis),
    1,
    ...tensor.shape.slice(clampedAxis),
  ];
  const expanded = enforceDisplayLimits({
    data: [...tensor.data],
    floatFlags: [...tensor.floatFlags],
    shape,
    ndim: shape.length,
  });
  return {
    tensor: expanded,
    clampedAxis,
    normalizedAxis,
    wasClamped: clampedAxis !== normalizedAxis,
  };
}

export function multiIndexFromFlat(shape, flatIndex) {
  if (shape.length === 0) return [];
  const indices = new Array(shape.length).fill(0);
  let remainder = flatIndex;
  for (let axis = shape.length - 1; axis >= 0; axis -= 1) {
    indices[axis] = remainder % shape[axis];
    remainder = Math.floor(remainder / shape[axis]);
  }
  return indices;
}

export function formatIndex(indices) {
  if (indices.length === 0) return "()";
  if (indices.length === 1) return `(${indices[0]},)`;
  return `(${indices.join(", ")})`;
}
