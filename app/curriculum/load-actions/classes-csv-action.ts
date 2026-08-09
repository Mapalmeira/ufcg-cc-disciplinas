/** Resolves class CSV load actions. */
import { createCurriculumData } from "../curriculum-data.ts";
import type { LoadAction } from "./load-action.ts";
import { fetchCsv } from "./source-fetch.ts";
import type { Course, CurriculumData, Section } from "../types.ts";

/** Loads class sections and enriches courses that already exist. */
export class ApplyClassesCsv implements LoadAction {
  private readonly url: string;
  private readonly current: CurriculumData;

  constructor(url: string, current: CurriculumData) {
    this.url = url;
    this.current = current;
  }

  async resolve() {
    return this.structure(await fetchCsv(this.url));
  }

  private structure(values: string[][]): CurriculumData {
    const result = createCurriculumData();

    for (const [index, row] of values.slice(1).entries()) {
      const [
        code = "",
        professorMnemonic = "",
        mnemonic = "",
        section = "",
        ,
        room = "",
        ,
        schedule = "",
        seats = "",
        professor = "",
      ] = row;

      if (!code || (!professor && !professorMnemonic)) continue;

      const key = `${code}:${section || "no-section"}:${index}`;
      const record: Section = {
        course_code: code,
        professor: professor || professorMnemonic,
      };

      if (professorMnemonic) record.professor_mnemonic = professorMnemonic;
      if (section) record.section = section;
      if (room) record.room = room;
      if (schedule) record.schedule = schedule.trim().replace(/\s+/g, " ");
      if (seats) record.seats = seats;

      result.sections[key] = record;

      const course = this.current.courses[code];
      if (!mnemonic || !course) continue;

      const previousPatch = result.courses[code];
      const mnemonics = previousPatch?.mnemonics ?? course.mnemonics ?? [];

      result.courses[code] = {
        code,
        mnemonics: [...new Set([mnemonic, ...mnemonics])],
      };
    }

    return result;
  }
}
