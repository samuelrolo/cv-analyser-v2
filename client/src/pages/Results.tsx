import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import ATSRejectionBlock from "@/components/ATSRejectionBlock";
import QuadrantCard from "@/components/QuadrantCard";
import DimensionBar from "@/components/DimensionBar";
import ScoreGauge from "@/components/ScoreGauge";
import RecruiterPerception from "@/components/RecruiterPerception";
import LockedSection from "@/components/LockedSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";

export default function Results() {
  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    // Load analysis data from sessionStorage
    const data = sessionStorage.getItem('cvAnalysis');
    if (!data) {
      setLocation('/');
      return;
    }
    
    try {
      setAnalysisData(JSON.parse(data));
    } catch (err) {
      console.error('Error parsing analysis data:', err);
      setLocation('/');
    }
  }, [setLocation]);

  const handlePayment = async () => {
    if (!email || !phone) {
      setPaymentError('Por favor, preencha todos os campos');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Por favor, introduza um email válido');
      return;
    }

    // Validate phone (Portuguese format)
    const phoneRegex = /^(9[1236]\d{7}|2\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPaymentError('Por favor, introduza um número de telemóvel válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      // Get CV file and analysis data from sessionStorage
      const cvFile = sessionStorage.getItem('cvFile');
      const cvFilename = sessionStorage.getItem('cvFilename') || 'CV.pdf';
      const analysisDataStr = sessionStorage.getItem('cvAnalysis');
      
      if (!cvFile || !analysisDataStr) {
        throw new Error('Dados do CV não encontrados');
      }

      const analysisData = JSON.parse(analysisDataStr);
      const orderId = `cv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Call Python backend to initiate payment
      const response = await fetch('https://share2inspire-cv-analyser.ew.r.appspot.com/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: email.split('@')[0],
          email: email,
          phone: phone,
          amount: 2.99,
          orderId: orderId,
          paymentMethod: 'mbway',
          description: 'CV Analyzer - Relatório Completo',
          cv_data: {
            base64: cvFile,
            filename: cvFilename
          },
          analysis_data: analysisData
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const data = await response.json();
      
      if (data.success) {
        // Store orderId for polling
        sessionStorage.setItem('orderId', orderId);
        
        // Show success and start polling
        alert('Pagamento iniciado! Verifique o seu telemóvel para aprovar o pagamento MB WAY.');
        setShowPaymentModal(false);
        
        // Start polling for payment status
        startPolling(orderId);
      } else {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (5 seconds interval)
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(
          `https://share2inspire-cv-analyser.ew.r.appspot.com/api/payment/check-payment-status?orderId=${orderId}`
        );
        
        if (!response.ok) {
          console.error('Erro ao verificar status do pagamento');
          return;
        }
        
        const data = await response.json();
        
        if (data.paid && data.delivered) {
          clearInterval(pollInterval);
          alert('Pagamento confirmado! O relatório foi enviado para o seu email.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          alert('O pagamento ainda não foi confirmado. Por favor verifique o seu email ou contacte-nos.');
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 5000); // Poll every 5 seconds
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/105354394/nPCrQxnqRnkcyVVr.png" 
                alt="Share2Inspire" 
                className="h-8 w-auto"
              />
              <span className="text-sm font-medium text-foreground">S2I</span>
            </div>
          </div>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-sm font-semibold px-5 py-2"
          >
            Obter Relatório Completo
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* ATS Rejection - above the fold */}
        <ATSRejectionBlock rejectionRate={analysisData.atsRejectionRate} />

        {/* Four Quadrants */}
        <div>
          <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-4">ANÁLISE POR QUADRANTE</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysisData.quadrants.map((q, i) => (
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

        {/* Dimension Bars - with 50% opacity benchmarks */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE POR DIMENSÃO</p>
          <div className="space-y-4 opacity-50">
            <DimensionBar label="Estrutura" score={62} benchmark={74} />
            <DimensionBar label="Conteúdo" score={75} benchmark={71} />
            <DimensionBar label="Formação" score={70} />
            <DimensionBar label="Experiência" score={58} benchmark={69} />
          </div>
          <div className="pt-4 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Desbloqueia o relatório completo para ver a análise detalhada por dimensão
            </p>
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
            >
              Ver Análise Completa
            </Button>
          </div>
        </div>

        {/* ATS Compatibility Gauge */}
        <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground">COMPATIBILIDADE ATS</p>
          <ScoreGauge score={48} size={160} strokeWidth={8} />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            O teu CV tem compatibilidade moderada com sistemas ATS. Vê o relatório completo para saber como melhorar.
          </p>
        </div>

        {/* Recruiter Perception */}
        <RecruiterPerception roles={analysisData.keywords} />

        {/* Locked Sections */}
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE DETALHADA</p>
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
        <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Relatório Completo</p>
          <p className="text-4xl font-bold text-foreground">2,99 €</p>
          <p className="text-xs text-muted-foreground">PDF profissional de 16 páginas enviado por email</p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>→ Diagnóstico detalhado por quadrante</p>
            <p>→ Comparação com top 25% do mercado</p>
            <p>→ Sugestões de reescrita secção a secção</p>
            <p>→ Simulação de leitura por recrutador</p>
            <p>→ Plano de ação personalizado</p>
          </div>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-8 py-3 text-base mt-4"
          >
            Obter Relatório Completo
          </Button>
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Obter Relatório Completo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Telemóvel (MB WAY)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="912345678"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              />
            </div>

            {paymentError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{paymentError}</p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Relatório PDF (16 páginas)</span>
                <span className="font-semibold text-foreground">2,99 €</span>
              </div>
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    A processar...
                  </>
                ) : (
                  'Pagar com MB WAY'
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Após aprovação do pagamento, receberá o relatório por email em poucos minutos
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
