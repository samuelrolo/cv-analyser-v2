export interface AnalysisData {
  atsRejectionRate: number;
  atsTopFactor?: string;
  quadrants: {
    title: string;
    score: number;
    benchmark: number;
    impactPhrase: string;
    strengths?: string[];
    weaknesses?: string[];
  }[];
  keywords: string[];
  perceivedRole?: string;
  perceivedSeniority?: string;
  salaryRange?: {
    min: number;
    mid: number;
    max: number;
  };
  overallScore?: number;
  // Extended fields for paid report
  salaryDetailed?: {
    percentile25: number;
    median: number;
    percentile75: number;
    topMax: number;
    currency: string;
    period: string; // "mensal" | "anual"
    benefits?: string[];
    benefitsNote?: string;
    source?: string;
  };
  automationRisk?: {
    percentage: number;
    level: string; // "Baixo" | "Médio" | "Alto"
    description: string;
    recommendations?: string[];
  };
  improvementActions?: {
    action: string;
    before: string;
    after: string;
    impact: string; // "Alto" | "Médio" | "Baixo"
    dimension: string;
  }[];
  priorityMatrix?: {
    dimension: string;
    urgency: string; // "Alta" | "Média" | "Baixa"
    currentScore: number;
    potentialScore: number;
    actions: string[];
  }[];
  detailedAtsAnalysis?: {
    factors: string[];
    atsSystems?: string[];
    quickFixes?: string[];
  };
  recruiterDeepAnalysis?: {
    attentionMap?: string[];
    frictionPoints?: string[];
    positiveSignals?: string[];
    readingFlow?: string;
  };
  actionPlan30Days?: {
    week: string;
    title: string;
    actions: string[];
  }[];
}
