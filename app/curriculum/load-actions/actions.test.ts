import assert from "node:assert/strict";
import test from "node:test";
import { parseLoadActions } from "./index.ts";
import { ApplyAction } from "./apply-action.ts";
import { ApplyCoursesCsv } from "./courses-csv-action.ts";
import { applyStructure, createCurriculumData } from "../curriculum-data.ts";
import { ApplyPpcJson } from "./ppc-json-action.ts";
import { ApplySectionsCsv } from "./sections-csv-action.ts";

function dataUrl(type: string, content: string) {
  return `data:${type},${encodeURIComponent(content)}`;
}

test("parses and resolves ordered curriculum load actions", async () => {
  const structure = createCurriculumData();
  const ppcUrl = dataUrl("application/json", JSON.stringify([{
    nome: "Nome JSON",
    ementa: "Ementa do PPC",
  }]));
  const coursesUrl = dataUrl("text/csv", [
    "trilhas,disciplina,horas,codigo,corr,tipo,creditos,reqs,periodo,ordem",
    "Dados,Nome CSV,60,1411111,,opt,4,,3,",
  ].join("\n"));
  const sectionsUrl = dataUrl("text/csv", [
    "vagas,prof.fullname,aulas SIGAA,sigla,codigo,capacidade,local,nturma,professor,disciplina",
    "28,Professora Teste,24M12,MN,1411111,30,CAA-101,01,prof,Nome CSV",
    "18,Professor Órfão,24M34,ORPHAN,9999999,20,CAA-102,01,prof,Curso inexistente",
  ].join("\n"));

  const actions = parseLoadActions([
    { type: "ppc_json", url: ppcUrl },
    { type: "courses_csv", url: coursesUrl },
    { type: "sections_csv", url: sectionsUrl },
    {
      type: "apply",
      structure: {
        courses: { "1411111": { category: "slot_optativa" } },
        sections: {},
      },
    },
  ], structure, { "Nome JSON": ["1411111"] });

  assert.ok(actions[0] instanceof ApplyPpcJson);
  assert.ok(actions[1] instanceof ApplyCoursesCsv);
  assert.ok(actions[2] instanceof ApplySectionsCsv);
  assert.ok(actions[3] instanceof ApplyAction);

  for (const action of actions) {
    applyStructure(structure, await action.resolve());
  }

  assert.deepEqual(structure.courses["1411111"].names, ["Nome CSV", "Nome JSON"]);
  assert.deepEqual(structure.courses["1411111"].mnemonics, ["MN"]);
  assert.equal(structure.courses["1411111"].category, "slot_optativa");
  assert.equal(structure.courses["1411111"].period, 3);
  assert.deepEqual(structure.sections["1411111:01"], {
    course_code: "1411111",
    professor: "Professora Teste",
    professor_mnemonic: "prof",
    section: "01",
    room: "CAA-101",
    schedule: "24M12",
    seats: "30",
  });
  assert.equal(structure.courses["9999999"], undefined);
  assert.equal(structure.sections["9999999:01"].course_code, "9999999");
});

test("rejects unknown action types", () => {
  assert.throws(
    () => parseLoadActions([{ type: "unknown" }], createCurriculumData(), {}),
    /Unknown load action type/,
  );
});
