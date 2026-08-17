"use client";

import { useMemo, useState } from "react";
import { courseIndex, releasesIndex } from "../curriculum/selectors";
import type { Course } from "../curriculum/types";
import { useCurriculumData } from "./application/use-curriculum-data";
import { useNavigation, type Tab } from "./application/use-navigation";
import { CatalogView } from "./catalog/CatalogView";
import { useCatalog } from "./catalog/use-catalog";
import type { CourseRelation } from "./grade/CourseCard";
import { GradeView } from "./grade/GradeView";
import { usePlanning } from "./grade/use-planning";
import { SectionsView } from "./sections/SectionsView";
import { useSections } from "./sections/use-sections";
import { DetailModal } from "./shared/DetailModal";
import { canonical, resolveReference } from "./shared/utils";

export default function CurriculumApp({ initialTab }: { initialTab: Tab }) {
  const data = useCurriculumData();
  const navigation = useNavigation(initialTab, data.courses);
  const planning = usePlanning();
  const catalog = useCatalog(data.courses, navigation.tab);
  const sections = useSections(data.sections, data.courses);
  const courseByCode = useMemo(() => courseIndex(data.courses), [data.courses]);
  const releasesByCode = useMemo(() => releasesIndex(data.courses), [data.courses]);
  const [hovered, setHovered] = useState<Course | null>(null);

  const hoveredPrerequisites = useMemo(
    () => new Set((hovered?.prerequisites ?? []).map((item) => canonical(resolveReference(item, data.courses)))),
    [data.courses, hovered],
  );
  const hoveredCorequisites = useMemo(
    () => new Set((hovered?.corequisites ?? []).map((item) => canonical(resolveReference(item, data.courses)))),
    [data.courses, hovered],
  );
  const hoveredUnlocks = useMemo(
    () => new Set((hovered ? releasesByCode.get(canonical(hovered.code)) ?? [] : []).map((item) => canonical(item.code))),
    [hovered, releasesByCode],
  );

  const relationFor = (course: Course): CourseRelation | undefined => {
    if (!hovered) return undefined;

    const code = canonical(course.code);
    if (code === canonical(hovered.code)) return "focus";
    if (hoveredPrerequisites.has(code)) return "prerequisite";
    if (hoveredCorequisites.has(code)) return "corequisite";
    if (hoveredUnlocks.has(code)) return "unlocks";
    return undefined;
  };

  const openSectionCourse = (section: { course_code?: string }) => {
    const course = courseByCode.get(canonical(section.course_code));
    if (course) navigation.openCourse(course);
  };

  const isReady = !data.loading && !data.error;

  return (
    <div className="app-shell">
      <AppHeader navigation={navigation} />
      <main>
        <div className="mobile-tabs">
          {navigation.tabs.map((item) => (
            <button
              key={item.id}
              className={navigation.tab === item.id ? "active" : ""}
              onClick={() => navigation.navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {data.loading && (
          <div className="loading-state"><span /><p>Organizando a grade curricular...</p></div>
        )}
        {!data.loading && data.error && (
          <div className="error-state">
            <strong>Ops, os dados não chegaram.</strong>
            <p>{data.error}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        )}

        {isReady && navigation.tab === "grade" && (
          <GradeView
            courses={data.courses}
            statuses={planning.statuses}
            relationFor={relationFor}
            hovered={hovered}
            onCycle={planning.cycleStatus}
            onOpen={navigation.openCourse}
            onHover={setHovered}
            onClear={planning.clearPlanning}
          />
        )}
        {isReady && navigation.tab === "disciplinas" && (
          <CatalogView {...catalog} onOpen={navigation.openCourse} />
        )}
        {isReady && navigation.tab === "turmas" && (
          <SectionsView {...sections} courses={data.courses} onOpen={openSectionCourse} />
        )}
      </main>

      {navigation.selected && (
        <DetailModal
          course={navigation.selected}
          courses={data.courses}
          releases={releasesByCode.get(canonical(navigation.selected.code)) ?? []}
          onClose={navigation.closeCourse}
          onOpen={navigation.openCourse}
        />
      )}
    </div>
  );
}

function AppHeader({ navigation }: { navigation: ReturnType<typeof useNavigation> }) {
  return (
    <header className="site-header">
      <a
        className="brand"
        href={navigation.withBasePath("/grade/")}
        onClick={(event) => {
          event.preventDefault();
          navigation.navigate("grade");
        }}
      >
        <img className="brand-logo" src={navigation.withBasePath("/ufcg.png")} alt="UFCG" />
        <span><strong>Ciências da Computação</strong><small>UFCG · PPC 2023</small></span>
      </a>
      <nav className="desktop-nav" aria-label="Navegação principal">
        {navigation.tabs.map((item) => (
          <a
            key={item.id}
            href={navigation.withBasePath(`/${item.id}/`)}
            className={navigation.tab === item.id ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              navigation.navigate(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <a
        className="github-link"
        href="https://github.com/Mapalmeira/ufcg-cc-disciplinas/"
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir repositório no GitHub"
      >
        <img src={navigation.withBasePath("/github-svgrepo-com.svg")} alt="" width="28" height="28" />
      </a>
    </header>
  );
}
