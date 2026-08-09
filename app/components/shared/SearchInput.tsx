export function SearchInput({ value, placeholder, onChange }: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return <label className="search-control"><span>Busca</span><span className="search-field"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></span></label>;
}
