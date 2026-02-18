export interface AnalysisData {
  atsRejectionRate: number;
  atsTopFactor?: string; // 1 bullet visível do ATS
  quadrants: {
    title: string;
    score: number;
    benchmark: number;
    impactPhrase: string;
    strengths?: string[]; // pontos fortes visíveis
    weaknesses?: string[]; // pontos a melhorar (1 visível, resto blur)
  }[];
  keywords: string[];
  perceivedRole?: string; // "Gestor de Projetos mid-level"
  perceivedSeniority?: string; // "Mid-level" / "Senior" / "Junior"
  salaryRange?: {
    min: number;
    mid: number;
    max: number;
  };
  overallScore?: number; // score global 0-100
}
