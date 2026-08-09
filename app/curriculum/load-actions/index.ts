/** Parses the ordered load actions configured for the curriculum loader. */
import { ApplyAction } from "./apply-action.ts";
import { ApplyClassesCsv } from "./classes-csv-action.ts";
import { ApplyCourseCsv } from "./course-csv-action.ts";
import { ApplyPpcJson } from "./ppc-json-action.ts";
import type { LoadAction } from "./load-action.ts";
import type { CurriculumData } from "../types.ts";

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

  if (action.type === "course_csv") {
    return new ApplyCourseCsv(requiredString(action, "url"));
  }

  if (action.type === "classes_csv") {
    return new ApplyClassesCsv(requiredString(action, "url"), current);
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
