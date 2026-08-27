import { useState } from "react";
import type { Course } from "../../curriculum/types";
import type { PlanningStatus } from "./CourseCard";

const storageKey = "curriculum-planning-v1";
const legacyStorageKey = "grade-status-v1";

function loadStatuses(): Record<string, PlanningStatus> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey) ?? "{}");
  } catch {
    return {};
  }
}

export function usePlanning() {
  const [statuses, setStatuses] = useState<Record<string, PlanningStatus>>(loadStatuses);

  const cycleStatus = (course: Course) => setStatuses((current) => {
    if (!course.code) return current;

    const next = { ...current };
    if (!current[course.code]) next[course.code] = "paid";
    else if (current[course.code] === "paid") next[course.code] = "planned";
    else delete next[course.code];

    localStorage.setItem(storageKey, JSON.stringify(next));
    localStorage.removeItem(legacyStorageKey);
    return next;
  });

  const clearPlanning = () => {
    setStatuses({});
    localStorage.removeItem(storageKey);
    localStorage.removeItem(legacyStorageKey);
  };

  return { statuses, cycleStatus, clearPlanning };
}
