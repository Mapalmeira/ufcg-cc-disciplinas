import type { Course } from "../../curriculum/types";

export type CourseRelation =
  | "prerequisite"
  | "corequisite"
  | "unlocks"
  | "indirect"
  | "focus";
export type PlanningStatus = "paid" | "planned";

const relationSymbols: Partial<Record<CourseRelation, { symbol: string; label: string }>> = {
  prerequisite: { symbol: "←", label: "Pré-requisito" },
  corequisite: { symbol: "⇄", label: "Co-requisito" },
  unlocks: { symbol: "→", label: "Depende diretamente" },
  indirect: { symbol: "↝", label: "Depende indiretamente" },
};

export function CourseCard({ course, status, relation, dimmed, onCycle, onOpen, onHover }: {
  course: Course;
  status?: PlanningStatus;
  relation?: CourseRelation;
  dimmed?: boolean;
  onCycle: () => void;
  onOpen: () => void;
  onHover: (active: boolean) => void;
}) {
  const electiveSlot = course.category === "slot_optativa";
  const name = course.names?.[0] ?? "Disciplina sem nome";
  const relationMarker = relation ? relationSymbols[relation] : undefined;
  return (
    <article
      className={`course-card ${status ?? ""} ${relation ?? ""} ${dimmed ? "dimmed" : ""} ${electiveSlot ? "elective-slot" : ""}`}
      onClick={onCycle}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onCycle(); } }}
      aria-label={`${name}. Clique para alterar o planejamento.`}
    >
      <div className="course-card-top">
        <span className="course-code">{electiveSlot ? "ESPAÇO CURRICULAR" : course.code}</span>
        {relationMarker && <span className={`relation-symbol ${relation}`} role="img" aria-label={relationMarker.label} title={relationMarker.label}>{relationMarker.symbol}</span>}
        {!electiveSlot && <button className="more-button" onClick={(event) => { event.stopPropagation(); onOpen(); }} aria-label={`Ver detalhes de ${name}`}><span aria-hidden="true"><i>i</i></span></button>}
      </div>
      <h3>{electiveSlot ? "Optativa" : name}</h3>
      {status && <span className="status-chip"><span aria-hidden="true">{status === "paid" ? "✓" : "◷"}</span> {status === "paid" ? "Paguei" : "Quero pagar"}</span>}
    </article>
  );
}
