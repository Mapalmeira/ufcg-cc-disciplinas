import fontes from "../../config/fontes.json";
import mapeamento from "../../config/mapeamento-disciplinas.json";
import type { ClassSection, Course } from "../components/types";
import { lerCsv } from "./csv";

type Disciplina = {
  nome: string;
  carga_horaria: number;
  creditos: number;
  unidade_responsavel: string;
  ementa: string;
};

type LinhaDaGrade = {
  codigo: string;
  periodo: string;
  tipo: string;
  disciplina: string;
  creditos: string;
  horas: string;
  reqs: string;
  corr: string;
  trilhas: string;
};

type LinhaDeTurma = {
  codigo: string;
  professor: string;
  sigla: string;
  turma: string;
  sala: string;
  aulasSigaa: string;
  vagas: string;
  professorCompleto: string;
  disciplina: string;
};

export type CurriculumData = {
  courses: Course[];
  sections: ClassSection[];
  errors: string[];
};

function normalizarNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase("pt-BR");
}

function separarCodigos(valor: string) {
  return valor.trim() ? valor.trim().split(/\s+/) : [];
}

function normalizarEspacos(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

function lerGrade(values: string[][]) {
  return values.slice(1).map(([
    codigo = "", periodo = "", tipo = "", disciplina = "", creditos = "", horas = "", reqs = "", corr = "", , trilhas = "",
  ]): LinhaDaGrade => ({ codigo, periodo, tipo, disciplina, creditos, horas, reqs, corr, trilhas }));
}

function lerTurmas(values: string[][]) {
  return values.slice(1).map(([
    codigo = "", professor = "", sigla = "", turma = "", , sala = "", , aulasSigaa = "", vagas = "", professorCompleto = "", , , disciplina = "",
  ]): LinhaDeTurma => ({ codigo, professor, sigla, turma, sala, aulasSigaa, vagas, professorCompleto, disciplina }));
}

async function buscarJson<T>(url: string): Promise<T> {
  const resposta = await fetch(url, { cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json() as Promise<T>;
}

async function buscarCsv(url: string) {
  const resposta = await fetch(url, { cache: "no-store" });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return lerCsv(await resposta.text());
}

function mensagemDeErro(resultado: PromiseSettledResult<unknown>, mensagem: string) {
  return resultado.status === "rejected" ? mensagem : null;
}

/**
 * Consulta as fontes públicas e consolida seus formatos no navegador.
 * Nenhuma rota de API ou processo de servidor é necessário em produção.
 */
export async function carregarDadosCurriculares(): Promise<CurriculumData> {
  const [disciplinasResposta, gradeResposta, turmasResposta] = await Promise.allSettled([
    buscarJson<Disciplina[]>(fontes.disciplinas_url),
    buscarCsv(fontes.grade2023_url),
    buscarCsv(fontes.turmas2026_2_url),
  ]);

  const disciplinas = disciplinasResposta.status === "fulfilled"
    ? disciplinasResposta.value.filter((disciplina) => typeof disciplina.nome === "string")
    : [];
  const grade = gradeResposta.status === "fulfilled" ? lerGrade(gradeResposta.value) : [];
  const turmas = turmasResposta.status === "fulfilled" ? lerTurmas(turmasResposta.value) : [];
  const detalhesPorNome = new Map(disciplinas.map((disciplina) => [normalizarNome(disciplina.nome), disciplina]));
  const nomesMapeados: Record<string, string> = mapeamento.mapeamento;
  const turmasValidas: ClassSection[] = turmas
    .filter((turma) => turma.codigo && turma.disciplina && (turma.professorCompleto || turma.professor))
    .map((turma) => ({
      professor: turma.professorCompleto || turma.professor || "Não informado",
      professorMnemonic: turma.professor,
      courseCode: turma.codigo,
      courseName: turma.disciplina,
      courseMnemonic: turma.sigla,
      section: turma.turma,
      room: turma.sala,
      schedule: normalizarEspacos(turma.aulasSigaa),
      vacancies: turma.vagas,
    }));
  const mnemonicosPorCodigo = new Map<string, string[]>();
  turmasValidas.forEach((turma) => {
    const existentes = mnemonicosPorCodigo.get(turma.courseCode) ?? [];
    if (turma.courseMnemonic && !existentes.includes(turma.courseMnemonic)) existentes.push(turma.courseMnemonic);
    mnemonicosPorCodigo.set(turma.courseCode, existentes);
  });
  const codigosIgnorados = new Set<string>(fontes.codigos_ignorados);
  const courses: Course[] = grade
    .filter((linha) => linha.codigo && linha.disciplina && !codigosIgnorados.has(linha.codigo))
    .map((linha) => {
      const nomeNoJson = nomesMapeados[linha.disciplina] ?? linha.disciplina;
      const detalhe = detalhesPorNome.get(normalizarNome(nomeNoJson));
      const period = Number(linha.periodo) || 0;

      return {
        code: linha.codigo,
        name: linha.disciplina,
        hours: Number(linha.horas),
        credits: Number(linha.creditos),
        category: period ? `${period}º período` : "Optativa",
        period,
        track: linha.trilhas || "Sem trilha",
        unit: detalhe?.unidade_responsavel ?? "Não informada",
        syllabus: detalhe?.ementa ?? "Ementa não informada.",
        prerequisites: separarCodigos(linha.reqs),
        corequisites: separarCodigos(linha.corr),
        mnemonics: mnemonicosPorCodigo.get(linha.codigo) ?? [],
        electiveSlot: linha.tipo === "opt" && linha.disciplina.startsWith("Optativa "),
      };
    });

  return {
    courses,
    sections: turmasValidas,
    errors: [
      mensagemDeErro(disciplinasResposta, "Não foi possível consultar as disciplinas."),
      mensagemDeErro(gradeResposta, "Não foi possível consultar a grade curricular."),
      mensagemDeErro(turmasResposta, "Não foi possível consultar as turmas."),
    ].filter((mensagem): mensagem is string => Boolean(mensagem)),
  };
}
