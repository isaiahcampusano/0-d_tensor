export function connectTensorViews(root, liveRegion) {
  const targets = [...root.querySelectorAll(".tensor-target")];
  let pinned = null;
  let activeIndex = 0;

  if (targets.length === 0) return () => {};
  targets[0].tabIndex = 0;

  function rangeFor(target) {
    return {
      start: Number(target.dataset.flatStart),
      end: Number(target.dataset.flatEnd),
    };
  }

  function clearHighlights() {
    targets.forEach((target) => {
      target.classList.remove("is-linked", "is-ancestor", "is-pinned");
      target.setAttribute("aria-pressed", "false");
    });
  }

  function highlight(source, isPinned = false, announce = false) {
    clearHighlights();
    if (!source) return;
    const selected = rangeFor(source);
    targets.forEach((target) => {
      const range = rangeFor(target);
      const overlaps = range.start <= selected.end && range.end >= selected.start;
      const contains = range.start <= selected.start && range.end >= selected.end;
      if (overlaps && target.dataset.kind !== "group") target.classList.add("is-linked");
      if (target.dataset.kind === "group" && contains) target.classList.add("is-ancestor");
    });
    source.classList.add("is-linked");
    if (isPinned) {
      source.classList.add("is-pinned");
      source.setAttribute("aria-pressed", "true");
    }
    if (announce) liveRegion.textContent = source.getAttribute("aria-label");
  }

  function pin(target) {
    pinned = pinned === target ? null : target;
    highlight(pinned, Boolean(pinned), true);
  }

  function moveFocus(direction) {
    targets[activeIndex].tabIndex = -1;
    activeIndex = (activeIndex + direction + targets.length) % targets.length;
    targets[activeIndex].tabIndex = 0;
    targets[activeIndex].focus();
  }

  targets.forEach((target, index) => {
    target.addEventListener("pointerenter", () => {
      if (!pinned) highlight(target);
    });
    target.addEventListener("pointerleave", () => {
      if (!pinned) clearHighlights();
    });
    target.addEventListener("focus", () => {
      activeIndex = index;
      targets.forEach((item, itemIndex) => { item.tabIndex = itemIndex === index ? 0 : -1; });
      if (!pinned) highlight(target, false, true);
    });
    target.addEventListener("blur", () => {
      if (!pinned) clearHighlights();
    });
    target.addEventListener("click", (event) => {
      event.stopPropagation();
      pin(target);
    });
    target.addEventListener("keydown", (event) => {
      if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        moveFocus(1);
      } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        moveFocus(-1);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pin(target);
      } else if (event.key === "Escape") {
        pinned = null;
        clearHighlights();
        liveRegion.textContent = "Selection cleared.";
      }
    });
  });

  function onRootClick(event) {
    if (!event.target.closest(".tensor-target")) {
      pinned = null;
      clearHighlights();
    }
  }
  root.addEventListener("click", onRootClick);

  return () => root.removeEventListener("click", onRootClick);
}
