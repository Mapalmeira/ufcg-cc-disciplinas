import type { Course } from "../curriculum/types";
import { SearchInput } from "./SearchInput";
import { formatCategory, splitTracks } from "./utils";

export type CourseSortKey = "code" | "name" | "hours" | "credits" | "category" | "tracks";

const columns: [CourseSortKey, string][] = [["code", "Código"], ["name", "Disciplina"], ["hours", "Horas"], ["credits", "Créditos"], ["category", "Natureza"], ["tracks", "Trilha"]];
const centeredColumns = new Set<CourseSortKey>(["code", "hours", "credits", "category", "tracks"]);

export function CatalogView({ courses, search, track, category, tracks, categories, sortKey, sortDirection, onSearch, onTrack, onCategory, onClear, onSort, onOpen }: {
  courses: Course[];
  search: string;
  track: string;
  category: string;
  tracks: string[];
  categories: string[];
  sortKey: CourseSortKey;
  sortDirection: "asc" | "desc";
  onSearch: (value: string) => void;
  onTrack: (value: string) => void;
  onCategory: (value: string) => void;
  onClear: () => void;
  onSort: (key: CourseSortKey) => void;
  onOpen: (course: Course) => void;
}) {
  return <section className="catalog-section">
    <div className="catalog-toolbar">
      <SearchInput value={search} onChange={onSearch} placeholder="Código, nome ou mnemônico" />
      <label><span>Natureza</span><select value={category} onChange={(event) => onCategory(event.target.value)}><option value="">Todas</option>{categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}</select></label>
      <label><span>Trilha</span><select value={track} onChange={(event) => onTrack(event.target.value)}><option value="">Todas</option>{tracks.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="clear-filters" onClick={onClear}>Limpar filtros</button>
    </div>
    <div className="results-count"><strong>{courses.length}</strong> disciplinas encontradas</div>
    <div className="table-wrap"><table>
      <thead><tr>{columns.map(([key, label]) => <th key={key} className={centeredColumns.has(key) ? "centered-column" : undefined}><button onClick={() => onSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}</tr></thead>
      <tbody>{courses.map((course) => {
        const tracks = splitTracks(course.tracks);
        return <tr key={course.code ?? course.names?.[0]}>
        <td className="centered-column" data-label="Código"><span className="table-code">{course.code ?? "—"}</span></td>
        <td data-label="Disciplina"><button className="course-name-button" onClick={() => onOpen(course)}><strong>{course.names?.[0] ?? "Disciplina sem nome"}</strong></button></td>
        <td className="centered-column value-emphasis" data-label="Horas">{course.hours != null ? `${course.hours}h` : "—"}</td><td className="centered-column value-emphasis" data-label="Créditos">{course.credits ?? "—"}</td>
        <td className="centered-column" data-label="Natureza"><span className={`type-pill ${course.category === "optativa" ? "optional" : "mandatory"}`}>{course.category ? formatCategory(course.category) : "—"}</span></td>
        <td className="centered-column value-emphasis" data-label="Trilha">{tracks.length ? tracks.join(" ") : "Sem trilha"}</td>
      </tr>})}</tbody>
    </table></div>
    {!courses.length && <div className="empty-results"><strong>Nenhuma disciplina encontrada</strong><p>Ajuste os filtros ou tente outra busca.</p></div>}
  </section>;
}
