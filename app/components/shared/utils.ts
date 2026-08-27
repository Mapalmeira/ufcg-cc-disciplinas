export function plain(value: string | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function formatPeriod(period: number) {
  return `${period}º período`;
}

export function formatCategory(category: string) {
  if (category === "obrigatoria") return "Obrigatória";
  if (category === "optativa") return "Optativa";
  if (category === "slot_optativa") return "Espaço de optativa";
  return category;
}

export function splitTracks(value: string[] | undefined) {
  return [...new Set((value ?? []).filter(Boolean))];
}
