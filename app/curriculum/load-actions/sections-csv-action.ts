/** Resolves class CSV load actions. */
import { createCurriculumData } from "../curriculum-data.ts";
import type { LoadAction } from "./load-action.ts";
import { fetchCsv } from "./source-fetch.ts";
import type { CurriculumData, Section } from "../types.ts";

/** Loads class sections and enriches courses that already exist. */
export class ApplySectionsCsv implements LoadAction {
  readonly sourceName = "ofertas de turmas";
  readonly processingMessage = "Processando as ofertas de turmas...";
  private readonly url: string;
  private readonly current: CurriculumData;

  constructor(url: string, current: CurriculumData) {
    this.url = url;
    this.current = current;
  }

  async fetch() {
    const rows = await fetchCsv(this.url);
    return () => this.structure(rows);
  }

  private structure(rows: Record<string, string>[]): CurriculumData {
    const result = createCurriculumData();

    for (const row of rows) {
      const code = row.codigo;
      const professorMnemonic = row.professor;
      const mnemonic = row.sigla;
      const section = row.nturma;
      const room = row.local;
      const schedule = row["aulas SIGAA"];
      const seats = row.capacidade;
      const professor = row["prof.fullname"];

      if (!code || (!professor && !professorMnemonic)) continue;

      const key = `${code}:${section || "no-section"}`;
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
