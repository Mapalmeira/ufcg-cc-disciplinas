import type { Course, Section } from "../../curriculum/types";
import { SectionsTable, type SectionSortKey } from "./SectionsTable";
import { SectionsToolbar } from "./SectionsToolbar";

export type { SectionSortKey } from "./SectionsTable";

export function SectionsView({ sections, courses, search, sortKey, sortDirection, onSearch, onSort, onOpen }: {
  sections: Section[];
  courses: Course[];
  search: string;
  sortKey: SectionSortKey;
  sortDirection: "asc" | "desc";
  onSearch: (value: string) => void;
  onSort: (key: SectionSortKey) => void;
  onOpen: (section: Section) => void;
}) {
  return <section className="catalog-section sections-section">
    <SectionsToolbar search={search} onSearch={onSearch} />
    <div className="results-count"><strong>{sections.length}</strong> turmas encontradas</div>
    <SectionsTable sections={sections} courses={courses} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} onOpen={onOpen} />
    {!sections.length && <div className="empty-results"><strong>Nenhuma turma encontrada</strong><p>Tente outro termo de busca.</p></div>}
  </section>;
}
