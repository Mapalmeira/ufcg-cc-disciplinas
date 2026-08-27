/** Resolves course CSV load actions. */
import { createCurriculumData } from "../curriculum-data.ts";
import type { LoadAction } from "./load-action.ts";
import { fetchCsv } from "./source-fetch.ts";
import type { Course, CurriculumData } from "../types.ts";

/** Loads the curriculum spreadsheet and structures its course rows. */
export class ApplyCoursesCsv implements LoadAction {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  async resolve() {
    return this.structure(await fetchCsv(this.url));
  }

  private structure(rows: Record<string, string>[]): CurriculumData {
    const result = createCurriculumData();

    for (const row of rows) {
      const code = row.codigo;
      const name = row.disciplina;

      if (!code || !name) continue;

      const course: Course = {
        code,
        names: [name],
        prerequisites: this.parseList(row.reqs),
        corequisites: this.parseList(row.corr),
        tracks: this.parseList(row.trilhas),
      };

      const parsedPeriod = this.parseNumber(row.periodo);
      const parsedCredits = this.parseNumber(row.creditos);
      const parsedHours = this.parseNumber(row.horas);

      if (row.tipo === "obr") course.category = "obrigatoria";
      if (row.tipo === "opt") course.category = "optativa";
      if (parsedPeriod !== undefined) course.period = parsedPeriod;
      if (parsedCredits !== undefined) course.credits = parsedCredits;
      if (parsedHours !== undefined) course.hours = parsedHours;

      result.courses[code] = course;
    }

    return result;
  }

  private parseNumber(value = "") {
    if (!value) return undefined;
    const result = Number(value);
    return Number.isFinite(result) ? result : undefined;
  }

  private parseList(value = "") {
    return value ? value.split(/\s+/) : [];
  }
}
