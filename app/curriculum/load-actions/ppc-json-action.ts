import { createCurriculumData } from "../curriculum-data.ts";
import type { LoadAction } from "./load-action.ts";
import { fetchJson } from "./source-fetch.ts";
import type { Course, CurriculumData } from "../types.ts";

/** Resolves PPC JSON load actions and maps names to course codes. */
export class ApplyPpcJson implements LoadAction {
  private readonly url: string;
  private readonly nameMapping: Record<string, string[]>;

  constructor(url: string, nameMapping: Record<string, string[]>) {
    this.url = url;
    this.nameMapping = nameMapping;
  }

  async resolve() {
    return this.structure(await fetchJson(this.url));
  }

  private structure(values: unknown[]): CurriculumData {
    const result = createCurriculumData();

    for (const value of values) {
      if (!value || typeof value !== "object") continue;

      const source = value as Record<string, unknown>;
      if (typeof source.nome !== "string" || !source.nome) continue;

      const course: Course = { names: [source.nome] };

      if (typeof source.carga_horaria === "number") {
        course.hours = source.carga_horaria;
      }

      if (typeof source.creditos === "number") {
        course.credits = source.creditos;
      }

      if (typeof source.unidade_responsavel === "string") {
        course.responsible_unit = source.unidade_responsavel;
      }

      if (typeof source.ementa === "string") {
        course.syllabus = source.ementa;
      }

      const codes = this.nameMapping[source.nome];

      if (codes?.length) {
        for (const code of codes) {
          result.courses[code] = { ...course, code };
        }
      } else {
        result.courses[source.nome] = course;
      }
    }

    return result;
  }
}
