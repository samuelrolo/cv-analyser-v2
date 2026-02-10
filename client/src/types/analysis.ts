export interface AnalysisData {
  atsRejectionRate: number;
  quadrants: {
    title: string;
    score: number;
    benchmark: number;
    impactPhrase: string;
  }[];
  keywords: string[];
}
