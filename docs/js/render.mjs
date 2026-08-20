import {
  formatIndex,
  formatNumber,
  formatShape,
  multiIndexFromFlat,
  prod,
} from "./tensor.mjs";

export const DIMENSION_STORIES = [
  { technical: "scalar", name: "A single number", analogy: "Like one temperature reading: 5°." },
  { technical: "vector", name: "A list of numbers", analogy: "Like the temperatures for one week." },
  { technical: "matrix", name: "A grid of numbers", analogy: "Like the pixels in a grayscale image." },
  { technical: "3-D tensor", name: "A stack of grids", analogy: "Like the red, green, and blue layers of a color image." },
  { technical: "4-D tensor", name: "A batch of image stacks", analogy: "Like several color images bundled together." },
];

export function dimensionStory(ndim) {
  if (ndim < DIMENSION_STORIES.length) return DIMENSION_STORIES[ndim];
  return {
    technical: `${ndim}-D tensor`,
    name: `${ndim} levels of nested boxes`,
    analogy: "Five or more axes are usually used for batches, time steps, or other extra groupings.",
  };
}

function element(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== "") node.textContent = text;
  return node;
}

function setTargetData(node, start, end, kind, label) {
  node.classList.add("tensor-target");
  node.dataset.flatStart = String(start);
  node.dataset.flatEnd = String(end);
  node.dataset.kind = kind;
  node.tabIndex = -1;
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", label);
}

export function renderSummary(tensor, elements) {
  elements.rank.textContent = tensor ? String(tensor.ndim) : "—";
  elements.shape.textContent = tensor ? formatShape(tensor.shape) : "—";
  elements.count.textContent = tensor ? String(tensor.data.length) : "—";
}

export function renderNestedView(container, tensor, newAxis = null) {
  container.replaceChildren();
  let leafIndex = 0;

  function build(shape, depth, path) {
    if (shape.length === 0) {
      const currentIndex = leafIndex;
      const value = formatNumber(tensor.data[currentIndex], tensor.floatFlags[currentIndex]);
      const leaf = element("span", "tensor-leaf", value);
      const indexLabel = formatIndex(path);
      setTargetData(
        leaf,
        currentIndex,
        currentIndex,
        "leaf",
        `Value ${value}, index ${indexLabel}, flat index ${currentIndex}`,
      );
      leaf.dataset.indexPath = indexLabel;
      leafIndex += 1;
      return leaf;
    }

    const start = leafIndex;
    const colorDepth = Math.min(depth + 1, 6);
    const group = element("span", `tensor-group depth-${colorDepth}`);
    if (newAxis === depth) group.classList.add("axis-inserted");
    const groupControl = element("button", "axis-badge group-control", `Level ${depth + 1} (axis ${depth})`);
    groupControl.type = "button";
    const context = element("span", "axis-context");
    const story = dimensionStory(depth + 1);
    context.append(element("strong", "", story.name), element("span", "", story.analogy));
    group.append(groupControl, context, element("span", "bracket", "["));

    const contents = element("span", "tensor-group-contents");
    for (let index = 0; index < shape[0]; index += 1) {
      if (index > 0) contents.append(element("span", "separator", ", "));
      contents.append(build(shape.slice(1), depth + 1, [...path, index]));
    }
    group.append(contents, element("span", "bracket", "]"));

    const end = Math.max(start, leafIndex - 1);
    const groupSize = prod(shape);
    const rangeLabel = groupSize === 0 ? "no stored values" : `flat indices ${start} through ${end}`;
    setTargetData(
      groupControl,
      start,
      end,
      "group",
      `Level ${depth + 1}, axis ${depth}. ${story.name}. ${story.analogy} ${rangeLabel}`,
    );
    return group;
  }

  container.append(build(tensor.shape, 0, []));
}

export function renderFlatView(container, tensor) {
  container.replaceChildren();
  if (tensor.data.length === 0) {
    const empty = element("p", "empty-storage", "No stored values — this tensor has an empty axis.");
    container.append(empty);
    return;
  }

  tensor.data.forEach((number, flatIndex) => {
    const indices = multiIndexFromFlat(tensor.shape, flatIndex);
    const indexLabel = formatIndex(indices);
    const value = formatNumber(number, tensor.floatFlags[flatIndex]);
    const cell = element("button", "flat-cell");
    cell.type = "button";
    setTargetData(
      cell,
      flatIndex,
      flatIndex,
      "flat-cell",
      `Value ${value}, index ${indexLabel}, flat index ${flatIndex}`,
    );
    cell.append(
      (() => {
        const indicators = element("span", "flat-depth-indicators");
        if (tensor.ndim === 0) {
          const indicator = element("span", "depth-0", "0D");
          indicator.title = "A scalar has zero nesting levels";
          indicators.append(indicator);
        }
        for (let depth = 1; depth <= tensor.ndim; depth += 1) {
          const indicator = element("span", `depth-${Math.min(depth, 6)}`, `L${depth}`);
          indicator.title = `Nesting level ${depth}`;
          indicators.append(indicator);
        }
        return indicators;
      })(),
      element("span", "flat-index", String(flatIndex)),
      element("span", "flat-value", value),
      element("span", "multi-index", indexLabel),
    );
    container.append(cell);
  });
}

export function renderTensor(tensor, elements, newAxis = null) {
  renderSummary(tensor, elements);
  renderNestedView(elements.nested, tensor, newAxis);
  renderFlatView(elements.flat, tensor);
  elements.visualization.hidden = false;
}

export function clearTensor(elements) {
  renderSummary(null, elements);
  elements.nested.replaceChildren();
  elements.flat.replaceChildren();
  elements.visualization.hidden = true;
}
