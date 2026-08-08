import type { Course } from "./types";

export function plain(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function canonical(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function periodLabel(period: number) {
  return `${period}º período`;
}

export function resolveReference(reference: string, courses: Course[]) {
  return courses.find((course) => canonical(course.code) === canonical(reference))?.code
    ?? courses.find((course) => plain(course.name) === plain(reference))?.code
    ?? reference;
}

export function categoryOrder(category: string) {
  if (category === "Optativa") return Number.MAX_SAFE_INTEGER;
  return Number.parseInt(category, 10) || 0;
}

export function splitTracks(value: string) {
  const track = value.trim();
  return !track || track === "Sem trilha" ? [] : [...new Set(track.split(/\s+/))];
}

export function matchesTrack(value: string, selected: string) {
  if (selected === "Todas") return true;
  const tracks = splitTracks(value);
  return selected === "Sem trilha" ? tracks.length === 0 : tracks.includes(selected);
}
