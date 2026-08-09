import type { Course } from "../../curriculum/types";
import { formatCategory, splitTracks } from "../shared/utils";

export type CourseSortKey = "code" | "name" | "hours" | "credits" | "category" | "tracks";

const columns: [CourseSortKey, string][] = [
  ["code", "Código"],
  ["name", "Disciplina"],
  ["hours", "Horas"],
  ["credits", "Créditos"],
  ["category", "Natureza"],
  ["tracks", "Trilha"],
];
const centeredColumns = new Set<CourseSortKey>(["code", "hours", "credits", "category", "tracks"]);

export function CatalogTable({ courses, sortKey, sortDirection, onSort, onOpen }: {
  courses: Course[];
  sortKey: CourseSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: CourseSortKey) => void;
  onOpen: (course: Course) => void;
}) {
  return <div className="table-wrap"><table>
    <thead><tr>{columns.map(([key, label]) => <th key={key} className={centeredColumns.has(key) ? "centered-column" : undefined}><button onClick={() => onSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}</tr></thead>
    <tbody>{courses.map((course) => <CatalogRow key={course.code ?? course.names?.[0]} course={course} onOpen={onOpen} />)}</tbody>
  </table></div>;
}

function CatalogRow({ course, onOpen }: { course: Course; onOpen: (course: Course) => void }) {
  const tracks = splitTracks(course.tracks);

  return <tr>
    <td className="centered-column" data-label="Código"><span className="table-code">{course.code ?? "—"}</span></td>
    <td data-label="Disciplina"><button className="course-name-button" onClick={() => onOpen(course)}><strong>{course.names?.[0] ?? "Disciplina sem nome"}</strong></button></td>
    <td className="centered-column value-emphasis" data-label="Horas">{course.hours != null ? `${course.hours}h` : "—"}</td>
    <td className="centered-column value-emphasis" data-label="Créditos">{course.credits ?? "—"}</td>
    <td className="centered-column" data-label="Natureza"><span className={`type-pill ${course.category === "optativa" ? "optional" : "mandatory"}`}>{course.category ? formatCategory(course.category) : "—"}</span></td>
    <td className="centered-column value-emphasis" data-label="Trilha">{tracks.length ? tracks.join(" ") : "Sem trilha"}</td>
  </tr>;
}
