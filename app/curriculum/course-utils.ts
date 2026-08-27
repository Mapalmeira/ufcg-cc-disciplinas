import type { Course } from "./types";

export function isVisibleCourse(course: Course | undefined): course is Course & { code: string } {
  return Boolean(course?.code) && !course?.ignored;
}
