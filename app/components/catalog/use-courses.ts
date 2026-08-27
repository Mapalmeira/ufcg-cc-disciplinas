import { useMemo, useState } from "react";
import { isVisibleCourse } from "../../curriculum/course-utils";
import type { Course } from "../../curriculum/types";
import type { CourseSortKey } from "./CatalogTable";
import { formatCategory, plain, splitTracks } from "../shared/utils";

function queryParameter(name: string) {
  return typeof window === "undefined"
    ? ""
    : new URL(window.location.href).searchParams.get(name) ?? "";
}

export function useCourses(coursesByCode: Readonly<Record<string, Course>>, activeTab: string) {
  const [search, setSearch] = useState(() => queryParameter("busca"));
  const [track, setTrack] = useState(() => queryParameter("trilha"));
  const [category, setCategory] = useState(() => queryParameter("categoria"));
  const [sortKey, setSortKey] = useState<CourseSortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const catalog = useMemo(
    () => Object.values(coursesByCode)
      .filter(isVisibleCourse)
      .filter((course) => course.category !== "slot_optativa"),
    [coursesByCode],
  );

  const tracks = useMemo(() => {
    const available = new Set(catalog.flatMap((course) => splitTracks(course.tracks)));
    if (catalog.some((course) => splitTracks(course.tracks).length === 0)) {
      available.add("Sem trilha");
    }
    return [...available];
  }, [catalog]);

  const categories = useMemo(
    () => [...new Set(catalog.map((course) => course.category).filter(
      (value): value is string => value !== undefined,
    ))].sort((a, b) => formatCategory(a).localeCompare(formatCategory(b), "pt-BR")),
    [catalog],
  );

  const filtered = useMemo(() => {
    const query = plain(search.trim());

    return catalog
      .filter((course) => {
        const courseTracks = splitTracks(course.tracks);
        const matchesTrack = !track
          || (track === "Sem trilha" ? courseTracks.length === 0 : courseTracks.includes(track));
        const text = `${course.code ?? ""} ${(course.names ?? []).join(" ")} ${(course.mnemonics ?? []).join(" ")}`;

        return (!query || plain(text).includes(query))
          && matchesTrack
          && (!category || course.category === category);
      })
      .sort((a, b) => {
        const left = sortKey === "tracks"
          ? splitTracks(a.tracks).join(" ")
          : sortKey === "name" ? a.names?.[0] : a[sortKey];
        const right = sortKey === "tracks"
          ? splitTracks(b.tracks).join(" ")
          : sortKey === "name" ? b.names?.[0] : b[sortKey];
        const result = typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "pt-BR", { numeric: true });

        return sortDirection === "asc" ? result : -result;
      });
  }, [catalog, category, search, sortDirection, sortKey, track]);

  const updateFiltersUrl = (nextSearch: string, nextTrack: string, nextCategory: string) => {
    if (activeTab !== "courses") return;

    const url = new URL(window.location.href);
    const values = [["busca", nextSearch], ["trilha", nextTrack], ["categoria", nextCategory]];

    for (const [name, value] of values) {
      if (value) url.searchParams.set(name, value);
      else url.searchParams.delete(name);
    }

    window.history.replaceState({}, "", url);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    updateFiltersUrl(value, track, category);
  };

  const updateTrack = (value: string) => {
    setTrack(value);
    updateFiltersUrl(search, value, category);
  };

  const updateCategory = (value: string) => {
    setCategory(value);
    updateFiltersUrl(search, track, value);
  };

  const clearFilters = () => {
    setSearch("");
    setTrack("");
    setCategory("");
    updateFiltersUrl("", "", "");
  };

  const sort = (key: CourseSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return {
    courses: filtered,
    search,
    track,
    category,
    tracks,
    categories,
    sortKey,
    sortDirection,
    onSearch: updateSearch,
    onTrack: updateTrack,
    onCategory: updateCategory,
    onClear: clearFilters,
    onSort: sort,
  };
}
