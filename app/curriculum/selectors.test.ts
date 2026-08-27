import assert from "node:assert/strict";
import test from "node:test";
import { buildDependencyIndexes, buildSearchTextIndexes, directDependentsIndex, reachableCourseCodesIndex } from "./selectors.ts";
import type { Course, CurriculumData } from "./types.ts";

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

test("finds every course reachable through dependency chains", () => {
  const directDependents = new Map<string, string[]>([
    ["100", ["200", "400"]],
    ["200", ["300"]],
    ["300", ["500"]],
    ["400", ["500"]],
  ]);

  const reachable = reachableCourseCodesIndex(["100", "200", "300", "400", "500"], directDependents);

  assert.deepEqual(reachable.get("100"), ["200", "400", "300", "500"]);
  assert.deepEqual(reachable.get("200"), ["300", "500"]);
  assert.equal(reachable.has("500"), false);
});

test("indirect dependents exclude courses already listed as direct dependents", () => {
  const coursesByCode: Record<string, Course> = {
    "100": { code: "100" },
    "200": { code: "200", prerequisites: ["100"] },
    "300": { code: "300", prerequisites: ["200"] },
    "400": { code: "400", prerequisites: ["100"] },
    "500": { code: "500", prerequisites: ["300", "400"] },
  };

  const { directDependentsByCode, indirectDependentsByCode } = buildDependencyIndexes(coursesByCode);

  assert.deepEqual(directDependentsByCode.get("100"), ["200", "400"]);
  assert.deepEqual(indirectDependentsByCode.get("100"), ["300", "500"]);
});

test("dependency cycles terminate without making a course reachable from itself", () => {
  const coursesByCode: Record<string, Course> = {
    "100": { code: "100", prerequisites: ["300"] },
    "200": { code: "200", prerequisites: ["100"] },
    "300": { code: "300", prerequisites: ["200"] },
  };

  const { indirectDependentsByCode } = buildDependencyIndexes(coursesByCode);

  assert.deepEqual(indirectDependentsByCode.get("100"), ["300"]);
  assert.equal(indirectDependentsByCode.get("100")?.includes("100"), false);
});

test("builds normalized search text indexes for courses and sections", () => {
  const data: CurriculumData = {
    courses: {
      "100": { code: "100", names: ["Programação Básica"], mnemonics: ["PB"] },
      "200": { code: "200", names: ["Curso ignorado"], ignored: true },
    },
    sections: {
      "100:01": { course_code: "100", section: "01", professor: "José Álvares", professor_mnemonic: "JA" },
      "200:01": { course_code: "200", section: "01", professor: "Ignorado" },
    },
  };

  const { courseSearchTextByCode, sectionSearchTextByKey } = buildSearchTextIndexes(data);

  assert.equal(courseSearchTextByCode.get("100"), "100 programacao basica pb");
  assert.equal(sectionSearchTextByKey.get("100:01"), "jose alvares ja 100 programacao basica pb");
  assert.equal(courseSearchTextByCode.has("200"), false);
  assert.equal(sectionSearchTextByKey.has("200:01"), false);
});

test("dependency indexes report whether visible courses exist without another scan", () => {
  assert.equal(buildDependencyIndexes({ hidden: { code: "100", ignored: true } }).hasVisibleCourses, false);
  assert.equal(buildDependencyIndexes({ "100": { code: "100" } }).hasVisibleCourses, true);
});
