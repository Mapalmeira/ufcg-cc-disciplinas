import { useCallback, useEffect, useState } from "react";
import type { Course } from "../../curriculum/types";
import { canonical } from "../shared/utils";

export type Tab = "grade" | "disciplinas" | "turmas";

export const tabs: { id: Tab; label: string }[] = [
  { id: "grade", label: "Grade curricular" },
  { id: "disciplinas", label: "Disciplinas" },
  { id: "turmas", label: "Turmas" },
];

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const withBasePath = (path: string) => `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
const withoutBasePath = (path: string) => basePath && (path === basePath || path.startsWith(`${basePath}/`))
  ? path.slice(basePath.length) || "/"
  : path;

export function useNavigation(initialTab: Tab, courses: Course[]) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<Course | null>(null);

  useEffect(() => {
    const requested = new URL(window.location.href).searchParams.get("disciplina");
    const requestedCourse = courses.find((course) => canonical(course.code) === canonical(requested ?? ""));

    if (requestedCourse?.category !== "slot_optativa") {
      setSelected(requestedCourse ?? null);
    }
  }, [courses]);

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
      setSelected(requested ? courses.find((course) => canonical(course.code) === canonical(requested)) ?? null : null);
    };

    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [courses]);

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
