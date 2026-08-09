import type { Course } from "../../curriculum/types";

export function plain(value: string | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function canonical(value: string | undefined) {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPeriod(period: number) {
  return `${period}º período`;
}

export function formatCategory(category: string) {
  if (category === "obrigatoria") return "Obrigatória";
  if (category === "optativa") return "Optativa";
  if (category === "slot_optativa") return "Espaço de optativa";
  return category;
}

export function resolveReference(reference: string, courses: Course[]) {
  return courses.find((course) => canonical(course.code) === canonical(reference))?.code
    ?? courses.find((course) => (course.names ?? []).some((name) => plain(name) === plain(reference)))?.code
    ?? reference;
}

export function splitTracks(value: string[] | undefined) {
  return [...new Set((value ?? []).filter(Boolean))];
}
