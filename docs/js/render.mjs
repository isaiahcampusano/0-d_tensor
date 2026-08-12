import {
  formatIndex,
  formatNumber,
  formatShape,
  multiIndexFromFlat,
  prod,
} from "./tensor.mjs";

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
    const group = element("span", `tensor-group depth-${depth % 4}`);
    if (newAxis === depth) group.classList.add("axis-inserted");
    const groupControl = element("button", "axis-badge group-control", `axis ${depth}`);
    groupControl.type = "button";
    group.append(groupControl, element("span", "bracket", "["));

    const contents = element("span", "tensor-group-contents");
    for (let index = 0; index < shape[0]; index += 1) {
      if (index > 0) contents.append(element("span", "separator", ", "));
      contents.append(build(shape.slice(1), depth + 1, [...path, index]));
    }
    group.append(contents, element("span", "bracket", "]"));

    const end = Math.max(start, leafIndex - 1);
    const groupSize = prod(shape);
    const rangeLabel = groupSize === 0 ? "no stored values" : `flat indices ${start} through ${end}`;
    setTargetData(groupControl, start, end, "group", `Axis ${depth} group, ${rangeLabel}`);
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
