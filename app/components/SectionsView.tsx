import type { ClassSection, ClassSortKey } from "./types";
import { SearchInput } from "./SearchInput";

const columns: [ClassSortKey, string][] = [
  ["professor", "Professor"],
  ["courseCode", "Código"],
  ["courseName", "Disciplina"],
  ["section", "Turma"],
  ["schedule", "Horário"],
  ["vacancies", "Vagas"],
  ["room", "Sala"],
];
const centeredColumns = new Set<ClassSortKey>(["courseCode", "section", "schedule", "vacancies", "room"]);

export function SectionsView({ sections, search, sortKey, sortDirection, onSearch, onSort, onOpen }: {
  sections: ClassSection[];
  search: string;
  sortKey: ClassSortKey;
  sortDirection: "asc" | "desc";
  onSearch: (value: string) => void;
  onSort: (key: ClassSortKey) => void;
  onOpen: (section: ClassSection) => void;
}) {
  return <section className="catalog-section sections-section">
    <div className="sections-toolbar">
      <SearchInput value={search} onChange={onSearch} placeholder="Professor, código, disciplina ou mnemônico" />
    </div>
    <div className="results-count"><strong>{sections.length}</strong> turmas encontradas</div>
    <div className="table-wrap"><table>
      <thead><tr>{columns.map(([key, label]) => <th key={key} className={`${centeredColumns.has(key) ? "centered-column" : ""} ${key === "schedule" ? "schedule-column" : ""}`.trim() || undefined}><button onClick={() => onSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}</tr></thead>
      <tbody>{sections.map((section, index) => <tr key={`${section.courseCode}-${section.section}-${section.professorMnemonic}-${index}`}>
        <td data-label="Professor"><strong>{section.professor}</strong></td>
        <td className="centered-column" data-label="Código"><span className="table-code">{section.courseCode}</span></td>
        <td data-label="Disciplina"><button className="course-name-button" onClick={() => onOpen(section)}><strong>{section.courseName}</strong>{section.courseMnemonic && <small className="mnemonic">{section.courseMnemonic}</small>}</button></td>
        <td className="centered-column value-emphasis" data-label="Turma">{section.section}</td>
        <td className="centered-column value-emphasis schedule-column" data-label="Horário">{section.schedule || "—"}</td>
        <td className="centered-column value-emphasis" data-label="Vagas">{section.vacancies || "—"}</td>
        <td className="centered-column value-emphasis" data-label="Sala">{section.room || "—"}</td>
      </tr>)}</tbody>
    </table></div>
    {!sections.length && <div className="empty-results"><strong>Nenhuma turma encontrada</strong><p>Tente outro termo de busca.</p></div>}
  </section>;
}
