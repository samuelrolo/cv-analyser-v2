// RecruiterPerception.tsx - Estilo Share2Inspire: ícones outline dourado
import { Lock, Eye } from "lucide-react";

interface RecruiterPerceptionProps {
  roles: string[];
  perceivedRole?: string;
  perceivedSeniority?: string;
}

const RecruiterPerception = ({ roles, perceivedRole, perceivedSeniority }: RecruiterPerceptionProps) => {
  const displayRole = perceivedRole || (roles.length > 0 ? roles[0] : 'Profissional');
  const displaySeniority = perceivedSeniority || 'Mid-level';

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0">
          <Eye className="w-5 h-5 text-[#C9A961]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Primeiros 5 segundos de leitura</h3>
          <p className="text-xs text-muted-foreground">O que um recrutador retém do teu CV</p>
        </div>
      </div>

      {/* Keywords/tags - always visible */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full text-xs font-medium bg-[#C9A961]/10 text-[#C9A961] border border-[#C9A961]/20"
          >
            {role}
          </span>
        ))}
      </div>

      {/* 1-2 visible insights */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-sm text-muted-foreground">
          → Perfil percebido como: <span className="font-semibold text-foreground">{displayRole}</span> ({displaySeniority})
        </p>
        <p className="text-sm text-muted-foreground">
          → O recrutador identifica <span className="font-semibold text-foreground">{roles.length} competências-chave</span> nos primeiros 5 segundos
        </p>
      </div>

      {/* Blurred deeper analysis */}
      <div className="relative">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
          <Lock className="w-5 h-5 text-[#C9A961] mb-1" />
          <p className="text-xs font-medium text-muted-foreground">Análise completa da percepção no relatório pago</p>
        </div>
        <div className="select-none space-y-1.5 text-sm text-muted-foreground p-3">
          <p>→ Mapa de atenção dos primeiros 30 segundos</p>
          <p>→ Pontos de fricção na leitura do recrutador</p>
          <p>→ Mensagens involuntárias que o teu CV transmite</p>
        </div>
      </div>
    </div>
  );
};

export default RecruiterPerception;
