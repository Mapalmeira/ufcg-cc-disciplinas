import { useMemo, useState } from "react";
import { isVisibleCourse } from "../../curriculum/course-utils";
import { compareLocalized, normalizeSearchText } from "../../curriculum/search-utils";
import type { Course } from "../../curriculum/types";
import type { CourseSortKey } from "./CoursesTable";
import { formatCategory, splitTracks } from "../shared/utils";

function queryParameter(name: string) {
  return typeof window === "undefined"
    ? ""
    : new URL(window.location.href).searchParams.get(name) ?? "";
}

function sortValue(course: Course, key: CourseSortKey) {
  if (key === "tracks") return splitTracks(course.tracks).join(" ");
  if (key === "name") return course.names?.[0];
  return course[key];
}

export function useCourses(
  coursesByCode: Readonly<Record<string, Course>>,
  searchTextByCode: ReadonlyMap<string, string>,
  activeTab: string,
) {
  const [search, setSearch] = useState(() => queryParameter("search"));
  const [track, setTrack] = useState(() => queryParameter("track"));
  const [category, setCategory] = useState(() => queryParameter("category"));
  const [sortKey, setSortKey] = useState<CourseSortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const availableCourses = useMemo(
    () => Object.values(coursesByCode)
      .filter(isVisibleCourse)
      .filter((course) => course.category !== "slot_optativa"),
    [coursesByCode],
  );

  const tracks = useMemo(() => {
    const available = new Set(availableCourses.flatMap((course) => splitTracks(course.tracks)));
    if (availableCourses.some((course) => splitTracks(course.tracks).length === 0)) {
      available.add("Sem trilha");
    }
    return [...available];
  }, [availableCourses]);

  const categories = useMemo(
    () => [...new Set(availableCourses.map((course) => course.category).filter(
      (value): value is string => value !== undefined,
    ))].sort((a, b) => compareLocalized(formatCategory(a), formatCategory(b))),
    [availableCourses],
  );

  const sorted = useMemo(
    () => availableCourses
      .map((course) => ({ course, value: sortValue(course, sortKey) }))
      .sort((a, b) => {
        const result = typeof a.value === "number" && typeof b.value === "number"
          ? a.value - b.value
          : compareLocalized(a.value, b.value);
        return sortDirection === "asc" ? result : -result;
      })
      .map(({ course }) => course),
    [availableCourses, sortDirection, sortKey],
  );

  const filtered = useMemo(() => {
    const query = normalizeSearchText(search.trim());

    return sorted
      .filter((course) => {
        const courseTracks = splitTracks(course.tracks);
        const matchesTrack = !track
          || (track === "Sem trilha" ? courseTracks.length === 0 : courseTracks.includes(track));

        return (!query || searchTextByCode.get(course.code ?? "")?.includes(query))
          && matchesTrack
          && (!category || course.category === category);
      });
  }, [category, search, searchTextByCode, sorted, track]);

  const updateFiltersUrl = (nextSearch: string, nextTrack: string, nextCategory: string) => {
    if (activeTab !== "courses") return;

    const url = new URL(window.location.href);
    const values = [["search", nextSearch], ["track", nextTrack], ["category", nextCategory]];

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
