import type { CurriculumData } from "./types";

/** Creates an empty canonical curriculum structure. */
export function createCurriculumData(): CurriculumData {
  return { courses: {}, sections: {} };
}

function mergeRecord<T extends object>(current: T | undefined, incoming: T): T {
  const merged: Record<string, unknown> = {
    ...(current as Record<string, unknown> | undefined),
    ...(incoming as Record<string, unknown>),
  };

  for (const [field, value] of Object.entries(incoming)) {
    const previous = current?.[field as keyof T];

    if (Array.isArray(previous) && Array.isArray(value)) {
      merged[field] = [...new Set([...value, ...previous])];
    }
  }

  return merged as T;
}

/**
 * Applies a data patch to the canonical structure.
 *
 * Scalar fields from the newest load replace older values. Arrays are merged,
 * deduplicated, and ordered with values from the newest load first.
 */
export function applyStructure(target: CurriculumData, patch: CurriculumData) {
  for (const [key, course] of Object.entries(patch.courses)) {
    target.courses[key] = mergeRecord(target.courses[key], course);
  }

  for (const [key, section] of Object.entries(patch.sections)) {
    target.sections[key] = mergeRecord(target.sections[key], section);
  }

  return target;
}
