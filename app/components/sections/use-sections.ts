import { useMemo, useState } from "react";
import { isVisibleCourse } from "../../curriculum/course-utils";
import { compareLocalized, normalizeSearchText } from "../../curriculum/search-utils";
import type { Course, Section } from "../../curriculum/types";
import type { SectionSortKey } from "./SectionsTable";

function sortValue(section: Section, key: SectionSortKey, coursesByCode: Readonly<Record<string, Course>>) {
  const course = coursesByCode[section.course_code ?? ""];
  if (key === "course") return course?.names?.[0] ?? "";
  if (key === "mnemonic") return course?.mnemonics?.join(" ") ?? "";
  return section[key] ?? "";
}

export function useSections(
  sectionsByKey: Readonly<Record<string, Section>>,
  coursesByCode: Readonly<Record<string, Course>>,
  searchTextByKey: ReadonlyMap<string, string>,
) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SectionSortKey>("course");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(
    () => Object.entries(sectionsByKey)
      .filter(([, section]) => isVisibleCourse(coursesByCode[section.course_code ?? ""]))
      .map(([key, section]) => ({ key, section, value: sortValue(section, sortKey, coursesByCode) }))
      .sort((a, b) => {
        const result = compareLocalized(a.value, b.value);
        return sortDirection === "asc" ? result : -result;
      })
      .map(({ key, section }) => ({ key, section })),
    [coursesByCode, sectionsByKey, sortDirection, sortKey],
  );

  const filtered = useMemo(() => {
    const query = normalizeSearchText(search);
    return sorted
      .filter(({ key }) => !query || searchTextByKey.get(key)?.includes(query))
      .map(({ section }) => section);
  }, [search, searchTextByKey, sorted]);

  const sort = (key: SectionSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return {
    sections: filtered,
    search,
    sortKey,
    sortDirection,
    onSearch: setSearch,
    onSort: sort,
  };
}
