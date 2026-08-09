import type { Course, Section } from "../../curriculum/types";
import { canonical } from "../shared/utils";

export type SectionSortKey = "professor" | "course_code" | "course" | "section" | "room" | "schedule" | "seats" | "mnemonic";

const columns: [SectionSortKey, string][] = [
  ["professor", "Professor"],
  ["course_code", "Código"],
  ["course", "Disciplina"],
  ["section", "Turma"],
  ["schedule", "Horário"],
  ["seats", "Vagas"],
  ["room", "Sala"],
];
const centeredColumns = new Set<SectionSortKey>(["course_code", "section", "schedule", "seats", "room"]);

export function SectionsTable({ sections, courses, sortKey, sortDirection, onSort, onOpen }: {
  sections: Section[];
  courses: Course[];
  sortKey: SectionSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: SectionSortKey) => void;
  onOpen: (section: Section) => void;
}) {
  const courseByCode = new Map(courses.map((course) => [canonical(course.code), course]));

  return <div className="table-wrap"><table>
    <thead><tr>{columns.map(([key, label]) => <th key={key} className={`${centeredColumns.has(key) ? "centered-column" : ""} ${key === "schedule" ? "schedule-column" : ""}`.trim() || undefined}><button onClick={() => onSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}</tr></thead>
    <tbody>{sections.map((section, index) => <SectionRow key={`${section.course_code}-${section.section}-${section.professor}-${index}`} section={section} course={courseByCode.get(canonical(section.course_code))} onOpen={onOpen} />)}</tbody>
  </table></div>;
}

function SectionRow({ section, course, onOpen }: { section: Section; course?: Course; onOpen: (section: Section) => void }) {
  return <tr>
    <td data-label="Professor"><strong>{section.professor ?? "Não informado"}</strong></td>
    <td className="centered-column" data-label="Código"><span className="table-code">{section.course_code ?? "—"}</span></td>
    <td data-label="Disciplina"><button className="course-name-button" onClick={() => onOpen(section)}><strong>{course?.names?.[0] ?? "Disciplina sem nome"}</strong>{course?.mnemonics?.map((mnemonic) => <small className="mnemonic" key={mnemonic}>{mnemonic}</small>)}</button></td>
    <td className="centered-column value-emphasis" data-label="Turma">{section.section ?? "—"}</td>
    <td className="centered-column value-emphasis schedule-column" data-label="Horário">{section.schedule || "—"}</td>
    <td className="centered-column value-emphasis" data-label="Vagas">{section.seats || "—"}</td>
    <td className="centered-column value-emphasis" data-label="Sala">{section.room || "—"}</td>
  </tr>;
}
