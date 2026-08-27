import type { Course } from "./types";
import { isVisibleCourse } from "./course-utils";

export function directDependentsIndex(courses: Course[]) {
  const result = new Map<string, string[]>();

  for (const course of courses) {
    if (!course.code) continue;

    for (const reference of course.prerequisites ?? []) {
      const key = reference;
      const courseKey = course.code;
      const dependents = result.get(key) ?? [];

      if (key === courseKey || dependents.includes(courseKey)) continue;

      result.set(key, [...dependents, courseKey]);
    }
  }

  return result;
}

export function buildDependencyIndexes(coursesByCode: Readonly<Record<string, Course>>) {
  const courses = Object.values(coursesByCode).filter(isVisibleCourse);
  const directDependentsByCode = directDependentsIndex(courses);

  return { directDependentsByCode };
}
