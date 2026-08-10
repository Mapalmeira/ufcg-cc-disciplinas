/** Shared network readers used by curriculum load actions. */
import Papa from "papaparse";

export async function fetchJson(url: string): Promise<unknown[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<unknown[]>;
}

export async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = Papa.parse<Record<string, string>>(await response.text(), {
    header: true,
    skipEmptyLines: true,
    transform: (value) => value.trim(),
    transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
  });

  if (result.errors.length) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}
