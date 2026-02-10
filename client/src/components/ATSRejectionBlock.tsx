import { AlertTriangle } from "lucide-react";
import { Lock } from "lucide-react";

interface ATSRejectionBlockProps {
  rejectionRate: number;
}

const ATSRejectionBlock = ({ rejectionRate }: ATSRejectionBlockProps) => {
  return (
    <div className="result-card p-6 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="section-label text-red-500">Estimativa de rejeição automática em ATS</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-display font-bold text-card-foreground">{rejectionRate}%</span>
            <span className="text-sm text-muted-foreground">de probabilidade</span>
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

      {/* Locked CTA */}
      <div className="p-4 rounded-lg bg-secondary border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-gold" />
          <p className="text-xs font-semibold text-card-foreground">Desbloqueia para ver:</p>
        </div>
        <ul className="space-y-1.5">
          {[
            "Quais os fatores que mais penalizam",
            "Em que ATS o CV falha mais",
            "Como reduzir esta taxa",
          ].map((item, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-gold">→</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ATSRejectionBlock;
