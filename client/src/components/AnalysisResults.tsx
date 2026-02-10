import QuadrantCard from "./QuadrantCard";
import ATSRejectionBlock from "./ATSRejectionBlock";
import RecruiterPerception from "./RecruiterPerception";
import LockedSection from "./LockedSection";
import DimensionBar from "./DimensionBar";
import ScoreGauge from "./ScoreGauge";
import type { AnalysisData } from "@/types/analysis";

const AnalysisResults = ({ data }: { data: AnalysisData }) => {
  return (
    <div className="min-h-screen dark-section">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">S2</span>
            </div>
            <span className="font-display font-semibold text-sm">Share2Inspire</span>
          </div>
          <button className="bg-card-foreground text-card text-xs font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            Obter Relatório Completo
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* ATS Rejection - above the fold */}
        <ATSRejectionBlock rejectionRate={data.atsRejectionRate} />

        {/* Four Quadrants */}
        <div>
          <p className="section-label text-foreground/50 mb-4">ANÁLISE POR QUADRANTE</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.quadrants.map((q: any, i: number) => (
              <QuadrantCard
                key={i}
                title={q.title}
                score={q.score}
                benchmark={q.benchmark}
                insight={q.impactPhrase}
              />
            ))}
          </div>
        </div>

        {/* Dimension Bars */}
        <div className="result-card p-6 space-y-4">
          <p className="section-label">ANÁLISE POR DIMENSÃO</p>
          <DimensionBar label="Estrutura" score={62} benchmark={74} />
          <DimensionBar label="Conteúdo" score={75} benchmark={71} />
          <DimensionBar label="Formação" score={70} />
          <DimensionBar label="Experiência" score={58} benchmark={69} />
        </div>

        {/* ATS Compatibility Gauge */}
        <div className="result-card p-8 flex flex-col items-center gap-2">
          <p className="section-label">COMPATIBILIDADE ATS</p>
          <ScoreGauge score={48} size={160} strokeWidth={8} />
        </div>

        {/* Recruiter Perception */}
        <RecruiterPerception roles={data.keywords} />

        {/* Locked Sections */}
        <div className="space-y-4">
          <p className="section-label text-foreground/50">ANÁLISE DETALHADA</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LockedSection
              title="Análise detalhada por quadrante"
              previewItems={[
                "Estrutura visual e hierarquia de informação",
                "Alinhamento entre competências e função-alvo",
                "Keywords e compatibilidade com filtros ATS",
                "Posicionamento face ao mercado",
              ]}
            />
            <LockedSection
              title="Comparação com perfis top 25%"
              previewItems={[
                "Benchmark contra os melhores CVs do setor",
                "Competências diferenciadoras em falta",
                "Posicionamento face a concorrentes",
                "Gap analysis com recomendações",
              ]}
            />
            <LockedSection
              title="Sugestões de reescrita por secção"
              previewItems={[
                "Reescrita otimizada do resumo profissional",
                "Reformulação com métricas de impacto",
                "Otimização de keywords para ATS",
                "Sugestões de formatação visual",
              ]}
            />
            <LockedSection
              title="Simulação de leitura por recrutador"
              previewItems={[
                "Mapa de atenção dos primeiros 30 segundos",
                "Pontos de fricção na leitura",
                "Análise de mensagens involuntárias",
                "Recomendações de posicionamento",
              ]}
            />
          </div>
        </div>

        {/* Pricing CTA */}
        <div className="result-card p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Relatório Completo</p>
          <p className="text-4xl font-display font-bold text-card-foreground">2,99 €</p>
          <p className="text-xs text-muted-foreground">PDF enviado por email</p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>→ Diagnóstico detalhado</p>
            <p>→ Pontos fortes e fragilidades</p>
            <p>→ Recomendações acionáveis</p>
            <p>→ Plano de evolução</p>
          </div>
          <button className="bg-card-foreground text-card font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm mt-2">
            Obter Relatório Completo
          </button>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResults;
