// ATSRejectionBlock.tsx - Estilo Share2Inspire: ícones outline dourado em círculos
import { AlertTriangle, Lock, Info } from "lucide-react";
import { useState } from "react";

interface ATSRejectionBlockProps {
  rejectionRate: number;
  topFactor?: string;
}

const ATSRejectionBlock = ({ rejectionRate, topFactor }: ATSRejectionBlockProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const severity = rejectionRate > 60 ? 'Elevada' : rejectionRate > 40 ? 'Moderada' : 'Baixa';

  const visibleFactor = topFactor || (
    rejectionRate > 60 
      ? 'Estrutura do CV dificulta a leitura automática por sistemas ATS'
      : rejectionRate > 40
        ? 'Algumas palavras-chave relevantes em falta para filtros automáticos'
        : 'Boa compatibilidade com a maioria dos sistemas de triagem'
  );

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-5">
      <div className="flex items-start gap-4">
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
                  <p>Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente antes de um recrutador os ver. Um score baixo significa que o teu CV pode ser rejeitado antes de ser lido.</p>
                  <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-foreground">{rejectionRate}%</span>
            <span className="text-sm text-muted-foreground">de probabilidade</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              rejectionRate > 60 ? 'bg-red-500/10 text-red-500' : 
              rejectionRate > 40 ? 'bg-yellow-500/10 text-yellow-500' : 
              'bg-green-500/10 text-green-500'
            }`}>
              {severity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Com base em parsing, palavras-chave e estrutura.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000"
          style={{ width: `${rejectionRate}%` }}
        />
      </div>

      {/* 1 bullet VISÍVEL + resto locked */}
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
          <p className="text-sm text-foreground flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <span>{visibleFactor}</span>
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#C9A961]" />
            <p className="text-xs font-semibold text-foreground">Desbloqueia para ver:</p>
          </div>
          <ul className="space-y-1.5">
            {[
              "Quais os fatores que mais penalizam o teu CV",
              "Em que sistemas ATS o teu CV falha mais",
              "Como reduzir esta taxa em 48h",
            ].map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="text-[#C9A961]">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ATSRejectionBlock;
