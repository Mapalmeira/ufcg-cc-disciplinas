import type { Course, SortKey } from "./types";
import { SearchInput } from "./SearchInput";

const columns: [SortKey, string][] = [["code", "Código"], ["name", "Disciplina"], ["hours", "Horas"], ["credits", "Créditos"], ["category", "Categoria"], ["track", "Trilha"]];
const centeredColumns = new Set<SortKey>(["code", "hours", "credits", "category", "track"]);

export function CatalogView({ courses, search, track, category, tracks, categories, sortKey, sortDirection, onSearch, onTrack, onCategory, onClear, onSort, onOpen }: {
  courses: Course[];
  search: string;
  track: string;
  category: string;
  tracks: string[];
  categories: string[];
  sortKey: SortKey;
  sortDirection: "asc" | "desc";
  onSearch: (value: string) => void;
  onTrack: (value: string) => void;
  onCategory: (value: string) => void;
  onClear: () => void;
  onSort: (key: SortKey) => void;
  onOpen: (course: Course) => void;
}) {
  return <section className="catalog-section">
    <div className="catalog-toolbar">
      <SearchInput value={search} onChange={onSearch} placeholder="Código, nome ou mnemônico" />
      <label><span>Categoria</span><select value={category} onChange={(event) => onCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label><span>Trilha</span><select value={track} onChange={(event) => onTrack(event.target.value)}>{tracks.map((item) => <option key={item}>{item}</option>)}</select></label>
      <button className="clear-filters" onClick={onClear}>Limpar filtros</button>
    </div>
    <div className="results-count"><strong>{courses.length}</strong> disciplinas encontradas</div>
    <div className="table-wrap"><table>
      <thead><tr>{columns.map(([key, label]) => <th key={key} className={centeredColumns.has(key) ? "centered-column" : undefined}><button onClick={() => onSort(key)}>{label}<span>{sortKey === key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}</tr></thead>
      <tbody>{courses.map((course) => <tr key={course.code}>
        <td className="centered-column" data-label="Código"><span className="table-code">{course.code}</span></td>
        <td data-label="Disciplina"><button className="course-name-button" onClick={() => onOpen(course)}><strong>{course.name}</strong></button></td>
        <td className="centered-column value-emphasis" data-label="Horas">{course.hours}h</td><td className="centered-column value-emphasis" data-label="Créditos">{course.credits}</td>
        <td className="centered-column" data-label="Categoria"><span className={`type-pill ${course.category === "Optativa" ? "optional" : "mandatory"}`}>{course.category}</span></td>
        <td className="centered-column value-emphasis" data-label="Trilha">{course.track}</td>
      </tr>)}</tbody>
    </table></div>
    {!courses.length && <div className="empty-results"><strong>Nenhuma disciplina encontrada</strong><p>Ajuste os filtros ou tente outra busca.</p></div>}
  </section>;
}
