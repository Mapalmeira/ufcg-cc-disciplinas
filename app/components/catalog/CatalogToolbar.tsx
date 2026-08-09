import { SearchInput } from "../shared/SearchInput";
import { formatCategory } from "../shared/utils";

export function CatalogToolbar({ search, track, category, tracks, categories, onSearch, onTrack, onCategory, onClear }: {
  search: string;
  track: string;
  category: string;
  tracks: string[];
  categories: string[];
  onSearch: (value: string) => void;
  onTrack: (value: string) => void;
  onCategory: (value: string) => void;
  onClear: () => void;
}) {
  return <div className="catalog-toolbar">
    <SearchInput value={search} onChange={onSearch} placeholder="Código, nome ou mnemônico" />
    <label><span>Natureza</span><select value={category} onChange={(event) => onCategory(event.target.value)}><option value="">Todas</option>{categories.map((item) => <option key={item} value={item}>{formatCategory(item)}</option>)}</select></label>
    <label><span>Trilha</span><select value={track} onChange={(event) => onTrack(event.target.value)}><option value="">Todas</option>{tracks.map((item) => <option key={item}>{item}</option>)}</select></label>
    <button className="clear-filters" onClick={onClear}>Limpar filtros</button>
  </div>;
}
