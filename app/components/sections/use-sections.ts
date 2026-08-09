import { useMemo, useState } from "react";
import type { Course, Section } from "../../curriculum/types";
import type { SectionSortKey } from "./SectionsTable";
import { canonical, plain } from "../shared/utils";

export function useSections(sections: Section[], courses: Course[]) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SectionSortKey>("course");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const courseByCode = useMemo(
    () => new Map(courses.map((course) => [canonical(course.code), course])),
    [courses],
  );

  const filtered = useMemo(() => {
    const query = plain(search);
    const value = (section: Section, key: SectionSortKey) => {
      const course = courseByCode.get(canonical(section.course_code));
      if (key === "course") return course?.names?.[0] ?? "";
      if (key === "mnemonic") return course?.mnemonics?.join(" ") ?? "";
      return section[key] ?? "";
    };

    return sections
      .filter((section) => {
        const course = courseByCode.get(canonical(section.course_code));
        const text = `${section.professor ?? ""} ${section.professor_mnemonic ?? ""} ${section.course_code ?? ""} ${(course?.names ?? []).join(" ")} ${(course?.mnemonics ?? []).join(" ")}`;
        return !query || plain(text).includes(query);
      })
      .sort((a, b) => {
        const result = String(value(a, sortKey)).localeCompare(String(value(b, sortKey)), "pt-BR", { numeric: true });
        return sortDirection === "asc" ? result : -result;
      });
  }, [courseByCode, search, sections, sortDirection, sortKey]);

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
