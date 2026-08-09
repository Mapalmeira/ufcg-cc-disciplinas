import type { CurriculumData } from "../types.ts";

/** An ordered load operation that resolves to a canonical curriculum patch. */
export interface LoadAction {
  resolve(): Promise<CurriculumData>;
}
