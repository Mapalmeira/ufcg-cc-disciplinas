export type Tab = "grade" | "disciplinas" | "grafo" | "turmas";
export type Status = "paid" | "planned";
export type Relation = "prerequisite" | "corequisite" | "unlocks" | "focus";

export type Course = {
  code: string;
  name: string;
  hours: number;
  credits: number;
  category: string;
  period: number;
  track: string;
  unit: string;
  syllabus: string;
  prerequisites: string[];
  corequisites: string[];
  mnemonics: string[];
  electiveSlot: boolean;
};

export type SortKey = "code" | "name" | "hours" | "credits" | "category" | "track";

export type ClassSection = {
  professor: string;
  professorMnemonic: string;
  courseCode: string;
  courseName: string;
  courseMnemonic: string;
  section: string;
  room: string;
  schedule: string;
  vacancies: string;
};

export type ClassSortKey = "professor" | "courseCode" | "courseName" | "section" | "room" | "schedule" | "vacancies" | "courseMnemonic";
