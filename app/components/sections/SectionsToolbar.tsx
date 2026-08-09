import { SearchInput } from "../shared/SearchInput";

export function SectionsToolbar({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return <div className="sections-toolbar">
    <SearchInput value={search} onChange={onSearch} placeholder="Professor, código, disciplina ou mnemônico" />
  </div>;
}
