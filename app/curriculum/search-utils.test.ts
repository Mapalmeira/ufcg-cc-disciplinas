import assert from "node:assert/strict";
import test from "node:test";
import { compareLocalized, normalizeSearchText } from "./search-utils.ts";

test("normalizes accents and case for search", () => {
  assert.equal(normalizeSearchText("Álgebra LINEAR"), "algebra linear");
});

test("compares numeric text using numeric order", () => {
  assert.equal(compareLocalized("Turma 2", "Turma 10") < 0, true);
});
