import type { Course, Relation, Status } from "./types";

export function CourseCard({ course, status, relation, dimmed, onCycle, onOpen, onHover }: {
  course: Course;
  status?: Status;
  relation?: Relation;
  dimmed?: boolean;
  onCycle: () => void;
  onOpen: () => void;
  onHover: (active: boolean) => void;
}) {
  return (
    <article
      className={`course-card ${status ?? ""} ${relation ?? ""} ${dimmed ? "dimmed" : ""} ${course.electiveSlot ? "elective-slot" : ""}`}
      onClick={onCycle}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onCycle(); } }}
      aria-label={`${course.name}. Clique para alterar o planejamento.`}
    >
      <div className="course-card-top">
        <span className="course-code">{course.electiveSlot ? "ESPAÇO CURRICULAR" : course.code}</span>
        {!course.electiveSlot && <button className="more-button" onClick={(event) => { event.stopPropagation(); onOpen(); }} aria-label={`Ver detalhes de ${course.name}`}><span /><span /><span /></button>}
      </div>
      <h3>{course.electiveSlot ? "Optativa" : course.name}</h3>
      {status && <span className="status-chip">{status === "paid" ? "Paguei" : "Quero pagar"}</span>}
    </article>
  );
}
