import assert from "node:assert/strict";
import test from "node:test";
import { buildDependencyIndexes, directDependentsIndex } from "./selectors.ts";
import type { Course } from "./types.ts";

test("indexes direct dependents by prerequisite code", () => {
  const courses: Course[] = [
    { code: "100" },
    { code: "200", prerequisites: ["100"] },
    { code: "300", prerequisites: ["100"] },
    { code: "400", prerequisites: ["200", "300"] },
  ];

  const index = directDependentsIndex(courses);

  assert.deepEqual(index.get("100"), ["200", "300"]);
  assert.deepEqual(index.get("200"), ["400"]);
  assert.deepEqual(index.get("300"), ["400"]);
  assert.equal(index.has("400"), false);
});

test("does not duplicate dependents or index self references", () => {
  const courses: Course[] = [
    { code: "100", prerequisites: ["100"] },
    { code: "200", prerequisites: ["100", "100"] },
    { prerequisites: ["100"] },
  ];

  const index = directDependentsIndex(courses);

  assert.deepEqual(index.get("100"), ["200"]);
});

test("does not match prerequisite names to course codes", () => {
  const courses: Course[] = [
    { code: "100", names: ["Programação"] },
    { code: "200", prerequisites: ["100"] },
    { code: "300", prerequisites: ["Programação"] },
  ];

  const index = directDependentsIndex(courses);

  assert.deepEqual(index.get("100"), ["200"]);
  assert.equal(index.get("100")?.includes("300"), false);
});

test("builds dependency indexes only from visible dependent courses", () => {
  const coursesByCode: Record<string, Course> = {
    "100": { code: "100" },
    "200": { code: "200", prerequisites: ["100"] },
    "300": { code: "300", ignored: true, prerequisites: ["100"] },
    missingCode: { prerequisites: ["100"] },
  };

  const { directDependentsByCode } = buildDependencyIndexes(coursesByCode);

  assert.deepEqual(directDependentsByCode.get("100"), ["200"]);
});
