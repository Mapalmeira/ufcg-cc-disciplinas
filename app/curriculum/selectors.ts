import type { Course, CurriculumData } from "./types";
import { isVisibleCourse } from "./course-utils.ts";
import { normalizeSearchText } from "./search-utils.ts";

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

export function reachableCourseCodesIndex(courseCodes: string[], directDependents: ReadonlyMap<string, string[]>) {
  const result = new Map<string, string[]>();

  for (const sourceCode of courseCodes) {
    const visited = new Set([sourceCode]);
    const queue = [...(directDependents.get(sourceCode) ?? [])];
    const reachableCodes: string[] = [];

    for (let index = 0; index < queue.length; index += 1) {
      const code = queue[index];
      if (visited.has(code)) continue;

      visited.add(code);
      reachableCodes.push(code);
      queue.push(...(directDependents.get(code) ?? []));
    }

    if (reachableCodes.length) result.set(sourceCode, reachableCodes);
  }

  return result;
}

export function buildDependencyIndexes(coursesByCode: Readonly<Record<string, Course>>) {
  const courses = Object.values(coursesByCode).filter(isVisibleCourse);
  const directDependentsByCode = directDependentsIndex(courses);
  const courseCodes = courses.map((course) => course.code);
  const reachableCourseCodesByCode = reachableCourseCodesIndex(courseCodes, directDependentsByCode);
  const indirectDependentsByCode = new Map<string, string[]>();

  for (const [code, reachableCodes] of reachableCourseCodesByCode) {
    const directCodes = new Set(directDependentsByCode.get(code) ?? []);
    const indirectCodes = reachableCodes.filter((reachableCode) => !directCodes.has(reachableCode));

    if (indirectCodes.length) indirectDependentsByCode.set(code, indirectCodes);
  }

  return { directDependentsByCode, indirectDependentsByCode, hasVisibleCourses: courses.length > 0 };
}

export function buildSearchTextIndexes(data: CurriculumData) {
  const courseSearchTextByCode = new Map<string, string>();
  const sectionSearchTextByKey = new Map<string, string>();

  for (const course of Object.values(data.courses)) {
    if (!isVisibleCourse(course)) continue;

    courseSearchTextByCode.set(course.code, normalizeSearchText(
      `${course.code} ${(course.names ?? []).join(" ")} ${(course.mnemonics ?? []).join(" ")}`,
    ));
  }

  for (const [key, section] of Object.entries(data.sections)) {
    const course = data.courses[section.course_code ?? ""];
    if (!isVisibleCourse(course)) continue;

    sectionSearchTextByKey.set(key, normalizeSearchText(
      `${section.professor ?? ""} ${section.professor_mnemonic ?? ""} ${section.course_code ?? ""} ${(course.names ?? []).join(" ")} ${(course.mnemonics ?? []).join(" ")}`,
    ));
  }

  return { courseSearchTextByCode, sectionSearchTextByKey };
}

export function buildCurriculumIndexes(data: CurriculumData) {
  return {
    ...buildDependencyIndexes(data.courses),
    ...buildSearchTextIndexes(data),
  };
}
