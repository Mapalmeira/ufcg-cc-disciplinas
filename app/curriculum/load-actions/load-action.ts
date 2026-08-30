import type { CurriculumData } from "../types.ts";

export type LoadActionProcessor = () => CurriculumData;

/**
 * A load operation whose source can be fetched in parallel and processed later.
 */
export interface LoadAction {
  readonly sourceName?: string;
  readonly processingMessage: string;
  fetch(): Promise<LoadActionProcessor>;
}
