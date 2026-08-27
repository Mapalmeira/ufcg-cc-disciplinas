import { useMemo, useState } from "react";
import { isVisibleCourse } from "../../curriculum/course-utils";
import type { Course, Section } from "../../curriculum/types";
import type { SectionSortKey } from "./SectionsTable";
import { plain } from "../shared/utils";

export function useSections(sectionsByKey: Readonly<Record<string, Section>>, coursesByCode: Readonly<Record<string, Course>>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SectionSortKey>("course");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const query = plain(search);
    const value = (section: Section, key: SectionSortKey) => {
      const course = coursesByCode[section.course_code ?? ""];
      if (key === "course") return course?.names?.[0] ?? "";
      if (key === "mnemonic") return course?.mnemonics?.join(" ") ?? "";
      return section[key] ?? "";
    };

    return Object.values(sectionsByKey)
      .filter((section) => {
        const course = coursesByCode[section.course_code ?? ""];
        return isVisibleCourse(course);
      })
      .filter((section) => {
        const course = coursesByCode[section.course_code ?? ""];
        const text = `${section.professor ?? ""} ${section.professor_mnemonic ?? ""} ${section.course_code ?? ""} ${(course?.names ?? []).join(" ")} ${(course?.mnemonics ?? []).join(" ")}`;
        return !query || plain(text).includes(query);
      })
      .sort((a, b) => {
        const result = String(value(a, sortKey)).localeCompare(String(value(b, sortKey)), "pt-BR", { numeric: true });
        return sortDirection === "asc" ? result : -result;
      });
  }, [coursesByCode, search, sectionsByKey, sortDirection, sortKey]);

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
