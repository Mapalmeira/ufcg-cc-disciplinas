"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { carregarDadosCurriculares } from "../data/curriculum";
import { CatalogView } from "./CatalogView";
import { DependencyGraph } from "./DependencyGraph";
import { DetailModal } from "./DetailModal";
import { GradeView } from "./GradeView";
import { SectionsView } from "./SectionsView";
import type { ClassSection, ClassSortKey, Course, Relation, SortKey, Status, Tab } from "./types";
import { canonical, categoryOrder, matchesTrack, plain, resolveReference, splitTracks } from "./utils";

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
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sourceWarning, setSourceWarning] = useState("");
  const [selected, setSelected] = useState<Course | null>(null);
  const [hovered, setHovered] = useState<Course | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Status>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("grade-status-v1") ?? "{}"); } catch { return {}; }
  });
  const [search, setSearch] = useState(() => typeof window === "undefined" ? "" : new URL(window.location.href).searchParams.get("busca") ?? "");
  const [track, setTrack] = useState(() => typeof window === "undefined" ? "Todas" : new URL(window.location.href).searchParams.get("trilha") ?? "Todas");
  const [category, setCategory] = useState(() => typeof window === "undefined" ? "Todas" : new URL(window.location.href).searchParams.get("categoria") ?? "Todas");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sectionSearch, setSectionSearch] = useState("");
  const [sectionSortKey, setSectionSortKey] = useState<ClassSortKey>("courseName");
  const [sectionSortDirection, setSectionSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    carregarDadosCurriculares()
      .then((data) => {
        const incoming = Array.isArray(data.courses) ? data.courses : [];
        setCourses(incoming);
        setSections(Array.isArray(data.sections) ? data.sections : []);
        const requested = new URL(window.location.href).searchParams.get("disciplina");
        const requestedCourse = incoming.find((course: Course) => canonical(course.code) === canonical(requested ?? ""));
        if (requestedCourse && !requestedCourse.electiveSlot) setSelected(requestedCourse);
        if (!incoming.length) setError("As fontes responderam, mas não encontramos disciplinas na aba grade2023.");
        if (data.errors?.length) setSourceWarning(data.errors.join(" "));
      })
      .catch(() => setError("Não foi possível carregar os dados agora. Tente atualizar a página em alguns instantes."))
      .finally(() => setLoading(false));
  }, []);

  const courseByCode = useMemo(() => new Map(courses.map((course) => [canonical(course.code), course])), [courses]);
  const releasesByCode = useMemo(() => {
    const result = new Map<string, Course[]>();
    courses.forEach((course) => course.prerequisites.forEach((reference) => {
      const source = canonical(resolveReference(reference, courses));
      result.set(source, [...(result.get(source) ?? []), course]);
    }));
    return result;
  }, [courses]);

  const openCourse = useCallback((course: Course) => {
    setSelected(course);
    const url = new URL(window.location.href);
    url.searchParams.set("disciplina", course.code);
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
    const next = { ...current };
    if (!current[course.code]) next[course.code] = "paid";
    else if (current[course.code] === "paid") next[course.code] = "planned";
    else delete next[course.code];
    localStorage.setItem("grade-status-v1", JSON.stringify(next));
    return next;
  });
  const clearPlanning = () => { setStatuses({}); localStorage.removeItem("grade-status-v1"); };

  const catalog = useMemo(() => courses.filter((course) => !course.electiveSlot), [courses]);
  const tracks = useMemo(() => {
    const available = new Set(catalog.flatMap((course) => splitTracks(course.track)));
    if (catalog.some((course) => splitTracks(course.track).length === 0)) available.add("Sem trilha");
    return ["Todas", ...available];
  }, [catalog]);
  const categories = useMemo(() => ["Todas", ...[...new Set(catalog.map((course) => course.category).filter(Boolean))].sort((a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b, "pt-BR"))], [catalog]);
  const filtered = useMemo(() => {
    const query = plain(search.trim());
    return catalog.filter((course) => (!query || plain(`${course.code} ${course.name} ${course.mnemonics.join(" ")}`).includes(query)) && matchesTrack(course.track, track) && (category === "Todas" || course.category === category)).sort((a, b) => {
      const left = a[sortKey]; const right = b[sortKey];
      const result = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [catalog, search, track, category, sortKey, sortDirection]);
  const updateFiltersUrl = (nextSearch: string, nextTrack: string, nextCategory: string) => {
    if (tab !== "disciplinas") return;
    const url = new URL(window.location.href);
    [["busca", nextSearch], ["trilha", nextTrack === "Todas" ? "" : nextTrack], ["categoria", nextCategory === "Todas" ? "" : nextCategory]].forEach(([name, value]) => value ? url.searchParams.set(name, value) : url.searchParams.delete(name));
    window.history.replaceState({}, "", url);
  };
  const sort = (key: SortKey) => { if (sortKey === key) setSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection("asc"); } };
  const filteredSections = useMemo(() => {
    const query = plain(sectionSearch);
    return sections.filter((section) => !query || plain(`${section.professor} ${section.professorMnemonic} ${section.courseCode} ${section.courseName} ${section.courseMnemonic}`).includes(query)).sort((a, b) => {
      const result = String(a[sectionSortKey]).localeCompare(String(b[sectionSortKey]), "pt-BR", { numeric: true });
      return sectionSortDirection === "asc" ? result : -result;
    });
  }, [sectionSearch, sectionSortDirection, sectionSortKey, sections]);
  const sortSections = (key: ClassSortKey) => { if (sectionSortKey === key) setSectionSortDirection((current) => current === "asc" ? "desc" : "asc"); else { setSectionSortKey(key); setSectionSortDirection("asc"); } };
  const openSectionCourse = (section: ClassSection) => {
    const course = courseByCode.get(canonical(section.courseCode))
      ?? catalog.find((item) => canonical(item.name) === canonical(section.courseName));
    if (course) openCourse(course);
  };

  const hoveredPrerequisites = useMemo(() => new Set((hovered?.prerequisites ?? []).map((item) => canonical(resolveReference(item, courses)))), [hovered, courses]);
  const hoveredCorequisites = useMemo(() => new Set((hovered?.corequisites ?? []).map((item) => canonical(resolveReference(item, courses)))), [hovered, courses]);
  const hoveredUnlocks = useMemo(() => new Set((hovered ? releasesByCode.get(canonical(hovered.code)) ?? [] : []).map((item) => canonical(item.code))), [hovered, releasesByCode]);
  const relationFor = (course: Course): Relation | undefined => {
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
      {sourceWarning && <div className="source-warning">{sourceWarning} Parte das informações pode estar temporariamente incompleta.</div>}
      {loading ? <div className="loading-state"><span /><p>Organizando a grade curricular...</p></div> : error ? <div className="error-state"><strong>Ops, os dados não chegaram.</strong><p>{error}</p><button onClick={() => window.location.reload()}>Tentar novamente</button></div> : null}
      {!loading && !error && tab === "grade" && <GradeView courses={courses} statuses={statuses} relationFor={relationFor} hovered={hovered} onCycle={cycleStatus} onOpen={openCourse} onHover={setHovered} onClear={clearPlanning} />}
      {!loading && !error && tab === "disciplinas" && <CatalogView courses={filtered} search={search} track={track} category={category} tracks={tracks} categories={categories} sortKey={sortKey} sortDirection={sortDirection} onSearch={(value) => { setSearch(value); updateFiltersUrl(value, track, category); }} onTrack={(value) => { setTrack(value); updateFiltersUrl(search, value, category); }} onCategory={(value) => { setCategory(value); updateFiltersUrl(search, track, value); }} onClear={() => { setSearch(""); setTrack("Todas"); setCategory("Todas"); updateFiltersUrl("", "Todas", "Todas"); }} onSort={sort} onOpen={openCourse} />}
      {!loading && !error && tab === "grafo" && <DependencyGraph courses={courses} onOpen={openCourse} />}
      {!loading && !error && tab === "turmas" && <SectionsView sections={filteredSections} search={sectionSearch} sortKey={sectionSortKey} sortDirection={sectionSortDirection} onSearch={setSectionSearch} onSort={sortSections} onOpen={openSectionCourse} />}
    </main>
    {selected && <DetailModal course={selected} courses={courses} releases={releasesByCode.get(canonical(selected.code)) ?? []} onClose={closeCourse} onOpen={openCourse} />}
  </div>;
}
