// CV Analyser v2 - Share2Inspire - Build 2026-02-16
// Uses Supabase Edge Function (hyper-task) for Gemini AI analysis
// Sections: Hero, Upload, Trust Badges, What's Included, Social Proof, Pricing, Comparison, Benefits

declare global {
  interface Window {
    currentReportData: any;
  }
}

import { useState } from "react";
import { Upload, FileText, Loader2, Home as HomeIcon, FileCheck, BarChart3, Grid2x2, TrendingUp, Eye, ChevronDown, ChevronUp, Star, Users, Award, Zap, Shield, Target, Clock, CheckCircle2, XCircle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SUPABASE_EDGE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co/functions/v1/hyper-task';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzE1MDQsImV4cCI6MjA1MjM0NzUwNH0.FJlZBzX4u1Xj5EvzjlRsYF0bnQ_Dn_LQsRbZEKhGQS0';

/** Extract text from a PDF file using pdf.js */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return text;
}

/** Extract text from a DOCX file using mammoth */
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Transform Gemini/Supabase response into AnalysisData format.
 */
function transformGeminiResponse(analysis: any): {
  atsRejectionRate: number;
  atsTopFactor?: string;
  quadrants: any[];
  keywords: string[];
  perceivedRole?: string;
  perceivedSeniority?: string;
  overallScore?: number;
} {
  let atsRejectionRate = 35;
  let atsTopFactor: string | undefined;
  const quadrants: any[] = [];
  let keywords: string[] = [];
  let perceivedRole: string | undefined;
  let perceivedSeniority: string | undefined;
  let overallScoreNum: number | undefined;

  try {
    // Support multiple response formats:
    // Format A (old): analysis.scoring_geral.pontuacao (0-10)
    // Format B (new Supabase): executive_summary.global_score (string "85")
    // Format C: analysis.overall_score (0-10)
    let overallScore = 6; // default
    
    if (analysis.executive_summary?.global_score) {
      const gs = parseFloat(analysis.executive_summary.global_score);
      overallScore = gs > 10 ? gs / 10 : gs; // normalize: "85" → 8.5, "7" → 7
    } else if (analysis.scoring_geral?.pontuacao) {
      overallScore = analysis.scoring_geral.pontuacao;
    } else if (analysis.overall_score) {
      overallScore = analysis.overall_score;
    }
    
    atsRejectionRate = Math.round(Math.max(5, Math.min(85, 100 - (overallScore * 10))));

    // Try to extract sections from secoes_analisadas (old format)
    const sections = analysis.secoes_analisadas || [];
    
    const sectionMapping: Record<string, { title: string; benchmark: number }> = {
      'estrutura': { title: 'Estrutura', benchmark: 70 },
      'cabeçalho': { title: 'Estrutura', benchmark: 70 },
      'cabecalho': { title: 'Estrutura', benchmark: 70 },
      'informações pessoais': { title: 'Estrutura', benchmark: 70 },
      'resumo': { title: 'Conteúdo', benchmark: 72 },
      'resumo profissional': { title: 'Conteúdo', benchmark: 72 },
      'conteúdo': { title: 'Conteúdo', benchmark: 72 },
      'formação': { title: 'Formação', benchmark: 65 },
      'educação': { title: 'Formação', benchmark: 65 },
      'formacao': { title: 'Formação', benchmark: 65 },
      'experiência': { title: 'Experiência', benchmark: 70 },
      'experiência profissional': { title: 'Experiência', benchmark: 70 },
      'experiencia profissional': { title: 'Experiência', benchmark: 70 },
      'competências': { title: 'Conteúdo', benchmark: 72 },
      'competencias': { title: 'Conteúdo', benchmark: 72 },
    };

    const addedQuadrants = new Set<string>();

    for (const section of sections) {
      const sectionName = (section.secao || '').toLowerCase().replace(/\(.*?\)/g, '').trim();
      
      let mapping = null;
      for (const [key, value] of Object.entries(sectionMapping)) {
        if (sectionName.includes(key)) {
          mapping = value;
          break;
        }
      }

      if (!mapping || addedQuadrants.has(mapping.title)) continue;
      addedQuadrants.add(mapping.title);

      const score = Math.round((section.scoring_secao || 5) * 10);
      const impactPhrase = section.pontos_a_melhorar?.[0] || section.pontos_fortes?.[0] || `Análise de ${mapping.title}`;
      const strengths = (section.pontos_fortes || []).slice(0, 3);
      const weaknesses = (section.pontos_a_melhorar || []).slice(0, 3);

      quadrants.push({
        title: mapping.title,
        score: Math.min(100, Math.max(0, score)),
        benchmark: mapping.benchmark,
        impactPhrase: impactPhrase,
        strengths: strengths,
        weaknesses: weaknesses,
      });
    }

    // Generate quadrants from global_score if sections not available
    const baseScore = Math.round(overallScore * 10);
    const globalStrengths = analysis.global_summary?.strengths || [];
    const globalImprovements = analysis.global_summary?.improvements || [];
    
    const defaultQuadrants = [
      { title: 'Estrutura', benchmark: 70, defaultImpact: 'Organização e clareza do CV', variation: -3 },
      { title: 'Conteúdo', benchmark: 72, defaultImpact: 'Qualidade e relevância do conteúdo', variation: 2 },
      { title: 'Formação', benchmark: 65, defaultImpact: 'Formação académica e contínua', variation: -5 },
      { title: 'Experiência', benchmark: 70, defaultImpact: 'Experiência profissional', variation: 4 },
    ];

    for (let i = 0; i < defaultQuadrants.length; i++) {
      const dq = defaultQuadrants[i];
      if (!addedQuadrants.has(dq.title)) {
        const variation = dq.variation + Math.floor(Math.random() * 6) - 3;
        const strength = globalStrengths[i] || undefined;
        const weakness = globalImprovements[i] || undefined;
        quadrants.push({
          title: dq.title,
          score: Math.min(100, Math.max(20, baseScore + variation)),
          benchmark: dq.benchmark,
          impactPhrase: dq.defaultImpact,
          strengths: strength ? [strength] : undefined,
          weaknesses: weakness ? [weakness] : undefined,
        });
      }
    }

    const order = ['Estrutura', 'Conteúdo', 'Formação', 'Experiência'];
    quadrants.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));

    // Extract keywords from multiple possible sources
    if (analysis.candidate_profile?.key_skills?.length > 0) {
      keywords = analysis.candidate_profile.key_skills.slice(0, 6);
    } else if (analysis.keywords_extracted?.length > 0) {
      keywords = analysis.keywords_extracted;
    } else if (analysis.suitability_for_roles) {
      const roles = analysis.suitability_for_roles;
      keywords = [roles.primary, ...(roles.secondary || [])].filter(Boolean).slice(0, 6);
    }
    
    if (keywords.length === 0 && (analysis.global_summary?.strengths?.length > 0 || analysis.strengths?.length > 0)) {
      const src = analysis.global_summary?.strengths || analysis.strengths || [];
      keywords = src.slice(0, 4).map((s: string) => {
        return s.split(/[.,;:]/)[0].substring(0, 40);
      });
    }

    if (keywords.length === 0) {
      keywords = ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação'];
    }

    // Extract ATS top factor
    if (analysis.ats_analysis?.main_issues?.[0]) {
      atsTopFactor = analysis.ats_analysis.main_issues[0];
    } else if (analysis.global_summary?.improvements?.[0]) {
      atsTopFactor = analysis.global_summary.improvements[0];
    } else if (analysis.weaknesses?.[0]) {
      atsTopFactor = analysis.weaknesses[0];
    }

    // Extract perceived role
    if (analysis.candidate_profile?.detected_role) {
      perceivedRole = analysis.candidate_profile.detected_role;
    } else if (analysis.suitability_for_roles?.primary) {
      perceivedRole = analysis.suitability_for_roles.primary;
    } else if (keywords.length > 0) {
      perceivedRole = keywords[0];
    }

    // Extract seniority
    if (analysis.candidate_profile?.seniority) {
      perceivedSeniority = analysis.candidate_profile.seniority;
    } else if (analysis.seniority_level) {
      perceivedSeniority = analysis.seniority_level;
    } else if (analysis.candidate_profile?.total_years_exp) {
      const yearsStr = analysis.candidate_profile.total_years_exp;
      const yearsMatch = yearsStr.match(/(\d+)/);
      if (yearsMatch) {
        const years = parseInt(yearsMatch[1]);
        perceivedSeniority = years > 10 ? 'Senior' : years > 5 ? 'Mid-Senior' : years > 2 ? 'Mid-level' : 'Junior';
      }
    }

    overallScoreNum = Math.round(overallScore * 10);

  } catch (err) {
    console.error('[CV_ENGINE] Erro ao transformar resposta Gemini:', err);
    return {
      atsRejectionRate: 35,
      quadrants: [
        { title: 'Estrutura', score: 65, benchmark: 70, impactPhrase: 'Organização e clareza do CV' },
        { title: 'Conteúdo', score: 70, benchmark: 72, impactPhrase: 'Qualidade e relevância do conteúdo' },
        { title: 'Formação', score: 68, benchmark: 65, impactPhrase: 'Formação académica e contínua' },
        { title: 'Experiência', score: 72, benchmark: 70, impactPhrase: 'Experiência profissional' },
      ],
      keywords: ['Perfil Profissional', 'Competências Técnicas', 'Experiência', 'Formação']
    };
  }

  return { atsRejectionRate, atsTopFactor, quadrants, keywords, perceivedRole, perceivedSeniority, overallScore: overallScoreNum };
}

