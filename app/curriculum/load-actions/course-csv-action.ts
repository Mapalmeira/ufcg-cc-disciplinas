/** Resolves course CSV load actions. */
import { createCurriculumData } from "../curriculum-data.ts";
import type { LoadAction } from "./load-action.ts";
import { fetchCsv } from "./source-fetch.ts";
import type { Course, CurriculumData } from "../types.ts";

/** Loads the curriculum spreadsheet and structures its course rows. */
export class ApplyCourseCsv implements LoadAction {
  private readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  async resolve() {
    return this.structure(await fetchCsv(this.url));
  }

  private structure(values: string[][]): CurriculumData {
    const result = createCurriculumData();

    for (const row of values.slice(1)) {
      const [
        code = "",
        period = "",
        kind = "",
        name = "",
        credits = "",
        hours = "",
        prerequisites = "",
        corequisites = "",
        ,
        tracks = "",
      ] = row;

      if (!code || !name) continue;

      const course: Course = {
        code,
        names: [name],
        prerequisites: this.parseList(prerequisites),
        corequisites: this.parseList(corequisites),
        tracks: this.parseList(tracks),
      };

      const parsedPeriod = this.parseNumber(period);
      const parsedCredits = this.parseNumber(credits);
      const parsedHours = this.parseNumber(hours);

      if (kind === "obr") course.category = "obrigatoria";
      if (kind === "opt") course.category = "optativa";
      if (parsedPeriod !== undefined) course.period = parsedPeriod;
      if (parsedCredits !== undefined) course.credits = parsedCredits;
      if (parsedHours !== undefined) course.hours = parsedHours;

      result.courses[code] = course;
    }

    return result;
  }

  private parseNumber(value: string) {
    if (!value.trim()) return undefined;
    const result = Number(value);
    return Number.isFinite(result) ? result : undefined;
  }

  private parseList(value: string) {
    return value.trim() ? value.trim().split(/\s+/) : [];
  }
}
