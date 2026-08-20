import test from "node:test";
import assert from "node:assert/strict";

import { DIMENSION_STORIES, dimensionStory } from "../js/render.mjs";

test("provides the specified everyday analogy for dimensions 0 through 4", () => {
  assert.deepEqual(
    DIMENSION_STORIES.map(({ technical, name }) => ({ technical, name })),
    [
      { technical: "scalar", name: "A single number" },
      { technical: "vector", name: "A list of numbers" },
      { technical: "matrix", name: "A grid of numbers" },
      { technical: "3-D tensor", name: "A stack of grids" },
      { technical: "4-D tensor", name: "A batch of image stacks" },
    ],
  );
});

test("uses a plain-language fallback beyond four dimensions", () => {
  const story = dimensionStory(6);
  assert.equal(story.technical, "6-D tensor");
  assert.match(story.name, /6 levels of nested boxes/);
  assert.match(story.analogy, /Five or more axes/);
});
