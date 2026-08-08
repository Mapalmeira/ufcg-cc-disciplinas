import { CourseCard } from "./CourseCard";
import type { Course, Relation, Status } from "./types";
import { periodLabel } from "./utils";

export function GradeView({ courses, statuses, relationFor, hovered, onCycle, onOpen, onHover, onClear }: {
  courses: Course[];
  statuses: Record<string, Status>;
  relationFor: (course: Course) => Relation | undefined;
  hovered: Course | null;
  onCycle: (course: Course) => void;
  onOpen: (course: Course) => void;
  onHover: (course: Course | null) => void;
  onClear: () => void;
}) {
  const periods = [...new Set(courses.filter((course) => course.period > 0).map((course) => course.period))].sort((a, b) => a - b);
  const hasPlanning = Object.keys(statuses).length > 0;

  return (
    <section className="grade-section">
      <div className="toolbar">
        <div><span className="section-kicker">MATRIZ CURRICULAR</span><h2>Disciplinas por período</h2></div>
        <div className="toolbar-actions">
          <div className="legend"><span><i className="legend-paid" /> Paguei</span><span><i className="legend-planned" /> Quero pagar</span><span><i className="legend-prereq" /> Pré-requisito</span><span><i className="legend-coreq" /> Co-requisito</span><span><i className="legend-unlocks" /> Libera</span></div>
          <button className="clear-grade" onClick={onClear} disabled={!hasPlanning}>Limpar planejamento</button>
        </div>
      </div>
      <div className="curriculum-scroll"><div className="curriculum-grid">
        {periods.map((period) => <section className="period-column" key={period}>
          <header><h3>{periodLabel(period)}</h3></header>
          <div className="period-cards">{courses.filter((course) => course.period === period).map((course) => <CourseCard key={course.code} course={course} status={statuses[course.code]} relation={relationFor(course)} dimmed={Boolean(hovered && !relationFor(course))} onCycle={() => onCycle(course)} onOpen={() => onOpen(course)} onHover={(active) => onHover(active ? course : null)} />)}</div>
        </section>)}
      </div></div>
    </section>
  );
}
