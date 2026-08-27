import assert from "node:assert/strict";
import test from "node:test";
import { isVisibleCourse } from "./course-utils.ts";

test("a visible course must have a code and not be ignored", () => {
  assert.equal(isVisibleCourse(undefined), false);
  assert.equal(isVisibleCourse({ names: ["Sem código"] }), false);
  assert.equal(isVisibleCourse({ code: "100", ignored: true }), false);
  assert.equal(isVisibleCourse({ code: "100", ignored: false }), true);
  assert.equal(isVisibleCourse({ code: "100" }), true);
});
