"use client";

import { useMemo, useState } from "react";
import type { Course } from "../curriculum/types";
import { useCurriculumData } from "./application/use-curriculum-data";
import { useNavigation, type Tab } from "./application/use-navigation";
import { CoursesView } from "./courses/CoursesView";
import { useCourses } from "./courses/use-courses";
import type { CourseRelation } from "./curriculum/CourseCard";
import { CurriculumView } from "./curriculum/CurriculumView";
import { usePlanning } from "./curriculum/use-planning";
import { SectionsView } from "./sections/SectionsView";
import { useSections } from "./sections/use-sections";
import { DetailModal } from "./shared/DetailModal";

export default function CurriculumApp({ initialTab }: { initialTab: Tab }) {
  const curriculum = useCurriculumData();
  const navigation = useNavigation(initialTab, curriculum.data.courses);
  const planning = usePlanning();
  const courses = useCourses(curriculum.data.courses, curriculum.courseSearchTextByCode, navigation.tab);
  const sections = useSections(curriculum.data.sections, curriculum.data.courses, curriculum.sectionSearchTextByKey);
  const [hovered, setHovered] = useState<Course | null>(null);

  const hoveredPrerequisites = useMemo(
    () => new Set(hovered?.prerequisites ?? []),
    [hovered],
  );
  const hoveredCorequisites = useMemo(
    () => new Set(hovered?.corequisites ?? []),
    [hovered],
  );
  const hoveredUnlocks = useMemo(
    () => new Set(hovered ? curriculum.directDependentsByCode.get(hovered.code ?? "") ?? [] : []),
    [curriculum.directDependentsByCode, hovered],
  );

  const relationFor = (course: Course): CourseRelation | undefined => {
    if (!hovered) return undefined;

    const code = course.code;
    if (!code) return undefined;

    if (code === hovered.code) return "focus";
    if (hoveredPrerequisites.has(code)) return "prerequisite";
    if (hoveredCorequisites.has(code)) return "corequisite";
    if (hoveredUnlocks.has(code)) return "unlocks";
    return undefined;
  };

  const openSectionCourse = (section: { course_code?: string }) => {
    const course = curriculum.data.courses[section.course_code ?? ""];
    if (course) navigation.openCourse(course);
  };

  const isReady = !curriculum.loading && !curriculum.error;

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

        {curriculum.loading && (
          <div className="loading-state"><span /><p>Organizando a grade curricular...</p></div>
        )}
        {!curriculum.loading && curriculum.error && (
          <div className="error-state">
            <strong>Ops, os dados não chegaram.</strong>
            <p>{curriculum.error}</p>
            <button onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        )}

        {isReady && navigation.tab === "curriculum" && (
          <CurriculumView
            coursesByCode={curriculum.data.courses}
            statuses={planning.statuses}
            relationFor={relationFor}
            hovered={hovered}
            onCycle={planning.cycleStatus}
            onOpen={navigation.openCourse}
            onHover={setHovered}
            onClear={planning.clearPlanning}
          />
        )}
        {isReady && navigation.tab === "courses" && (
          <CoursesView {...courses} onOpen={navigation.openCourse} />
        )}
        {isReady && navigation.tab === "sections" && (
          <SectionsView {...sections} coursesByCode={curriculum.data.courses} onOpen={openSectionCourse} />
        )}
      </main>

      {navigation.selected && (
        <DetailModal
          course={navigation.selected}
          coursesByCode={curriculum.data.courses}
          directDependents={curriculum.directDependentsByCode.get(navigation.selected.code ?? "") ?? []}
          indirectDependents={curriculum.indirectDependentsByCode.get(navigation.selected.code ?? "") ?? []}
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
        href={navigation.withBasePath("/curriculum/")}
        onClick={(event) => {
          event.preventDefault();
          navigation.navigate("curriculum");
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
