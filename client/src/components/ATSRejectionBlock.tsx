// ATSRejectionBlock.tsx - Estilo Share2Inspire
import { AlertTriangle, Lock, Info, CheckCircle, ShieldAlert, TrendingDown } from "lucide-react";
import { useState } from "react";

interface ATSRejectionBlockProps {
  rejectionRate: number;
  topFactor?: string;
  isPaid?: boolean;
  detailedFactors?: string[];
  atsSystems?: string[];
  quickFixes?: string[];
}

const ATSRejectionBlock = ({ rejectionRate, topFactor, isPaid = false, detailedFactors, atsSystems, quickFixes }: ATSRejectionBlockProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const severity = rejectionRate > 60 ? 'Elevada' : rejectionRate > 40 ? 'Moderada' : 'Baixa';

  const visibleFactor = topFactor || (
    rejectionRate > 60 
      ? 'Estrutura do CV dificulta a leitura automática por sistemas ATS'
      : rejectionRate > 40
        ? 'Algumas palavras-chave relevantes em falta para filtros automáticos'
        : 'Boa compatibilidade com a maioria dos sistemas de triagem'
  );

  const getDetailedFactors = (): string[] => {
    if (detailedFactors && detailedFactors.length > 0) return detailedFactors;
    if (rejectionRate > 60) {
      return [
        "Formatação complexa com tabelas ou colunas que confundem parsers ATS",
        "Falta de palavras-chave específicas do sector na secção de competências",
        "Headers ou secções não standard que o ATS não reconhece",
        "Uso excessivo de gráficos ou elementos visuais não legíveis por ATS",
      ];
    } else if (rejectionRate > 40) {
      return [
        "Algumas palavras-chave do sector poderiam ser mais explícitas",
        "Formato de datas ou localização pode variar entre sistemas ATS",
        "Secção de competências poderia ser mais detalhada para matching automático",
      ];
    }
    return [
      "Estrutura clara e bem organizada para leitura automática",
      "Boa densidade de palavras-chave relevantes para o sector",
      "Formato compatível com a maioria dos sistemas de triagem",
    ];
  };

  const getATSSystems = () => {
    if (rejectionRate > 60) {
      return [
        { name: "Workday", compat: "Baixa", color: "text-red-500" },
        { name: "SAP SF", compat: "Baixa", color: "text-red-500" },
        { name: "Taleo", compat: "Moderada", color: "text-yellow-500" },
        { name: "Greenhouse", compat: "Moderada", color: "text-yellow-500" },
      ];
    } else if (rejectionRate > 40) {
      return [
        { name: "Workday", compat: "Moderada", color: "text-yellow-500" },
        { name: "SAP SF", compat: "Boa", color: "text-green-500" },
        { name: "Taleo", compat: "Moderada", color: "text-yellow-500" },
        { name: "Greenhouse", compat: "Boa", color: "text-green-500" },
      ];
    }
    return [
      { name: "Workday", compat: "Boa", color: "text-green-500" },
      { name: "SAP SF", compat: "Boa", color: "text-green-500" },
      { name: "Taleo", compat: "Boa", color: "text-green-500" },
      { name: "Greenhouse", compat: "Excelente", color: "text-green-600" },
    ];
  };

  const getReductionTips = (): string[] => {
    if (rejectionRate > 60) {
      return [
        "Converter o CV para formato de coluna única sem tabelas",
        "Adicionar secção 'Competências-Chave' com termos específicos do sector",
        "Usar headers standard: 'Experiência Profissional', 'Formação', 'Competências'",
        "Remover gráficos e substituir por texto descritivo",
      ];
    } else if (rejectionRate > 40) {
      return [
        "Enriquecer a secção de competências com termos técnicos do sector",
        "Standardizar formato de datas (MM/AAAA)",
        "Adicionar palavras-chave da descrição de funções alvo",
      ];
    }
    return [
      "Manter a estrutura actual - está bem optimizada",
      "Personalizar palavras-chave para cada candidatura específica",
      "Actualizar regularmente com novos termos do sector",
    ];
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6 space-y-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-red-500">ESTIMATIVA DE REJEIÇÃO AUTOMÁTICA EM ATS</p>
            <div className="relative">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-0.5 rounded-full hover:bg-muted transition-colors"
              >
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {showTooltip && (
                <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
                  <p className="font-semibold mb-1">O que é o ATS?</p>
                  <p>Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente antes de um recrutador os ver.</p>
                  <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-4xl font-bold text-foreground">{rejectionRate}%</span>
            <span className="text-sm text-muted-foreground">de probabilidade</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              rejectionRate > 60 ? 'bg-red-500/10 text-red-500' : 
              rejectionRate > 40 ? 'bg-yellow-500/10 text-yellow-500' : 
              'bg-green-500/10 text-green-500'
            }`}>{severity}</span>
          </div>
          <p className="text-xs text-muted-foreground">Com base em parsing, palavras-chave e estrutura.</p>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000" style={{ width: `${rejectionRate}%` }} />
      </div>

      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
        <p className="text-sm text-foreground flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <span>{visibleFactor}</span>
        </p>
      </div>

      {isPaid ? (
        <div className="space-y-4">
          {/* Interpretação qualitativa */}
          <div className="p-4 rounded-lg bg-[#C9A961]/5 border border-[#C9A961]/20">
            <p className="text-sm text-foreground leading-relaxed">
              {rejectionRate <= 20 ? (
                <>O teu CV tem uma <strong>excelente compatibilidade</strong> com sistemas ATS. Com apenas {rejectionRate}% de probabilidade de rejeição automática, o teu CV passa pela maioria dos filtros sem problemas, chegando às mãos de recrutadores humanos na grande maioria das candidaturas online.</>
              ) : rejectionRate <= 40 ? (
                <>O teu CV tem uma <strong>boa compatibilidade</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria dos sistemas consegue ler o teu CV correctamente. Pequenas optimizações nas palavras-chave e na estrutura podem reduzir esta taxa significativamente.</>
              ) : rejectionRate <= 60 ? (
                <>O teu CV tem uma <strong>compatibilidade moderada</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, cerca de metade das candidaturas online podem ser filtradas antes de chegar a um recrutador.</>
              ) : (
                <>O teu CV tem uma <strong>compatibilidade baixa</strong> com sistemas ATS. Com {rejectionRate}% de probabilidade de rejeição, a maioria das candidaturas online será filtrada automaticamente. É urgente reformular a estrutura.</>
              )}
            </p>
          </div>

          {/* Factores detalhados */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">Factores que afectam a compatibilidade:</p>
            </div>
            {getDetailedFactors().map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                <p className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-[#C9A961] font-bold">{i + 1}.</span>
                  <span>{f}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Compatibilidade por sistema */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#C9A961]" />
              <p className="text-xs font-semibold text-foreground">Compatibilidade por sistema ATS:</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {getATSSystems().map((s, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border flex justify-between items-center">
                  <span className="text-xs font-medium text-foreground">{s.name}</span>
                  <span className={`text-xs font-semibold ${s.color}`}>{s.compat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Como reduzir */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-green-500" />
              <p className="text-xs font-semibold text-foreground">Como reduzir esta taxa em 48h:</p>
            </div>
            {getReductionTips().map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
            <p className="text-xs font-semibold text-foreground">Desbloqueia para ver:</p>
          </div>
          <ul className="space-y-1.5">
            {["Quais os fatores que mais penalizam o teu CV", "Em que sistemas ATS o teu CV falha mais", "Como reduzir esta taxa em 48h"].map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="text-[#C9A961]">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ATSRejectionBlock;