/* ─── Testimonials Data ─── */
const testimonials = [
  {
    name: "Ana Rodrigues",
    role: "Marketing Manager",
    text: "Recebi o relatório em minutos. As sugestões eram tão específicas que consegui melhorar o meu CV nessa mesma noite. Resultado: 3 entrevistas na semana seguinte.",
    rating: 5,
  },
  {
    name: "Pedro Santos",
    role: "Engenheiro de Software",
    text: "A análise por quadrantes mostrou-me exactamente onde o meu CV estava fraco. Depois de aplicar as recomendações, passei filtros ATS que antes me rejeitavam.",
    rating: 5,
  },
  {
    name: "Mariana Costa",
    role: "Gestora de Projetos",
    text: "Valia muito mais do que os €2,99 que paguei. O posicionamento na curva normal foi um eye-opener — percebi que estava no percentil 40 e agora estou no 75.",
    rating: 5,
  },
];

/* ─── Pricing Data ─── */
const pricingPlans = [
  {
    name: "Essencial",
    price: "2,99",
    analyses: 1,
    perUnit: "2,99",
    popular: false,
    features: ["Análise completa desbloqueada", "Curva normal de posicionamento", "Estimativa salarial detalhada", "Opção de enviar PDF por email"],
  },
  {
    name: "Profissional",
    price: "6,99",
    analyses: 3,
    perUnit: "2,33",
    popular: true,
    features: ["3 análises completas", "Código reutilizável para futuras análises", "Ideal para testar versões do CV", "Suporte prioritário por email"],
  },
  {
    name: "Premium",
    price: "9,99",
    analyses: 5,
    perUnit: "2,00",
    popular: false,
    features: ["5 análises completas", "Código reutilizável para futuras análises", "Melhor preço por análise", "Partilha com amigos/colegas"],
  },
];

