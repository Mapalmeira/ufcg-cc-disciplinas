import assert from "node:assert/strict";
import test from "node:test";
import { applyStructure, createCurriculumData } from "./curriculum-data.ts";

test("merges newer curriculum values first and removes duplicates", () => {
  const data = createCurriculumData();

  applyStructure(data, {
    courses: {
      "1411111": {
        names: ["Nome antigo"],
        tracks: ["Sistemas", "Dados"],
      },
    },
    sections: {},
  });

  applyStructure(data, {
    courses: {
      "1411111": {
        names: ["Nome novo"],
        tracks: ["Teoria", "Dados"],
      },
    },
    sections: {},
  });

  assert.deepEqual(data.courses["1411111"].names, ["Nome novo", "Nome antigo"]);
  assert.deepEqual(data.courses["1411111"].tracks, ["Teoria", "Dados", "Sistemas"]);
});

test("applies scalar values from the newest patch", () => {
  const data = createCurriculumData();

  applyStructure(data, {
    courses: { "1411111": { hours: 60 } },
    sections: {},
  });
  applyStructure(data, {
    courses: { "1411111": { hours: 90 } },
    sections: {},
  });

  assert.equal(data.courses["1411111"].hours, 90);
});
