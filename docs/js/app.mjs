import { EXAMPLES } from "./examples.mjs";
import { connectTensorViews } from "./interactions.mjs";
import { ParseError, parseTensorLiteral } from "./parser.mjs";
import { dimensionStory, renderTensor } from "./render.mjs";
import {
  MAX_RANK,
  TensorError,
  createTensor,
  expandDims,
  formatShape,
  visualize,
} from "./tensor.mjs";

const elements = {
  form: document.querySelector("#tensor-form"),
  input: document.querySelector("#tensor-input"),
  reset: document.querySelector("#reset-button"),
  examples: document.querySelector("#example-buttons"),
  error: document.querySelector("#input-error"),
  rank: document.querySelector("#rank-value"),
  shape: document.querySelector("#shape-value"),
  count: document.querySelector("#count-value"),
  visualization: document.querySelector("#visualization"),
  nested: document.querySelector("#nested-view"),
  flat: document.querySelector("#flat-view"),
  expandForm: document.querySelector("#expand-form"),
  axis: document.querySelector("#axis-input"),
  expandButton: document.querySelector("#expand-button"),
  beforeShape: document.querySelector("#before-shape"),
  afterShape: document.querySelector("#after-shape"),
  expandNote: document.querySelector("#expand-note"),
  liveRegion: document.querySelector("#live-region"),
  addDimension: document.querySelector("#add-dimension-button"),
  story: document.querySelector("#dimension-story"),
  storyKicker: document.querySelector("#dimension-kicker"),
  storyName: document.querySelector("#dimension-name"),
  storyAnalogy: document.querySelector("#dimension-analogy"),
};

let tensor = null;
let disconnectInteractions = () => {};

function renderExampleButtons() {
  EXAMPLES.forEach((example) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "example-button";
    button.textContent = example.label;
    button.dataset.literal = example.literal;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      elements.input.value = example.literal;
      loadTensor();
    });
    elements.examples.append(button);
  });
}

function updateExampleState() {
  const literal = elements.input.value.trim();
  elements.examples.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.literal === literal));
  });
}

function clearError() {
  elements.error.hidden = true;
  elements.error.textContent = "";
  elements.input.setAttribute("aria-invalid", "false");
  elements.axis.setAttribute("aria-invalid", "false");
}

function showError(error) {
  let message = error instanceof Error ? error.message : String(error);
  if (error instanceof ParseError && error.position !== null && elements.input.value.trim() !== "") {
    message += ` Problem near character ${error.position + 1}.`;
  }
  elements.error.textContent = `Error: ${message}`;
  elements.error.hidden = false;
  elements.input.setAttribute("aria-invalid", "true");
}

function showAxisError(error) {
  elements.axis.setAttribute("aria-invalid", "true");
  elements.expandNote.textContent = `Error: ${error.message}`;
  elements.expandNote.className = "message error-message";
  elements.expandNote.setAttribute("role", "alert");
  elements.expandNote.hidden = false;
}

function resetExpandState() {
  elements.axis.value = "0";
  elements.axis.disabled = !tensor;
  elements.expandButton.disabled = !tensor;
  elements.beforeShape.textContent = tensor ? formatShape(tensor.shape) : "—";
  elements.afterShape.textContent = "—";
  elements.expandNote.hidden = true;
  elements.expandNote.textContent = "";
  elements.expandNote.className = "message info-message";
  elements.expandNote.removeAttribute("role");
}

function draw(newAxis = null) {
  disconnectInteractions();
  renderTensor(tensor, elements, newAxis);
  disconnectInteractions = connectTensorViews(elements.visualization, elements.liveRegion);
  updateDimensionStory();
}

function updateDimensionStory() {
  const story = dimensionStory(tensor.ndim);
  elements.story.className = `dimension-story depth-${Math.min(tensor.ndim, MAX_RANK)}`;
  elements.storyKicker.textContent = `${tensor.ndim} ${tensor.ndim === 1 ? "dimension" : "dimensions"} · ${story.technical}`;
  elements.storyName.textContent = story.name;
  elements.storyAnalogy.textContent = story.analogy;
  elements.addDimension.disabled = tensor.ndim >= MAX_RANK;
  elements.addDimension.firstChild.textContent = tensor.ndim >= MAX_RANK
    ? "Maximum display depth reached "
    : "Add a dimension ";
  elements.addDimension.lastElementChild.hidden = tensor.ndim >= MAX_RANK;
}

function loadTensor() {
  clearError();
  try {
    const node = parseTensorLiteral(elements.input.value);
    tensor = createTensor(node);
    draw();
    resetExpandState();
    updateExampleState();
    elements.liveRegion.textContent = `Loaded a ${tensor.ndim}-D tensor with shape ${formatShape(tensor.shape)}.`;
  } catch (error) {
    if (error instanceof ParseError || error instanceof TensorError) showError(error);
    else throw error;
  }
}

function resetPlayground() {
  elements.input.value = "5";
  clearError();
  const node = parseTensorLiteral(elements.input.value);
  tensor = createTensor(node);
  draw();
  resetExpandState();
  updateExampleState();
  elements.liveRegion.textContent = "Back to one number with zero dimensions.";
  elements.addDimension.focus();
}

function addDimension() {
  if (!tensor || tensor.ndim >= MAX_RANK) return;
  const result = expandDims(tensor, 0);
  tensor = result.tensor;
  elements.input.value = visualizeLiteral();
  draw(result.clampedAxis);
  resetExpandState();
  updateExampleState();
  const story = dimensionStory(tensor.ndim);
  elements.liveRegion.textContent = `Added dimension ${tensor.ndim}. ${story.name}. ${story.analogy}`;
}

function visualizeLiteral() {
  return visualize(tensor);
}

function applyExpansion() {
  if (!tensor) return;
  clearError();
  const rawAxis = elements.axis.value.trim();
  if (!/^-?\d+$/.test(rawAxis)) {
    showAxisError(new TensorError("Axis must be a whole number."));
    return;
  }

  try {
    const enteredAxis = Number(rawAxis);
    if (!Number.isSafeInteger(enteredAxis)) throw new TensorError("Axis must be a whole number.");
    const before = formatShape(tensor.shape);
    const previousNdim = tensor.ndim;
    const result = expandDims(tensor, enteredAxis);
    tensor = result.tensor;
    elements.input.value = visualize(tensor);
    const after = formatShape(tensor.shape);
    elements.beforeShape.textContent = before;
    elements.afterShape.textContent = after;
    elements.expandNote.hidden = false;
    elements.expandNote.className = "message info-message";
    elements.expandNote.removeAttribute("role");
    elements.expandNote.classList.toggle("is-clamped", result.wasClamped);
    elements.expandNote.textContent = result.wasClamped
      ? `Axis ${enteredAxis} was clamped to ${result.clampedAxis} (the valid range for a ${previousNdim}-D tensor is 0 to ${previousNdim}). The stored values didn't change — only the shape did.`
      : `New axis inserted at position ${result.clampedAxis}. The stored values didn't change — only the shape did.`;
    draw(result.clampedAxis);
    updateExampleState();
    elements.liveRegion.textContent = elements.expandNote.textContent;
  } catch (error) {
    if (error instanceof TensorError) showAxisError(error);
    else throw error;
  }
}

renderExampleButtons();
loadTensor();
resetExpandState();

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadTensor();
});
elements.reset.addEventListener("click", resetPlayground);
elements.addDimension.addEventListener("click", addDimension);
elements.input.addEventListener("input", updateExampleState);
elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    loadTensor();
  }
});
elements.expandForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyExpansion();
});