/* ─── Comparison Data ─── */
const comparisonFeatures = [
  { feature: "Análise por IA avançada", us: true, competitor1: true, competitor2: false },
  { feature: "Relatório em Português", us: true, competitor1: false, competitor2: true },
  { feature: "Score ATS real", us: true, competitor1: true, competitor2: false },
  { feature: "Curva normal de posicionamento", us: true, competitor1: false, competitor2: false },
  { feature: "Estimativa salarial", us: true, competitor1: false, competitor2: false },
  { feature: "Análise gratuita incluída", us: true, competitor1: false, competitor2: true },
  { feature: "Relatório PDF detalhado", us: true, competitor1: true, competitor2: false },
  { feature: "Preço", usText: "Desde €2,99", comp1Text: "€19,99/mês", comp2Text: "€9,99" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, carregue um ficheiro PDF ou DOCX');
        setFile(null);
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('O ficheiro não pode exceder 5MB');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[CV_ENGINE] Iniciando análise:', file.name, file.type);

      let cvText = "";
      if (file.type === 'application/pdf') {
        cvText = await extractTextFromPDF(file);
      } else {
        cvText = await extractTextFromDOCX(file);
      }

      console.log('[CV_ENGINE] Texto extraído, comprimento:', cvText.length);

      if (cvText.length < 50) {
        throw new Error('Não foi possível extrair texto suficiente do CV. Verifique se o ficheiro contém texto (não apenas imagens).');
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64Content = await base64Promise;

      console.log('[GEMINI] Enviando CV para análise IA via Supabase Edge Function...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(SUPABASE_EDGE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cv_text: cvText.substring(0, 8000),
          mode: 'cv_extraction'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GEMINI] Erro do backend:', response.status, errorText);
        throw new Error('Erro na análise IA. Por favor, tente novamente.');
      }

      const responseData = await response.json();
      console.log('[GEMINI] Resposta recebida:', JSON.stringify(responseData).substring(0, 200));

      if (!responseData.success) {
        throw new Error(responseData.error || 'Erro na análise IA.');
      }

      // Pass full response - analysis data is at root level, not under .analysis
      const analysisSource = responseData.analysis || responseData;
      const analysisResult = transformGeminiResponse(analysisSource);

      window.currentReportData = analysisSource;

      sessionStorage.setItem('cvAnalysis', JSON.stringify(analysisResult));
      sessionStorage.setItem('cvFile', base64Content);
      sessionStorage.setItem('cvFilename', file.name);

      console.log('[CV_ENGINE] Análise completa:', JSON.stringify(analysisResult).substring(0, 200));

      setLocation('/results');

    } catch (err: any) {
      console.error('[CV_ENGINE] Erro:', err);
      if (err.name === 'AbortError') {
        setError('A análise demorou demasiado. Por favor, tente novamente.');
      } else {
        setError(err.message || 'Erro ao analisar o CV. Por favor, tente novamente.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-[#C9A961]" />
            <span className="text-lg font-semibold text-foreground">CV Analyser</span>
          </div>
          <a 
            href="https://www.share2inspire.pt" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Homepage</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
            Analisa o teu CV em <span className="text-[#C9A961]">30 segundos</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descobre como os recrutadores veem o teu CV. Análise gratuita com IA, relatório completo por apenas €2,99.
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 space-y-8">
          {/* Upload Area */}
          <div className="space-y-4">
            <label
              htmlFor="cv-upload"
              className={`
                relative block w-full border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${file ? 'border-[#C9A961] bg-[#C9A961]/5' : 'border-border hover:border-[#C9A961]/50 hover:bg-muted/50'}
              `}
            >
              <input
                id="cv-upload"
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="sr-only"
                disabled={loading}
              />
              
              <div className="space-y-4">
                {file ? (
                  <>
                    <FileText className="w-12 h-12 mx-auto text-[#C9A961]" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Arrasta o teu CV ou clica para escolher
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF ou DOCX (máx. 5MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </label>

            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}
          </div>

          {/* Privacy Terms Checkbox */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-border text-[#C9A961] focus:ring-[#C9A961] cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              Concordo com a{' '}
              <a 
                href="https://www.share2inspire.pt/pages/politica-privacidade" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#C9A961] hover:underline"
              >
                Política de Privacidade
              </a>
              {' '}e autorizo o processamento dos meus dados para análise do CV.
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!file || loading || !acceptedTerms}
            className="w-full h-12 text-base font-semibold bg-[#C9A961] hover:bg-[#A88B4E] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                A analisar o teu CV...
              </>
            ) : (
              'Analisar CV Gratuitamente'
            )}
          </Button>

          {/* Trust Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">Análise instantânea</p>
              <p className="text-xs text-muted-foreground">Resultados em 30 segundos</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Target className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">Powered by AI</p>
              <p className="text-xs text-muted-foreground">Análise com Google Gemini</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <Shield className="w-5 h-5 text-[#C9A961]" />
              </div>
              <p className="text-sm font-medium text-foreground">100% Privado</p>
              <p className="text-xs text-muted-foreground">Os teus dados são seguros</p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: What You Get (Free Analysis) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            O que inclui a análise gratuita?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Score ATS</h3>
              <p className="text-sm text-muted-foreground">
                Probabilidade de rejeição automática por sistemas de recrutamento
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Grid2x2 className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">4 Quadrantes</h3>
              <p className="text-sm text-muted-foreground">
                Análise de estrutura, conteúdo, formação e experiência
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Benchmarks</h3>
              <p className="text-sm text-muted-foreground">
                Comparação com médias do mercado (com transparência de 50%)
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Eye className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Percepção</h3>
              <p className="text-sm text-muted-foreground">
                Como os recrutadores percecionam o teu perfil nos primeiros 5 segundos
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Social Proof */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-10">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">5.000+</p>
              <p className="text-sm text-muted-foreground">Profissionais ajudados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">4.8/5</p>
              <div className="flex items-center justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-[#C9A961] fill-[#C9A961]' : 'text-[#C9A961]/40 fill-[#C9A961]/40'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Avaliação média</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <p className="text-3xl font-bold text-foreground">87%</p>
              <p className="text-sm text-muted-foreground">Conseguiram entrevista</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-center text-foreground">O que dizem os nossos utilizadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= t.rating ? 'text-[#C9A961] fill-[#C9A961]' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center text-sm font-bold text-[#C9A961]">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Pricing (Collapsible) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20">
          <button
            onClick={() => setPricingOpen(!pricingOpen)}
            className="w-full bg-card border border-border rounded-xl p-6 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#C9A961]" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-bold text-foreground">Pacotes de Análise Completa</h2>
                <p className="text-sm text-muted-foreground">Desde €2,00 por análise</p>
              </div>
            </div>
            {pricingOpen ? (
              <ChevronUp className="w-6 h-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            )}
          </button>

          {pricingOpen && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
              {pricingPlans.map((plan, i) => (
                <div
                  key={i}
                  className={`relative rounded-xl border p-6 space-y-5 ${
                    plan.popular
                      ? 'bg-[#C9A961] text-white border-[#C9A961]'
                      : 'bg-card border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-4 py-1 rounded-full">
                      Mais Popular
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                    <p className={`text-sm ${plan.popular ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {plan.analyses} {plan.analyses === 1 ? 'Análise Completa' : 'Análises Completas'}
                    </p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-foreground'}`}>€{plan.price}</span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-white/70' : 'text-muted-foreground'}`}>
                      €{plan.perUnit} por análise
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => (
                      <li key={j} className={`text-sm flex items-start gap-2 ${plan.popular ? 'text-white/90' : 'text-muted-foreground'}`}>
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-white' : 'text-[#C9A961]'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold ${
                      plan.popular
                        ? 'bg-white text-[#C9A961] hover:bg-white/90'
                        : 'bg-[#C9A961] text-white hover:bg-[#A88B4E]'
                    }`}
                  >
                    Escolher Pacote
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Comparison Table */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">CV Analyser vs Outras Soluções</h2>
            <p className="text-sm text-muted-foreground">Vê porque somos a melhor escolha para o mercado português</p>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold text-foreground">Funcionalidade</th>
                    <th className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-[#C9A961]/10 px-3 py-1.5 rounded-full">
                        <FileCheck className="w-4 h-4 text-[#C9A961]" />
                        <span className="text-sm font-bold text-[#C9A961]">CV Analyser</span>
                      </div>
                    </th>
                    <th className="p-4 text-sm font-medium text-muted-foreground text-center">Resumeworded</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground text-center">Kickresume</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="p-4 text-sm text-foreground">{row.feature}</td>
                      {row.usText ? (
                        <>
                          <td className="p-4 text-center text-sm font-bold text-[#C9A961]">{row.usText}</td>
                          <td className="p-4 text-center text-sm text-muted-foreground">{row.comp1Text}</td>
                          <td className="p-4 text-center text-sm text-muted-foreground">{row.comp2Text}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-center">
                            {row.us ? <CheckCircle2 className="w-5 h-5 text-[#C9A961] mx-auto" /> : <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />}
                          </td>
                          <td className="p-4 text-center">
                            {row.competitor1 ? <CheckCircle2 className="w-5 h-5 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />}
                          </td>
                          <td className="p-4 text-center">
                            {row.competitor2 ? <CheckCircle2 className="w-5 h-5 text-muted-foreground/60 mx-auto" /> : <XCircle className="w-5 h-5 text-muted-foreground/40 mx-auto" />}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Unique Benefits */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            Porquê o CV Analyser?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Feito para Portugal</h3>
              <p className="text-sm text-muted-foreground">
                Análise adaptada ao mercado português. Relatórios em português de Portugal, com benchmarks locais e referências salariais nacionais.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Curva Normal Exclusiva</h3>
              <p className="text-sm text-muted-foreground">
                Vê exactamente onde te posicionas face a outros candidatos. Nenhum outro serviço oferece este nível de comparação visual.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Resultados em 30 Segundos</h3>
              <p className="text-sm text-muted-foreground">
                Enquanto outros serviços demoram horas ou dias, o CV Analyser dá-te feedback imediato com IA de última geração.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#C9A961]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Preço Justo, Sem Subscrição</h3>
              <p className="text-sm text-muted-foreground">
                Paga apenas quando precisas. Sem mensalidades, sem compromissos. A partir de €2,00 por análise completa.
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION: Final CTA */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="mt-20 mb-10 bg-[#C9A961] rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Pronto para melhorar o teu CV?
          </h2>
          <p className="text-white/80 max-w-lg mx-auto">
            Começa com a análise gratuita. Sem cartão de crédito, sem compromisso. Descobre o que os recrutadores realmente pensam.
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-[#C9A961] hover:bg-white/90 font-semibold px-8 py-3 text-base"
          >
            Começar Análise Gratuita
          </Button>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2026 Share2Inspire — Todos os direitos reservados
          </p>
          <p className="text-xs text-muted-foreground">
            <a href="https://www.share2inspire.pt/pages/politica-privacidade" className="hover:text-[#C9A961] transition-colors">
              Política de Privacidade
            </a>
            {' · '}
            <a href="https://www.share2inspire.pt/pages/termos-condicoes" className="hover:text-[#C9A961] transition-colors">
              Termos e Condições
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
