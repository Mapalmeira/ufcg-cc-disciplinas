import { useCallback, useEffect, useState } from "react";
import { isVisibleCourse } from "../../curriculum/course-utils";
import type { Course } from "../../curriculum/types";

export type Tab = "curriculum" | "courses" | "sections";

export const tabs: { id: Tab; label: string }[] = [
  { id: "curriculum", label: "Grade curricular" },
  { id: "courses", label: "Disciplinas" },
  { id: "sections", label: "Turmas" },
];

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const withBasePath = (path: string) => `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
const withoutBasePath = (path: string) => basePath && (path === basePath || path.startsWith(`${basePath}/`))
  ? path.slice(basePath.length) || "/"
  : path;

function selectableCourse(coursesByCode: Readonly<Record<string, Course>>, code: string | null) {
  const course = code ? coursesByCode[code] : undefined;
  return isVisibleCourse(course) && course.category !== "slot_optativa" ? course : null;
}

export function useNavigation(initialTab: Tab, coursesByCode: Readonly<Record<string, Course>>) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<Course | null>(null);

  useEffect(() => {
    const requested = new URL(window.location.href).searchParams.get("disciplina");
    setSelected(selectableCourse(coursesByCode, requested));
  }, [coursesByCode]);

  const openCourse = useCallback((course: Course) => {
    setSelected(course);
    const url = new URL(window.location.href);
    if (course.code) url.searchParams.set("disciplina", course.code);
    window.history.pushState({}, "", url);
  }, []);

  const closeCourse = useCallback(() => {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("disciplina");
    window.history.pushState({}, "", url);
  }, []);

  useEffect(() => {
    const onBack = () => {
      const pathTab = withoutBasePath(window.location.pathname).split("/")[1] as Tab;
      if (tabs.some((item) => item.id === pathTab)) setTab(pathTab);

      const requested = new URL(window.location.href).searchParams.get("disciplina");
      setSelected(selectableCourse(coursesByCode, requested));
    };

    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [coursesByCode]);

  const navigate = useCallback((next: Tab) => {
    setTab(next);
    setSelected(null);
    const url = new URL(window.location.href);
    url.pathname = withBasePath(`/${next}/`);
    url.search = "";
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { tab, tabs, selected, openCourse, closeCourse, navigate, withBasePath };
}
