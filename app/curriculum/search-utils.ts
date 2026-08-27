const collator = new Intl.Collator("pt-BR", { numeric: true });

export function normalizeSearchText(value: string | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function compareLocalized(left: unknown, right: unknown) {
  return collator.compare(String(left ?? ""), String(right ?? ""));
}
