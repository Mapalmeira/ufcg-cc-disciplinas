"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadData } from "../curriculum";
import type { Course, Section } from "../curriculum/types";
import { CatalogView } from "./CatalogView";
import type { CourseSortKey } from "./CatalogView";
import type { CourseRelation, PlanningStatus } from "./CourseCard";
import { DependencyGraph } from "./DependencyGraph";
import { DetailModal } from "./DetailModal";
import { GradeView } from "./GradeView";
import { SectionsView } from "./SectionsView";
import type { SectionSortKey } from "./SectionsView";
import { canonical, plain, resolveReference, splitTracks } from "./utils";

type Tab = "grade" | "disciplinas" | "grafo" | "turmas";

const tabs: { id: Tab; label: string }[] = [
  { id: "grade", label: "Grade curricular" },
  { id: "disciplinas", label: "Disciplinas" },
  { id: "turmas", label: "Turmas" },
  { id: "grafo", label: "Dependências" },
];

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const withBasePath = (path: string) => `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
const withoutBasePath = (path: string) => basePath && (path === basePath || path.startsWith(`${basePath}/`))
  ? path.slice(basePath.length) || "/"
  : path;

export default function CurriculumApp({ initialTab }: { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [hovered, setHovered] = useState<Course | null>(null);
  const [statuses, setStatuses] = useState<Record<string, PlanningStatus>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("grade-status-v1") ?? "{}"); } catch { return {}; }
  });
  const [search, setSearch] = useState(() => typeof window === "undefined" ? "" : new URL(window.location.href).searchParams.get("busca") ?? "");
  const [track, setTrack] = useState(() => typeof window === "undefined" ? "" : new URL(window.location.href).searchParams.get("trilha") ?? "");
  const [category, setCategory] = useState(() => typeof window === "undefined" ? "" : new URL(window.location.href).searchParams.get("categoria") ?? "");
  const [sortKey, setSortKey] = useState<CourseSortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sectionSearch, setSectionSearch] = useState("");
  const [sectionSortKey, setSectionSortKey] = useState<SectionSortKey>("course");
  const [sectionSortDirection, setSectionSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    loadData()
      .then((data) => {
        console.log("Dados curriculares:", data);
        const incoming = Object.values(data.courses).filter((course) => course.code && !course.ignored);
        const codes = new Set(incoming.map((course) => canonical(course.code)));
        setCourses(incoming);
        setSections(Object.values(data.sections).filter((section) => codes.has(canonical(section.course_code))));
        const requested = new URL(window.location.href).searchParams.get("disciplina");
        const requestedCourse = incoming.find((course) => canonical(course.code) === canonical(requested ?? ""));
        if (requestedCourse?.category !== "slot_optativa") {
          setSelected(requestedCourse ?? null);
        }
        if (!incoming.length) setError("As fontes responderam, mas não encontramos disciplinas na aba grade2023.");
      })
      .catch(() => setError("Não foi possível carregar os dados agora. Tente atualizar a página em alguns instantes."))
      .finally(() => setLoading(false));
  }, []);

  const courseByCode = useMemo(() => new Map(courses.map((course) => [canonical(course.code), course])), [courses]);
  const releasesByCode = useMemo(() => {
    const result = new Map<string, Course[]>();
    courses.forEach((course) => (course.prerequisites ?? []).forEach((reference) => {
      const source = canonical(resolveReference(reference, courses));
      result.set(source, [...(result.get(source) ?? []), course]);
    }));
    return result;
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
      setSelected(requested ? courseByCode.get(canonical(requested)) ?? null : null);
    };
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [courseByCode]);

  const navigate = (next: Tab) => {
    setTab(next); setSelected(null);
    const url = new URL(window.location.href);
    url.pathname = withBasePath(`/${next}/`); url.search = "";
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const cycleStatus = (course: Course) => setStatuses((current) => {
    if (!course.code) return current;
    const next = { ...current };
    if (!current[course.code]) next[course.code] = "paid";
    else if (current[course.code] === "paid") next[course.code] = "planned";
    else delete next[course.code];
    localStorage.setItem("grade-status-v1", JSON.stringify(next));
    return next;
  });
  const clearPlanning = () => { setStatuses({}); localStorage.removeItem("grade-status-v1"); };

  const catalog = useMemo(
    () => courses.filter((course) => course.category !== "slot_optativa"),
    [courses],
  );
  const tracks = useMemo(() => {
    const available = new Set(catalog.flatMap((course) => splitTracks(course.tracks)));
    if (catalog.some((course) => splitTracks(course.tracks).length === 0)) available.add("Sem trilha");
    return [...available];
  }, [catalog]);
  const categories = useMemo(
    () => [...new Set(catalog.map((course) => course.category).filter(
      (value): value is string => value !== undefined,
    ))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [catalog],
  );
  const filtered = useMemo(() => {
    const query = plain(search.trim());
    return catalog.filter((course) => {
      const courseTracks = splitTracks(course.tracks);
      const matchesSelectedTrack = !track
        || (track === "Sem trilha" ? courseTracks.length === 0 : courseTracks.includes(track));
      const text = `${course.code ?? ""} ${(course.names ?? []).join(" ")} ${(course.mnemonics ?? []).join(" ")}`;
      return (!query || plain(text).includes(query))
        && matchesSelectedTrack
        && (!category || course.category === category);
    }).sort((a, b) => {
      const left = sortKey === "tracks" ? splitTracks(a.tracks).join(" ") : sortKey === "name" ? a.names?.[0] : a[sortKey];
      const right = sortKey === "tracks" ? splitTracks(b.tracks).join(" ") : sortKey === "name" ? b.names?.[0] : b[sortKey];
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [catalog, search, track, category, sortKey, sortDirection]);
  const updateFiltersUrl = (nextSearch: string, nextTrack: string, nextCategory: string) => {
    if (tab !== "disciplinas") return;
    const url = new URL(window.location.href);
    [["busca", nextSearch], ["trilha", nextTrack], ["categoria", nextCategory]].forEach(([name, value]) => value ? url.searchParams.set(name, value) : url.searchParams.delete(name));
    window.history.replaceState({}, "", url);
  };
  const sort = (key: CourseSortKey) => { if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection("asc"); } };
  const filteredSections = useMemo(() => {
    const query = plain(sectionSearch);
    const value = (section: Section, key: SectionSortKey) => {
      const course = courseByCode.get(canonical(section.course_code));
      if (key === "course") return course?.names?.[0] ?? "";
      if (key === "mnemonic") return course?.mnemonics?.join(" ") ?? "";
      return section[key] ?? "";
    };
    return sections.filter((section) => {
      const course = courseByCode.get(canonical(section.course_code));
      const text = `${section.professor ?? ""} ${section.professor_mnemonic ?? ""} ${section.course_code ?? ""} ${(course?.names ?? []).join(" ")} ${(course?.mnemonics ?? []).join(" ")}`;
      return !query || plain(text).includes(query);
    }).sort((a, b) => {
      const result = String(value(a, sectionSortKey)).localeCompare(String(value(b, sectionSortKey)), "pt-BR", { numeric: true });
      return sectionSortDirection === "asc" ? result : -result;
    });
  }, [courseByCode, sectionSearch, sectionSortDirection, sectionSortKey, sections]);
  const sortSections = (key: SectionSortKey) => { if (sectionSortKey === key) setSectionSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSectionSortKey(key); setSectionSortDirection("asc"); } };
  const openSectionCourse = (section: Section) => {
    const course = courseByCode.get(canonical(section.course_code));
    if (course) openCourse(course);
  };

  const hoveredPrerequisites = useMemo(() => new Set((hovered?.prerequisites ?? []).map((item) => canonical(resolveReference(item, courses)))), [hovered, courses]);
  const hoveredCorequisites = useMemo(() => new Set((hovered?.corequisites ?? []).map((item) => canonical(resolveReference(item, courses)))), [hovered, courses]);
  const hoveredUnlocks = useMemo(() => new Set((hovered ? releasesByCode.get(canonical(hovered.code)) ?? [] : []).map((item) => canonical(item.code))), [hovered, releasesByCode]);
  const relationFor = (course: Course): CourseRelation | undefined => {
    const item = canonical(course.code);
    if (!hovered) return undefined;
    if (item === canonical(hovered.code)) return "focus";
    if (hoveredPrerequisites.has(item)) return "prerequisite";
    if (hoveredCorequisites.has(item)) return "corequisite";
    if (hoveredUnlocks.has(item)) return "unlocks";
    return undefined;
  };

  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href={withBasePath("/grade/")} onClick={(event) => { event.preventDefault(); navigate("grade"); }}><img className="brand-logo" src={withBasePath("/ufcg.png")} alt="UFCG" /><span><strong>Ciências da Computação</strong><small>UFCG · PPC 2023</small></span></a>
      <nav className="desktop-nav" aria-label="Navegação principal">{tabs.map((item) => <a key={item.id} href={withBasePath(`/${item.id}/`)} className={tab === item.id ? "active" : ""} onClick={(event) => { event.preventDefault(); navigate(item.id); }}>{item.label}</a>)}</nav>
      <a className="github-link" href="https://github.com/Mapalmeira/ufcg-cc-disciplinas/" target="_blank" rel="noreferrer" aria-label="Abrir repositório no GitHub"><img src={withBasePath("/github-svgrepo-com.svg")} alt="" width="28" height="28" /></a>
    </header>
    <main>
      <div className="mobile-tabs">{tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => navigate(item.id)}>{item.label}</button>)}</div>
      {loading ? <div className="loading-state"><span /><p>Organizando a grade curricular...</p></div> : error ? <div className="error-state"><strong>Ops, os dados não chegaram.</strong><p>{error}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div> : null}
      {!loading && !error && tab === "grade" && <GradeView courses={courses} statuses={statuses} relationFor={relationFor} hovered={hovered} onCycle={cycleStatus} onOpen={openCourse} onHover={setHovered} onClear={clearPlanning} />}
      {!loading && !error && tab === "disciplinas" && <CatalogView courses={filtered} search={search} track={track} category={category} tracks={tracks} categories={categories} sortKey={sortKey} sortDirection={sortDirection} onSearch={(value) => { setSearch(value); updateFiltersUrl(value, track, category); }} onTrack={(value) => { setTrack(value); updateFiltersUrl(search, value, category); }} onCategory={(value) => { setCategory(value); updateFiltersUrl(search, track, value); }} onClear={() => { setSearch(""); setTrack(""); setCategory(""); updateFiltersUrl("", "", ""); }} onSort={sort} onOpen={openCourse} />}
      {!loading && !error && tab === "grafo" && <DependencyGraph courses={courses} onOpen={openCourse} />}
      {!loading && !error && tab === "turmas" && <SectionsView sections={filteredSections} courses={courses} search={sectionSearch} sortKey={sectionSortKey} sortDirection={sectionSortDirection} onSearch={setSectionSearch} onSort={sortSections} onOpen={openSectionCourse} />}
    </main>
    {selected && <DetailModal course={selected} courses={courses} releases={releasesByCode.get(canonical(selected.code)) ?? []} onClose={closeCourse} onOpen={openCourse} />}
  </div>;
}
