export type Course = {
  code?: string;
  ignored?: boolean;
  category?: string;
  period?: number;
  hours?: number;
  credits?: number;
  names?: string[];
  tracks?: string[];
  responsible_unit?: string;
  syllabus?: string;
  prerequisites?: string[];
  corequisites?: string[];
  mnemonics?: string[];
};

export type Section = {
  course_code?: string;
  professor?: string;
  professor_mnemonic?: string;
  section?: string;
  room?: string;
  schedule?: string;
  seats?: string;
};

export type CurriculumData = {
  courses: Record<string, Course>;
  sections: Record<string, Section>;
};
