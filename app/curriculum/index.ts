import sources from "../../config/fontes.json";
import ppcNameMapping from "../../config/mapeamento_disciplinas.json";
import {
  executeLoadActions,
  parseLoadActions,
  type LoadProgressHandler,
} from "./load-actions/index.ts";
import { createCurriculumData } from "./curriculum-data.ts";
import type { CurriculumData } from "./types";

/** Resolves the configured curriculum actions in order. */
export async function loadData(onProgress?: LoadProgressHandler): Promise<CurriculumData> {
  const structure = createCurriculumData();
  const actions = parseLoadActions(sources.actions, structure, ppcNameMapping);

  return executeLoadActions(actions, structure, onProgress);
}
