/** Parses the ordered load actions configured for the curriculum loader. */
import { ApplyAction } from "./apply-action.ts";
import { ApplyCoursesCsv } from "./courses-csv-action.ts";
import { ApplyPpcJson } from "./ppc-json-action.ts";
import { ApplySectionsCsv } from "./sections-csv-action.ts";
import type { LoadAction } from "./load-action.ts";
import { applyStructure } from "../curriculum-data.ts";
import type { CurriculumData } from "../types.ts";

export type LoadProgressHandler = (message: string) => void;

function requiredString(action: Record<string, unknown>, field: string) {
  const value = action[field];

  if (typeof value !== "string" || !value) {
    throw new Error(`Load action requires a non-empty '${field}'`);
  }

  return value;
}

function parseLoadAction(
  value: unknown,
  current: CurriculumData,
  nameMapping: Record<string, string[]>,
): LoadAction {
  if (!value || typeof value !== "object") {
    throw new Error("Load action must be an object");
  }

  const action = value as Record<string, unknown>;

  if (action.type === "apply") {
    if (!action.structure || typeof action.structure !== "object") {
      throw new Error("Apply action requires a structure");
    }

    return new ApplyAction(action.structure as CurriculumData);
  }

  if (action.type === "ppc_json") {
    return new ApplyPpcJson(requiredString(action, "url"), nameMapping);
  }

  if (action.type === "courses_csv") {
    return new ApplyCoursesCsv(requiredString(action, "url"));
  }

  if (action.type === "sections_csv") {
    return new ApplySectionsCsv(requiredString(action, "url"), current);
  }

  throw new Error(`Unknown load action type: ${String(action.type)}`);
}

export function parseLoadActions(
  values: readonly unknown[],
  current: CurriculumData,
  nameMapping: Record<string, string[]>,
) {
  return values.map((value) => parseLoadAction(value, current, nameMapping));
}

/** Fetches every source concurrently, then processes its result in config order. */
export async function executeLoadActions(
  actions: readonly LoadAction[],
  current: CurriculumData,
  onProgress?: LoadProgressHandler,
) {
  const sourceCount = actions.filter((action) => action.sourceName).length;
  let fetchedSourceCount = 0;

  if (sourceCount > 0) {
    onProgress?.(`Baixando ${sourceCount} fontes de dados em paralelo...`);
  }

  const processors = await Promise.all(actions.map(async (action) => {
    const processor = await action.fetch();

    if (action.sourceName) {
      fetchedSourceCount += 1;
      onProgress?.(
        `Fontes baixadas: ${fetchedSourceCount} de ${sourceCount} (${action.sourceName}).`,
      );
    }

    return processor;
  }));

  for (const [index, processor] of processors.entries()) {
    onProgress?.(actions[index].processingMessage);
    applyStructure(current, processor());
  }

  return current;
}
