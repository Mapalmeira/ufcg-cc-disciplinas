import { useEffect, useMemo, useState } from "react";
import { loadData } from "../../curriculum";
import { buildCurriculumIndexes } from "../../curriculum/selectors";
import type { CurriculumData } from "../../curriculum/types";

const emptyData: CurriculumData = { courses: {}, sections: {} };
const emptyIndexes = {
  directDependentsByCode: new Map<string, string[]>(),
  indirectDependentsByCode: new Map<string, string[]>(),
  courseSearchTextByCode: new Map<string, string>(),
  sectionSearchTextByKey: new Map<string, string>(),
  hasVisibleCourses: false,
};

export function useCurriculumData() {
  const [data, setData] = useState<CurriculumData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Preparando as fontes de dados...");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData(setLoadingMessage)
      .then((data) => {
        setLoadingMessage("Montando a visualização...");
        setData(data);
      })
      .catch(() => setError("Não foi possível carregar os dados agora. Tente atualizar a página em alguns instantes."))
      .finally(() => setLoading(false));
  }, []);

  const indexes = useMemo(
    () => data === emptyData ? emptyIndexes : buildCurriculumIndexes(data),
    [data],
  );
  const emptyError = !loading && !indexes.hasVisibleCourses
    ? "As fontes responderam, mas não encontramos disciplinas na aba grade2023."
    : "";

  return {
    data,
    ...indexes,
    loading,
    loadingMessage,
    error: error || emptyError,
  };
}
