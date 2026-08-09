import type { LoadAction } from "./load-action.ts";
import type { CurriculumData } from "../types.ts";

/** Returns a curriculum patch already present in the source configuration. */
export class ApplyAction implements LoadAction {
  private readonly patch: CurriculumData;

  constructor(patch: CurriculumData) {
    this.patch = patch;
  }

  async resolve() {
    return this.patch;
  }
}
