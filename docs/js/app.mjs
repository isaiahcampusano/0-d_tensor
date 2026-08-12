import { EXAMPLES } from "./examples.mjs";
import { connectTensorViews } from "./interactions.mjs";
import { ParseError, parseTensorLiteral } from "./parser.mjs";
import { clearTensor, renderTensor } from "./render.mjs";
import {
  TensorError,
  createTensor,
  expandDims,
  formatShape,
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
  tensor = null;
  disconnectInteractions();
  disconnectInteractions = () => {};
  elements.input.value = "";
  clearError();
  clearTensor(elements);
  resetExpandState();
  updateExampleState();
  elements.liveRegion.textContent = "Playground reset.";
  elements.input.focus();
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
    elements.liveRegion.textContent = elements.expandNote.textContent;
  } catch (error) {
    if (error instanceof TensorError) showAxisError(error);
    else throw error;
  }
}

renderExampleButtons();
clearTensor(elements);
resetExpandState();

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadTensor();
});
elements.reset.addEventListener("click", resetPlayground);
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
