import { useEffect, useMemo, useState } from "react";
import { loadData } from "../../curriculum";
import { isVisibleCourse } from "../../curriculum/course-utils";
import { buildDependencyIndexes } from "../../curriculum/selectors";
import type { CurriculumData } from "../../curriculum/types";

const emptyData: CurriculumData = { courses: {}, sections: {} };
const emptyIndexes = {
  directDependentsByCode: new Map<string, string[]>(),
};

export function useCurriculumData() {
  const [data, setData] = useState<CurriculumData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData()
      .then((data) => {
        console.log("Dados curriculares:", data);
        setData(data);
      })
      .catch(() => setError("Não foi possível carregar os dados agora. Tente atualizar a página em alguns instantes."))
      .finally(() => setLoading(false));
  }, []);

  const indexes = useMemo(
    () => data === emptyData ? emptyIndexes : buildDependencyIndexes(data.courses),
    [data],
  );
  const emptyError = !loading && !Object.values(data.courses).some(isVisibleCourse)
    ? "As fontes responderam, mas não encontramos disciplinas na aba grade2023."
    : "";

  return {
    data,
    ...indexes,
    loading,
    error: error || emptyError,
  };
}
