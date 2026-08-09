import type { Course } from "../../curriculum/types";
import { CatalogTable, type CourseSortKey } from "./CatalogTable";
import { CatalogToolbar } from "./CatalogToolbar";

export type { CourseSortKey } from "./CatalogTable";

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
    <CatalogToolbar search={search} track={track} category={category} tracks={tracks} categories={categories} onSearch={onSearch} onTrack={onTrack} onCategory={onCategory} onClear={onClear} />
    <div className="results-count"><strong>{courses.length}</strong> disciplinas encontradas</div>
    <CatalogTable courses={courses} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} onOpen={onOpen} />
    {!courses.length && <div className="empty-results"><strong>Nenhuma disciplina encontrada</strong><p>Ajuste os filtros ou tente outra busca.</p></div>}
  </section>;
}
