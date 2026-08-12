import assert from "node:assert/strict";
import test from "node:test";

import { ParseError, parseTensorLiteral } from "../js/parser.mjs";

test("parses supported scalar number forms and preserves float intent", () => {
  const cases = [
    ["5", 5, false],
    ["-5", -5, false],
    ["2.5", 2.5, true],
    ["1e3", 1000, true],
    ["-1.5e-2", -0.015, true],
    ["007", 7, false],
  ];
  for (const [literal, value, isFloat] of cases) {
    const parsed = parseTensorLiteral(literal);
    assert.equal(parsed.value, value);
    assert.equal(parsed.isFloat, isFloat);
  }
});

test("parses arrays, whitespace, and nested empty arrays", () => {
  assert.deepEqual(parseTensorLiteral(" [ [ ], [ ] ] "), {
    type: "array",
    items: [
      { type: "array", items: [] },
      { type: "array", items: [] },
    ],
  });
});

test("rejects empty input with the required guidance", () => {
  assert.throws(
    () => parseTensorLiteral("  \n "),
    (error) => error instanceof ParseError && error.message.startsWith("Enter a number"),
  );
});

test("rejects syntax outside the tensor grammar", () => {
  const invalid = [
    "[1, 2",
    "[1, 2, ]",
    "[1 true]",
    "[1, true, 3]",
    "null",
    '"five"',
    "{\"value\": 5}",
    "+5",
    ".5",
    "NaN",
    "Infinity",
  ];
  for (const literal of invalid) {
    assert.throws(
      () => parseTensorLiteral(literal),
      (error) => error instanceof ParseError && error.message.startsWith("Couldn't parse"),
      literal,
    );
  }
});

test("reports a useful character position for syntax failures", () => {
  assert.throws(
    () => parseTensorLiteral("[1, true]"),
    (error) => error.position === 4,
  );
});
