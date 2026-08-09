import { useEffect, useState } from "react";
import { loadData } from "../../curriculum";
import { visibleCourses, visibleSections } from "../../curriculum/selectors";
import type { Course, Section } from "../../curriculum/types";

export function useCurriculumData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData()
      .then((data) => {
        console.log("Dados curriculares:", data);

        const nextCourses = visibleCourses(data);
        setCourses(nextCourses);
        setSections(visibleSections(data, nextCourses));

        if (!nextCourses.length) {
          setError("As fontes responderam, mas não encontramos disciplinas na aba grade2023.");
        }
      })
      .catch(() => setError("Não foi possível carregar os dados agora. Tente atualizar a página em alguns instantes."))
      .finally(() => setLoading(false));
  }, []);

  return { courses, sections, loading, error };
}
