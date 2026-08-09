import { useState } from "react";
import type { Course } from "../../curriculum/types";
import type { PlanningStatus } from "./CourseCard";

function loadStatuses(): Record<string, PlanningStatus> {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem("grade-status-v1") ?? "{}");
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

    localStorage.setItem("grade-status-v1", JSON.stringify(next));
    return next;
  });

  const clearPlanning = () => {
    setStatuses({});
    localStorage.removeItem("grade-status-v1");
  };

  return { statuses, cycleStatus, clearPlanning };
}
