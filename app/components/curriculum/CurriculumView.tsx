import { isVisibleCourse } from "../../curriculum/course-utils";
import type { Course } from "../../curriculum/types";
import { CourseCard } from "./CourseCard";
import type { CourseRelation, PlanningStatus } from "./CourseCard";
import { formatPeriod } from "../shared/utils";

export function CurriculumView({ coursesByCode, statuses, relationFor, hovered, onCycle, onOpen, onHover, onClear }: {
  coursesByCode: Readonly<Record<string, Course>>;
  statuses: Record<string, PlanningStatus>;
  relationFor: (course: Course) => CourseRelation | undefined;
  hovered: Course | null;
  onCycle: (course: Course) => void;
  onOpen: (course: Course) => void;
  onHover: (course: Course | null) => void;
  onClear: () => void;
}) {
  const courses = Object.values(coursesByCode).filter(isVisibleCourse);
  const periods = [...new Set(
    courses
      .map((course) => course.period)
      .filter((period): period is number => period !== undefined),
  )].sort((a, b) => a - b);
  const hasPlanning = Object.keys(statuses).length > 0;

  return (
    <section className="curriculum-section">
      <div className="toolbar">
        <div><span className="section-kicker">MATRIZ CURRICULAR</span><h2>Disciplinas por período</h2></div>
        <div className="toolbar-actions">
          <div className="legend"><span><i className="legend-paid" /> Paguei</span><span><i className="legend-planned" /> Quero pagar</span><span><i className="legend-prereq" /> Pré-requisito</span><span><i className="legend-coreq" /> Co-requisito</span><span><i className="legend-unlocks" /> Dependência direta</span><span><i className="legend-indirect" /> Dependência indireta</span></div>
          <button className="clear-planning" onClick={onClear} disabled={!hasPlanning}>Limpar planejamento</button>
        </div>
      </div>
      <div className="curriculum-scroll"><div className="curriculum-grid">
        {periods.map((period) => <section className="period-column" key={period}>
          <header><h3>{formatPeriod(period)}</h3></header>
          <div className="period-cards">{courses.filter((course) => course.period === period).map((course) => <CourseCard key={course.code} course={course} status={course.code ? statuses[course.code] : undefined} relation={relationFor(course)} dimmed={Boolean(hovered && !relationFor(course))} onCycle={() => onCycle(course)} onOpen={() => onOpen(course)} onHover={(active) => onHover(active ? course : null)} />)}</div>
        </section>)}
      </div></div>
    </section>
  );
}
