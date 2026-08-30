import type { LoadAction } from "./load-action.ts";
import type { CurriculumData } from "../types.ts";

/** Returns a curriculum patch already present in the source configuration. */
export class ApplyAction implements LoadAction {
  readonly processingMessage = "Aplicando os ajustes finais...";
  private readonly patch: CurriculumData;

  constructor(patch: CurriculumData) {
    this.patch = patch;
  }

  async fetch() {
    return () => this.patch;
  }
}
