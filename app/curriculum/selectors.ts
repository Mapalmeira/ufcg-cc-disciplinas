import type { Course, CurriculumData } from "./types";

function canonical(code: string | undefined) {
  return (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function plain(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function visibleCourses(data: CurriculumData) {
  return Object.values(data.courses).filter(
    (course) => Boolean(course.code) && !course.ignored,
  );
}

export function visibleSections(data: CurriculumData, courses: Course[]) {
  const codes = new Set(courses.map((course) => canonical(course.code)));

  return Object.values(data.sections).filter((section) => (
    codes.has(canonical(section.course_code))
  ));
}

export function courseIndex(courses: Course[]) {
  return new Map(courses.map((course) => [canonical(course.code), course]));
}

export function releasesIndex(courses: Course[]) {
  const result = new Map<string, Course[]>();

  for (const course of courses) {
    for (const reference of course.prerequisites ?? []) {
      const source = courses.find((item) => (
        canonical(item.code) === canonical(reference)
        || (item.names ?? []).some((name) => plain(name) === plain(reference))
      ));

      if (!source?.code) continue;

      const key = canonical(source.code);
      result.set(key, [...(result.get(key) ?? []), course]);
    }
  }

  return result;
}
