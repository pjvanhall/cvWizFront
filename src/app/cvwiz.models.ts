export type SkillMatrix = Record<string, Record<string, number>>;

export interface TechniekMatrixDto {
  id: number | null;
  matrix: SkillMatrix;
}

export interface ErvaringDto {
  id: number | null;
  bedrijf: string;
  periode: string;
  functie: string;
  sector: string;
  kennis: string;
  situatie: string;
  taak: string;
}

export interface CurriculumVitaeDto {
  id: number | null;
  bestandsNaam: string;
  competenties: string[];
  profiel: string;
  opleiding: string;
  matrix: TechniekMatrixDto;
  ervaring: ErvaringDto[];
  languages?: Record<string, string>;
}

export interface MedewerkerListDto {
  id: string | null;
  voornaam: string;
  achternaam: string;
  telefoon: string;
  emailAdres: string;
  hasCv?: boolean;
}

export interface MedewerkerDto {
  id: string | null;
  voornaam: string;
  achternaam: string;
  telefoon: string;
  emailAdres: string;
  orgineleCv?: CurriculumVitaeDto;
  cvLijst: CurriculumVitaeDto[];
}

export interface BeheerderDto {
  id: string | null;
  voornaam: string;
  achternaam: string;
  telefoon: string;
  emailAdres: string;
  hasCv?: boolean;
}
