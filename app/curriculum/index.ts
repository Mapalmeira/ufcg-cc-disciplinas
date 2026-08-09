import sources from "../../config/fontes.json";
import ppcNameMapping from "../../config/mapeamento_disciplinas.json";
import { parseLoadActions } from "./load-actions/index.ts";
import { applyStructure, createCurriculumData } from "./curriculum-data.ts";
import type { CurriculumData } from "./types";

/** Resolves the configured curriculum actions in order. */
export async function loadData(): Promise<CurriculumData> {
  const structure = createCurriculumData();
  const actions = parseLoadActions(sources.actions, structure, ppcNameMapping);

  for (const action of actions) {
    applyStructure(structure, await action.resolve());
  }

  return structure;
}
