// CV Analyser v2 - Results Page - Build 2026-02-17
// Free report: ATS score, 4 quadrants, benchmarks, recruiter perception, SALARY IN BLUR
// Paid: Everything unlocked + normal curve + detailed analysis + action plan
// Payment: MB WAY + PayPal options
// Voucher: Code validation for multi-analysis plans via Supabase

import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import ATSRejectionBlock from "@/components/ATSRejectionBlock";
import QuadrantCard from "@/components/QuadrantCard";
import DimensionBar from "@/components/DimensionBar";
import ScoreGauge from "@/components/ScoreGauge";
import RecruiterPerception from "@/components/RecruiterPerception";
import LockedSection from "@/components/LockedSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Home as HomeIcon, FileCheck, Lock, TrendingUp, Euro, Info, BarChart3, Grid2x2, Eye, AlertTriangle, Bot, CreditCard, CheckCircle2, Mail, Ticket, Unlock, Target, Sparkles, Calendar } from "lucide-react";
import type { AnalysisData } from "@/types/analysis";

const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzE1MDQsImV4cCI6MjA1MjM0NzUwNH0.FJlZBzX4u1Xj5EvzjlRsYF0bnQ_Dn_LQsRbZEKhGQS0';

/* ─── Tooltip reusable ─── */
function Tooltip({ label, text }: { label: string; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 rounded-full hover:bg-muted transition-colors"
      >
        <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-[#C9A961] transition-colors" />
      </button>
      {show && (
        <div className="absolute left-0 top-6 z-50 w-72 p-3 rounded-lg bg-foreground text-background text-xs leading-relaxed shadow-xl">
          <p className="font-semibold mb-1">{label}</p>
          <p>{text}</p>
          <div className="absolute -top-1.5 left-3 w-3 h-3 bg-foreground rotate-45" />
        </div>
      )}
    </div>
  );
}

/* ─── Gold Icon wrapper (Share2Inspire style) ─── */
function GoldIcon({ children, size = "w-10 h-10" }: { children: React.ReactNode; size?: string }) {
  return (
    <div className={`${size} rounded-full border border-[#C9A961]/30 bg-[#C9A961]/5 flex items-center justify-center shrink-0`}>
      {children}
    </div>
  );
}

/* ─── Normal Curve SVG Component ─── */
function NormalCurveChart({ percentile }: { percentile: number }) {
  const width = 400;
  const height = 180;
  const padding = 30;
  const curveWidth = width - padding * 2;
  const curveHeight = height - padding * 2;

  const points = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const fillPoints = useMemo(() => {
    const pts: string[] = [`${padding},${padding + curveHeight}`];
    for (let i = 0; i <= 100; i++) {
      const x = padding + (i / 100) * curveWidth;
      const z = (i - 50) / 16.67;
      const y = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * z * z));
      pts.push(`${x},${y}`);
    }
    pts.push(`${padding + curveWidth},${padding + curveHeight}`);
    return pts.join(' ');
  }, [curveWidth, curveHeight]);

  const userX = padding + (percentile / 100) * curveWidth;
  const userZ = (percentile - 50) / 16.67;
  const userY = padding + curveHeight - (curveHeight * 0.95 * Math.exp(-0.5 * userZ * userZ));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-md mx-auto">
      <polygon points={fillPoints} fill="#C9A961" opacity="0.1" />
      <polyline points={points} fill="none" stroke="#C9A961" strokeWidth="2.5" />
      <line x1={userX} y1={userY} x2={userX} y2={padding + curveHeight} stroke="#C9A961" strokeWidth="2" strokeDasharray="4,4" />
      <circle cx={userX} cy={userY} r="6" fill="#C9A961" stroke="white" strokeWidth="2" />
      <text x={userX} y={userY - 14} textAnchor="middle" className="text-xs font-bold fill-[#C9A961]">
        Tu ({percentile}%)
      </text>
      <text x={padding} y={height - 5} textAnchor="start" className="text-[10px] fill-current text-muted-foreground">0%</text>
      <text x={padding + curveWidth / 2} y={height - 5} textAnchor="middle" className="text-[10px] fill-current text-muted-foreground">Média</text>
      <text x={padding + curveWidth} y={height - 5} textAnchor="end" className="text-[10px] fill-current text-muted-foreground">100%</text>
      <line x1={padding} y1={padding + curveHeight} x2={padding + curveWidth} y2={padding + curveHeight} stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/* ─── Salary Block ─── */
function SalaryBlock({ blurred, salaryDetailed, perceivedSeniority }: { blurred: boolean; salaryDetailed?: any; perceivedSeniority?: string }) {
  const sd = salaryDetailed || { percentile25: 1400, median: 1800, percentile75: 2400, topMax: 3200, benefits: [], benefitsNote: '', source: '' };
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Euro className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">ESTIMATIVA SALARIAL</p>
            <Tooltip
              label="Como é calculada a estimativa?"
              text="Estimativa baseada no perfil profissional detectado, nível de senioridade, competências identificadas e dados salariais do mercado português (Hays, Michael Page, Mercer). Os valores são indicativos e podem variar conforme a região, setor e dimensão da empresa."
            />
          </div>
          <p className="text-xs text-muted-foreground">Com base no perfil ({perceivedSeniority || 'N/D'}) e mercado português</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-8 h-8 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">Desbloqueia para ver o valor exacto</p>
            <p className="text-xs text-muted-foreground mt-1">Disponível no relatório completo</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">Percentil 25</p>
              <p className="text-xl font-bold text-foreground">€{sd.percentile25.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">/mês (bruto)</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-[10px] text-muted-foreground mb-1">Mediana</p>
              <p className="text-xl font-bold text-[#C9A961]">€{sd.median.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">/mês (bruto)</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-1">Percentil 75</p>
              <p className="text-xl font-bold text-foreground">€{sd.percentile75.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">/mês (bruto)</p>
            </div>
            <div className="text-center p-3 bg-green-500/5 rounded-lg border border-green-500/20">
              <p className="text-[10px] text-muted-foreground mb-1">Top (Perfis de Topo)</p>
              <p className="text-xl font-bold text-green-600">€{sd.topMax.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">/mês (bruto)</p>
            </div>
          </div>

          {/* Benefits section - only when paid */}
          {!blurred && sd.benefits && sd.benefits.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-foreground mb-3">Benefícios típicos para {perceivedSeniority || 'este nível'} na indústria:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sd.benefits.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-[#C9A961] mt-0.5 shrink-0">✓</span>
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              {sd.benefitsNote && (
                <p className="text-xs text-muted-foreground mt-3 italic">{sd.benefitsNote}</p>
              )}
              {sd.source && (
                <p className="text-[10px] text-muted-foreground/60 mt-2">Fonte: {sd.source}</p>
              )}
            </div>
          )}

          {blurred && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Valores estimados com base em dados do mercado português para o teu perfil
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Automation Risk ─── */
function AutomationRiskBlock({ blurred, automationRisk }: { blurred: boolean; automationRisk?: any }) {
  const ar = automationRisk || { percentage: 35, level: 'Médio', description: 'Análise detalhada do risco de automação para o teu perfil', recommendations: [] };
  const barColor = ar.percentage <= 25 ? 'from-green-400 to-green-500' : ar.percentage <= 50 ? 'from-yellow-400 to-orange-400' : 'from-orange-400 to-red-500';
  const levelColor = ar.percentage <= 25 ? 'text-green-600 bg-green-500/10' : ar.percentage <= 50 ? 'text-yellow-600 bg-yellow-500/10' : 'text-red-600 bg-red-500/10';
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GoldIcon>
          <Bot className="w-5 h-5 text-[#C9A961]" />
        </GoldIcon>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground">POTENCIAL DE SUBSTITUIÇÃO POR IA</p>
            <Tooltip
              label="O que é o Potencial de Automação?"
              text="Estimativa da probabilidade de as tarefas associadas ao teu perfil profissional serem automatizadas por IA ou robótica nos próximos 5-10 anos. Quanto MAIOR o valor, MAIOR o risco."
            />
          </div>
          <p className="text-xs text-muted-foreground">Risco de automação da tua função nos próximos 5-10 anos</p>
        </div>
      </div>

      <div className="relative">
        {blurred && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
            <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
            <p className="text-sm font-semibold text-foreground">Disponível no relatório completo</p>
            <p className="text-xs text-muted-foreground mt-1">Descobre o risco de automação da tua função</p>
          </div>
        )}
        <div className={blurred ? 'select-none' : ''}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Baixo risco</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${levelColor}`}>{ar.level} — {ar.percentage}%</span>
              </div>
              <span className="text-xs text-muted-foreground">Alto risco</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`} style={{ width: `${ar.percentage}%` }} />
            </div>
            {!blurred && (
              <>
                <p className="text-sm text-muted-foreground">{ar.description}</p>
                {ar.recommendations && ar.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">Recomendações para mitigar o risco:</p>
                    {ar.recommendations.map((r: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground flex items-start gap-2 mb-1">
                        <span className="text-[#C9A961] shrink-0">→</span> {r}
                      </p>
                    ))}
                  </div>
                )}
              </>
            )}
            {blurred && <p className="text-sm text-muted-foreground">→ Análise detalhada do risco de automação para o teu perfil</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PayPal SVG Icon ─── */
function PayPalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
    </svg>
  );
}

export default function Results() {
  const [, setLocation] = useLocation();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'confirm' | 'payment' | 'polling' | 'success'>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<'mbway' | 'paypal'>('mbway');
  const [pollingMessage, setPollingMessage] = useState('A aguardar aprovação no MB WAY...');
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; analyses: number }>({
    name: 'Essencial',
    price: '2,99',
    analyses: 1,
  });
  
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);

  // PDF email state
  const [pdfEmailSending, setPdfEmailSending] = useState(false);
  const [pdfEmailSent, setPdfEmailSent] = useState(false);
  const [pdfEmail, setPdfEmail] = useState("");

  useEffect(() => {
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
    
    // Check if already paid (from previous session)
    const paidStatus = sessionStorage.getItem('isPaid');
    if (paidStatus === 'true') {
      setIsPaid(true);
    }
  }, [setLocation]);

  const unlockFullReport = useCallback(() => {
    setIsPaid(true);
    sessionStorage.setItem('isPaid', 'true');
  }, []);

  const openPaymentModal = (plan?: { name: string; price: string; analyses: number }) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    
    // Clear old payment state to avoid checking expired payments
    sessionStorage.removeItem('orderId');
    sessionStorage.removeItem('requestId');
    sessionStorage.removeItem('paymentEmail');
    
    setShowPaymentModal(true);
    setPaymentStep('confirm');
    setPaymentError(null);
    setPollingMessage('A aguardar aprovação no MB WAY...');
  };

  const handleMBWayPayment = async () => {
    if (!email || !phone) {
      setPaymentError('Por favor, preenche todos os campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Por favor, introduz um email válido');
      return;
    }

    const phoneRegex = /^(9[1236]\d{7}|2\d{8})$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPaymentError('Por favor, introduz um número de telemóvel válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const analysisDataStr = sessionStorage.getItem('cvAnalysis');
      
      if (!analysisDataStr) {
        throw new Error('Dados do CV não encontrados');
      }

      const parsedAnalysis = JSON.parse(analysisDataStr);
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      const orderId = `CVA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/mbway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          phone: phone,
          orderId: orderId,
          amount: priceNum.toFixed(2),
          paymentMethod: 'mbway',
          description: `CV Analyser - ${selectedPlan.name}`,
          name: email.split('@')[0],
          analysisData: parsedAnalysis
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('[PAYMENT] Backend error:', data);
        throw new Error(data.error || 'Erro ao processar pagamento. Tenta novamente.');
      }
      
      sessionStorage.setItem('orderId', orderId);
      sessionStorage.setItem('paymentEmail', email);
      if (data.requestId) {
        sessionStorage.setItem('requestId', data.requestId);
      }
      
      // Move to polling step
      setPaymentStep('polling');
      setPollingMessage('Confirma o pagamento na app MB WAY do teu telemóvel...');
      startPolling(orderId);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!email) {
      setPaymentError('Por favor, introduz o teu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPaymentError('Por favor, introduz um email válido');
      return;
    }

    setLoading(true);
    setPaymentError(null);

    try {
      const priceNum = parseFloat(selectedPlan.price.replace(',', '.'));
      sessionStorage.setItem('paymentEmail', email);
      
      // Open PayPal.me directly
      window.open(`https://paypal.me/SamuelRolo/${priceNum}EUR`, '_blank');
      
      // For PayPal, we need manual confirmation - go to success step
      setPaymentStep('success');
    } catch (err) {
      setPaymentError('Erro ao abrir PayPal. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'mbway') {
      handleMBWayPayment();
    } else {
      handlePayPalPayment();
    }
  };

  const startPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 36; // 36 * 5s = 3 minutes max
    let consecutiveErrors = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(
          `https://share2inspire-beckend.lm.r.appspot.com/api/payment/check-payment-status`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          }
        );
        
        if (!response.ok) {
          consecutiveErrors++;
          console.warn(`[POLLING] Erro ${response.status} (tentativa ${attempts}/${maxAttempts})`);
          if (consecutiveErrors >= 5) {
            console.warn('[POLLING] 5 erros consecutivos, a parar polling');
            clearInterval(pollInterval);
            setPollingMessage('Não foi possível verificar o pagamento. Tenta novamente.');
          }
          return;
        }
        
        consecutiveErrors = 0;
        const data = await response.json();
        
        if (data.paid) {
          console.log('[POLLING] Pagamento confirmado!');
          clearInterval(pollInterval);
          
          // Create voucher in Supabase if multi-analysis plan
          if (selectedPlan.analyses > 1) {
            await createVoucher(email, selectedPlan, orderId);
          }
          
          // Unlock full report
          unlockFullReport();
          setPaymentStep('success');
          return;
        }
        
        if (data.expired) {
          console.warn('[POLLING] Pagamento expirado');
          clearInterval(pollInterval);
          setPollingMessage('O pagamento expirou. Tenta novamente.');
          return;
        }
        
        // Still pending
        if (data.message) {
          setPollingMessage(data.message);
        }
        
        if (attempts >= maxAttempts) {
          console.warn('[POLLING] Timeout atingido');
          clearInterval(pollInterval);
          setPollingMessage('Tempo esgotado. Se já aprovaste o pagamento, aguarda uns segundos e fecha esta janela — a análise será desbloqueada automaticamente.');
        }
      } catch (err) {
        console.error('Erro no polling:', err);
        consecutiveErrors++;
        if (consecutiveErrors >= 5) {
          clearInterval(pollInterval);
          setPollingMessage('Erro de ligação. Se já aprovaste o pagamento, aguarda uns segundos.');
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  // Create voucher in Supabase for multi-analysis plans
  const createVoucher = async (userEmail: string, plan: { name: string; price: string; analyses: number }, orderId: string) => {
    try {
      const code = `S2I-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          code: code,
          email: userEmail,
          plan_name: plan.name,
          total_analyses: plan.analyses,
          used_analyses: 1, // First analysis is used now
          amount_paid: parseFloat(plan.price.replace(',', '.')),
          order_id: orderId,
          payment_method: 'mbway'
        })
      });
      
      if (response.ok) {
        const [voucher] = await response.json();
        console.log('[VOUCHER] Criado:', voucher);
        // Store voucher code for display
        sessionStorage.setItem('voucherCode', code);
        sessionStorage.setItem('voucherRemaining', String(plan.analyses - 1));
        // Send voucher code by email automatically
        await sendVoucherEmail(userEmail, code, plan.name, plan.analyses);
      }
    } catch (err) {
      console.error('[VOUCHER] Erro ao criar:', err);
    }
  };

  // Validate voucher code
  const handleVoucherValidation = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Introduz um código de voucher');
      return;
    }

    setVoucherLoading(true);
    setVoucherError(null);
    setVoucherSuccess(null);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?code=eq.${encodeURIComponent(voucherCode.trim().toUpperCase())}&is_active=eq.true&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao verificar código');
      }

      const vouchers = await response.json();
      
      if (vouchers.length === 0) {
        setVoucherError('Código inválido ou já utilizado');
        return;
      }

      const voucher = vouchers[0];
      const remaining = voucher.total_analyses - voucher.used_analyses;

      if (remaining <= 0) {
        setVoucherError('Este código já não tem análises disponíveis');
        return;
      }

      // Use one analysis
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/vouchers?id=eq.${voucher.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            used_analyses: voucher.used_analyses + 1,
            is_active: remaining - 1 > 0,
            updated_at: new Date().toISOString()
          })
        }
      );

      if (updateResponse.ok) {
        setVoucherSuccess(`Código válido! Análise desbloqueada. Restam ${remaining - 1} análise(s).`);
        unlockFullReport();
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowVoucherModal(false);
          setVoucherCode("");
          setVoucherSuccess(null);
        }, 2500);
      } else {
        throw new Error('Erro ao utilizar código');
      }
    } catch (err) {
      setVoucherError(err instanceof Error ? err.message : 'Erro ao verificar código');
    } finally {
      setVoucherLoading(false);
    }
  };

  // Send PDF via email - generates PDF from screen capture and sends via backend
  const handleSendPdfEmail = async () => {
    const targetEmail = pdfEmail || email || sessionStorage.getItem('paymentEmail') || '';
    if (!targetEmail) {
      return;
    }
    
    setPdfEmailSending(true);
    
    try {
      // 1. Capture the analysis content as image using html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const mainContent = document.querySelector('main');
      if (!mainContent) throw new Error('Conteúdo não encontrado');
      
      const canvas = await html2canvas(mainContent as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 900,
      });
      
      // 2. Generate PDF from canvas
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // 3. Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];
      
      // 4. Send to backend
      const vCode = sessionStorage.getItem('voucherCode');
      const vRemaining = sessionStorage.getItem('voucherRemaining');
      
      const response = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          pdfBase64: pdfBase64,
          voucherCode: vCode || undefined,
          remainingAnalyses: vRemaining ? parseInt(vRemaining) : undefined,
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setPdfEmailSent(true);
      } else {
        throw new Error(data.error || 'Erro ao enviar email');
      }
    } catch (err) {
      console.error('Erro ao enviar PDF:', err);
      // Show error to user via alert since we don't have a dedicated error state
      alert('Erro ao enviar o relatório. Tenta novamente.');
    } finally {
      setPdfEmailSending(false);
    }
  };

  // Send voucher code by email after payment
  const sendVoucherEmail = async (userEmail: string, code: string, planName: string, totalAnalyses: number) => {
    try {
      await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/send-voucher-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userEmail.split('@')[0],
          voucherCode: code,
          planName: planName,
          totalAnalyses: totalAnalyses,
          remainingAnalyses: totalAnalyses - 1,
        })
      });
      console.log('[VOUCHER-EMAIL] Email de voucher enviado para:', userEmail);
    } catch (err) {
      console.error('[VOUCHER-EMAIL] Erro ao enviar email:', err);
    }
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A961]" />
      </div>
    );
  }

  const avgScore = analysisData.quadrants.reduce((sum, q) => sum + q.score, 0) / analysisData.quadrants.length;
  const percentile = Math.round(Math.min(95, Math.max(5, avgScore * 0.95)));
  const dimensions = analysisData.quadrants.map(q => ({ label: q.title, score: q.score, benchmark: q.benchmark }));
  const storedVoucherCode = sessionStorage.getItem('voucherCode');
  const storedVoucherRemaining = sessionStorage.getItem('voucherRemaining');

  return (
    <div className="min-h-screen bg-background">
      {/* Header - responsivo */}
      <header className="border-b border-foreground/10 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 bg-background/90 backdrop-blur-lg z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <GoldIcon size="w-6 h-6 sm:w-7 sm:h-7">
                <FileCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C9A961]" />
              </GoldIcon>
              <span className="text-sm sm:text-base font-semibold text-foreground">CV Analyser</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isPaid ? (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm font-semibold text-green-600">Relatório Completo</span>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => setShowVoucherModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm font-medium border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5"
                >
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Tenho código</span>
                  <span className="sm:hidden">Código</span>
                </Button>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">Desbloquear Análise Completa</span>
                  <span className="sm:hidden">Desbloquear</span>
                </Button>
              </>
            )}
            <a 
              href="https://www.share2inspire.pt" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm font-medium text-foreground"
            >
              <HomeIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Report Label */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isPaid ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Relatório Completo — Todas as secções desbloqueadas</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
              <span>Relatório Gratuito — Análise resumida do teu CV</span>
            </>
          )}
        </div>

        {/* Voucher info banner (if multi-analysis plan) */}
        {isPaid && storedVoucherCode && (
          <div className="bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              <div>
                <p className="text-sm font-semibold text-foreground">O teu código para futuras análises:</p>
                <p className="text-lg font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Análises restantes</p>
              <p className="text-2xl font-bold text-[#C9A961]">{storedVoucherRemaining}</p>
            </div>
          </div>
        )}

        {/* ═══ ATS Rejection ═══ */}
        <ATSRejectionBlock rejectionRate={analysisData.atsRejectionRate} topFactor={analysisData.atsTopFactor} isPaid={isPaid} detailedFactors={analysisData.detailedAtsAnalysis?.factors} atsSystems={analysisData.detailedAtsAnalysis?.atsSystems} quickFixes={analysisData.detailedAtsAnalysis?.quickFixes} />

        {/* ═══ 4 Quadrantes ═══ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <GoldIcon size="w-8 h-8">
              <Grid2x2 className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE POR QUADRANTE</p>
              <Tooltip
                label="O que são os Quadrantes?"
                text="O teu CV é avaliado em 4 dimensões independentes: Estrutura (organização visual), Conteúdo (qualidade do texto), Formação (apresentação académica) e Experiência (descrição profissional). Cada uma é comparada com o benchmark do mercado."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysisData.quadrants.map((q, i) => (
              <QuadrantCard
                key={i}
                title={q.title}
                score={q.score}
                benchmark={q.benchmark}
                insight={q.impactPhrase}
                strengths={q.strengths}
                weaknesses={q.weaknesses}
              />
            ))}
          </div>
        </div>

        {/* ═══ Factores de Avaliação ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-3">
            <GoldIcon>
              <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">FACTORES DE AVALIAÇÃO</p>
                <Tooltip
                  label="O que são os Factores de Avaliação?"
                  text="Representação visual de cada dimensão do CV em barra horizontal. A linha vertical indica o benchmark (média do mercado) para o mesmo nível de senioridade. Valores acima do benchmark são positivos."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cada factor é comparado com a média do mercado. A linha vertical na barra indica o benchmark.</p>
            </div>
          </div>
          <div className="space-y-5">
            {analysisData.quadrants.map((q, i) => (
              <DimensionBar key={i} label={q.title} score={q.score} benchmark={q.benchmark} insight={q.impactPhrase} />
            ))}
          </div>
          <div className="pt-4 border-t border-border">
            <div className="relative">
              <p className="text-sm text-muted-foreground mb-2">
                → O teu CV está {avgScore >= 70 ? 'acima' : 'abaixo'} da média global do mercado ({Math.round(avgScore)} vs 69)
              </p>
              {!isPaid && (
                <div className="relative">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                    <Button
                      onClick={() => openPaymentModal()}
                      size="sm"
                      className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                    >
                      Ver Análise Detalhada por Dimensão
                    </Button>
                  </div>
                  <div className="select-none space-y-1 text-sm text-muted-foreground">
                    <p>→ Análise cruzada entre dimensões e impacto no score global</p>
                    <p>→ Recomendações específicas para cada dimensão</p>
                    <p>→ Comparação com perfis do mesmo nível de senioridade</p>
                  </div>
                </div>
              )}
              {isPaid && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>→ Análise cruzada entre dimensões e impacto no score global</p>
                  <p>→ Recomendações específicas para cada dimensão</p>
                  <p>→ Comparação com perfis do mesmo nível de senioridade</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Compatibilidade ATS ═══ */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <AlertTriangle className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">COMPATIBILIDADE ATS</p>
                <Tooltip
                  label="O que é a Compatibilidade ATS?"
                  text="Applicant Tracking System — software usado por 75% das empresas para filtrar CVs automaticamente. Este score indica a probabilidade do teu CV passar esses filtros. Quanto maior, melhor."
                />
              </div>
              <p className="text-xs text-muted-foreground">Probabilidade do teu CV passar filtros automáticos</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={100 - analysisData.atsRejectionRate} size={160} strokeWidth={8} />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              O teu CV tem <span className="font-semibold text-foreground">{100 - analysisData.atsRejectionRate}%</span> de compatibilidade com sistemas ATS. {100 - analysisData.atsRejectionRate >= 70 ? 'Boa compatibilidade.' : 'Vê o relatório completo para saber como melhorar.'}
            </p>
          </div>
        </div>

        {/* ═══ Percepção do Recrutador ═══ */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <GoldIcon size="w-8 h-8">
              <Eye className="w-4 h-4 text-[#C9A961]" />
            </GoldIcon>
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">PERCEPÇÃO DO RECRUTADOR</p>
              <Tooltip
                label="O que é a Percepção do Recrutador?"
                text="Simulação do que um recrutador retém do teu CV nos primeiros 5-10 segundos de leitura. Inclui o perfil profissional percebido, nível de senioridade e competências-chave identificadas."
              />
            </div>
          </div>
          <RecruiterPerception isPaid={isPaid} roles={analysisData.keywords} perceivedRole={analysisData.perceivedRole} perceivedSeniority={analysisData.perceivedSeniority} deepAnalysis={analysisData.recruiterDeepAnalysis} />
        </div>

        {/* ═══ Salary ═══ */}
        <SalaryBlock blurred={!isPaid} salaryDetailed={analysisData.salaryDetailed} perceivedSeniority={analysisData.perceivedSeniority} />

        {/* ═══ Normal Curve ═══ */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <GoldIcon>
              <TrendingUp className="w-5 h-5 text-[#C9A961]" />
            </GoldIcon>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">POSICIONAMENTO NO MERCADO</p>
                <Tooltip
                  label="O que é a Curva Normal?"
                  text="Distribuição estatística que mostra onde o teu CV se posiciona face a todos os CVs analisados na nossa plataforma. O percentil indica a percentagem de CVs que o teu supera."
                />
              </div>
              <p className="text-xs text-muted-foreground">Curva normal — onde te posicionas face a outros candidatos</p>
            </div>
          </div>

          {/* Values VISIBLE */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Percentil</p>
              <p className="text-xl font-bold text-foreground">{percentile}%</p>
            </div>
            <div className="text-center p-3 bg-[#C9A961]/10 rounded-lg border border-[#C9A961]/20">
              <p className="text-xs text-muted-foreground">Posição</p>
              <p className="text-xl font-bold text-[#C9A961]">Top {100 - percentile}%</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Score Global</p>
              <p className="text-xl font-bold text-foreground">{Math.round(avgScore)}/100</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            → Estás no <span className="font-semibold text-foreground">percentil {percentile}</span>, o que significa que o teu CV é melhor que {percentile}% dos CVs analisados no mercado.
          </p>

          {/* Interpretação detalhada quando pago */}
          {isPaid && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Interpretação do teu posicionamento:</p>
              <p className="text-sm text-muted-foreground">
                {percentile >= 90 ? (
                  <>O teu CV está no <strong className="text-foreground">top {100 - percentile}%</strong> dos candidatos analisados. Isto coloca-te numa posição de excelência — num processo com 100 candidatos, o teu CV seria melhor que {percentile} deles. O teu perfil destaca-se pela qualidade da estrutura, conteúdo e apresentação. Mantém este nível e foca-te em personalizar o CV para cada candidatura específica.</>
                ) : percentile >= 75 ? (
                  <>Com um score no <strong className="text-foreground">percentil {percentile}</strong>, o teu CV posiciona-se acima da grande maioria dos candidatos. Num processo com 100 candidatos, superarias {percentile} deles. Estás a {90 - percentile} pontos percentuais do top 10% — pequenos ajustes nas áreas identificadas podem fazer a diferença para atingir a excelência.</>
                ) : percentile >= 50 ? (
                  <>O teu CV está no <strong className="text-foreground">percentil {percentile}</strong>, acima da média mas com margem significativa de melhoria. Num processo competitivo, poderias perder para candidatos com CVs mais optimizados. Foca-te nas dimensões com score mais baixo para subir rapidamente de posição.</>
                ) : (
                  <>O teu CV está no <strong className="text-foreground">percentil {percentile}</strong>, abaixo da média do mercado. Isto significa que {100 - percentile}% dos CVs analisados são mais competitivos. A boa notícia é que há muito espaço para melhoria — segue as recomendações abaixo para subir significativamente o teu posicionamento.</>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                → Para subir para o próximo nível, precisas de aumentar o score global em aproximadamente <strong className="text-foreground">{percentile >= 90 ? '2-3' : percentile >= 75 ? '5-8' : '10-15'} pontos</strong>.
              </p>
            </div>
          )}

          {/* Chart - blurred if not paid */}
          <div className="relative">
            {!isPaid && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
                <Lock className="w-6 h-6 text-[#C9A961] mb-2" />
                <p className="text-sm font-semibold text-foreground">Gráfico completo no Relatório Pago</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Vê a curva de distribuição e a tua posição exacta</p>
                <Button
                  onClick={() => openPaymentModal()}
                  size="sm"
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white"
                >
                  Desbloquear por €2,99
                </Button>
              </div>
            )}
            <div className={!isPaid ? 'select-none' : ''}>
              <NormalCurveChart percentile={percentile} />
            </div>
          </div>
        </div>

        {/* ═══ Potencial de Automação ═══ */}
        <AutomationRiskBlock blurred={!isPaid} automationRisk={analysisData.automationRisk} />

        {/* ═══ Matriz de Oportunidades ═══ */}
        {!isPaid ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground">MATRIZ DE OPORTUNIDADES — RELATÓRIO COMPLETO</p>
              <p className="text-xs text-muted-foreground mt-1">O relatório completo inclui estas 4 secções detalhadas. Aqui podes ver o que cada uma cobre.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LockedSection
                title="Análise detalhada por quadrante"
                visibleHint="Breakdown completo de cada dimensão com pontos fortes e fracos identificados."
                previewItems={["Estrutura visual e hierarquia de informação", "Alinhamento entre competências e função-alvo", "Keywords e compatibilidade com filtros ATS", "Posicionamento face ao mercado"]}
              />
              <LockedSection
                title="Comparação com perfis top 25%"
                visibleHint="Vê como o teu CV se compara com os melhores do teu setor."
                previewItems={["Benchmark contra os melhores CVs do setor", "Competências diferenciadoras em falta", "Posicionamento face a concorrentes", "Gap analysis com recomendações"]}
              />
              <LockedSection
                title="Recomendações específicas (15+)"
                visibleHint="Mais de 15 micro-insights com acções concretas para melhorar o teu CV."
                previewItems={["Reescrita otimizada do resumo profissional", "Reformulação com métricas de impacto", "Otimização de keywords para ATS", "Sugestões de formatação visual"]}
              />
              <LockedSection
                title="Plano de acção (30 dias)"
                visibleHint="Plano estruturado com 3-5 acções prioritárias e timeline de implementação."
                previewItems={["3-5 acções prioritárias ordenadas", "Timeline de implementação", "Checklist de melhorias rápidas", "Estratégia de candidatura"]}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ═══ Análise Detalhada por Dimensão ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <BarChart3 className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">ANÁLISE DETALHADA POR DIMENSÃO</p>
              </div>
              <div className="space-y-4">
                {dimensions.map((dim: any) => {
                  const gap = dim.score - dim.benchmark;
                  const isStrong = gap >= 10;
                  const isWeak = gap <= 0;
                  return (
                    <div key={dim.label} className="p-3 bg-muted/20 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{dim.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{dim.score}/100</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isStrong ? 'text-green-600 bg-green-500/10' : isWeak ? 'text-red-600 bg-red-500/10' : 'text-yellow-600 bg-yellow-500/10'}`}>
                            {gap >= 0 ? '+' : ''}{gap} vs benchmark
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isStrong ? (
                          <>✅ <strong>Ponto forte.</strong> Estás {gap} pontos acima do benchmark ({dim.benchmark}). Esta dimensão contribui positivamente para o teu posicionamento global.</>
                        ) : isWeak ? (
                          <>⚠️ <strong>Área de melhoria.</strong> Estás {Math.abs(gap)} pontos abaixo do benchmark ({dim.benchmark}). Melhorar esta dimensão terá impacto directo no teu score global.</>
                        ) : (
                          <>→ <strong>Acima da média.</strong> Estás {gap} pontos acima do benchmark ({dim.benchmark}). Mantém e procura optimizar para chegar ao top.</>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ Matriz de Prioridades ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Target className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">MATRIZ DE PRIORIDADES</p>
              </div>
              <p className="text-sm text-muted-foreground">Dimensões ordenadas por urgência de melhoria (maior gap = maior prioridade):</p>
              <div className="space-y-2">
                {[...dimensions].sort((a: any, b: any) => (a.score - a.benchmark) - (b.score - b.benchmark)).map((dim: any, i: number) => {
                  const gap = dim.score - dim.benchmark;
                  const priority = gap <= 0 ? 'Alta' : gap <= 10 ? 'Média' : 'Baixa';
                  const prColor = priority === 'Alta' ? 'bg-red-500/10 text-red-600 border-red-500/20' : priority === 'Média' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20';
                  return (
                    <div key={dim.label} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <span className="text-sm font-medium text-foreground">{dim.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{dim.score}/{dim.benchmark}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${prColor}`}>{priority}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══ Acções de Melhoria com Antes/Depois ═══ */}
            {analysisData.improvementActions && analysisData.improvementActions.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GoldIcon size="w-8 h-8">
                    <Sparkles className="w-4 h-4 text-[#C9A961]" />
                  </GoldIcon>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground">ACÇÕES DE MELHORIA — ANTES vs DEPOIS</p>
                </div>
                <p className="text-sm text-muted-foreground">Acções concretas para melhorar o teu CV, com o impacto estimado de cada uma:</p>
                <div className="space-y-4">
                  {analysisData.improvementActions.map((action: any, i: number) => (
                    <div key={i} className="border border-border rounded-lg overflow-hidden">
                      <div className="p-3 bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">#{i + 1}</span>
                          <span className="text-sm font-semibold text-foreground">{action.action}</span>
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded">+{action.impact} pontos</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-red-500 mb-1">❌ ANTES</p>
                          <p className="text-sm text-muted-foreground">{action.before}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[10px] font-semibold text-green-600 mb-1">✅ DEPOIS</p>
                          <p className="text-sm text-muted-foreground">{action.after}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#C9A961]/5 rounded-lg border border-[#C9A961]/20">
                  <p className="text-sm text-foreground font-medium">
                    🎯 Score estimado após melhorias: <strong className="text-[#C9A961]">{Math.min(100, Math.round(avgScore) + (analysisData.improvementActions?.reduce((sum: number, a: any) => sum + (a.impact || 0), 0) || 0))}/100</strong>
                  </p>
                </div>
              </div>
            )}

            {/* ═══ Plano de Acção 30 Dias ═══ */}
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <GoldIcon size="w-8 h-8">
                  <Calendar className="w-4 h-4 text-[#C9A961]" />
                </GoldIcon>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground">PLANO DE ACÇÃO — 30 DIAS</p>
              </div>
              <div className="space-y-3">
                {[
                  { week: 'Semana 1-2', title: 'Optimização de Conteúdo', tasks: ['Reescrever resumo profissional com métricas de impacto', 'Adicionar resultados quantificáveis a cada experiência', 'Alinhar keywords com as funções-alvo'] },
                  { week: 'Semana 3', title: 'Estrutura e Formatação', tasks: ['Optimizar hierarquia visual e espaçamento', 'Garantir compatibilidade ATS (formato, fontes, secções)', 'Adicionar secções em falta (certificações, idiomas, etc.)'] },
                  { week: 'Semana 4', title: 'Validação e Ajustes', tasks: ['Pedir feedback a 2-3 profissionais da área', 'Testar em diferentes sistemas ATS', 'Personalizar versões para candidaturas específicas'] },
                ].map((phase, i) => (
                  <div key={i} className="p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#C9A961] bg-[#C9A961]/10 px-2 py-0.5 rounded">{phase.week}</span>
                      <span className="text-sm font-semibold text-foreground">{phase.title}</span>
                    </div>
                    {phase.tasks.map((task, j) => (
                      <p key={j} className="text-sm text-muted-foreground ml-4 flex items-start gap-2 mb-1">
                        <span className="text-muted-foreground/50 shrink-0">○</span> {task}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Send PDF by Email (only when paid) ═══ */}
        {isPaid && (
          <div className="bg-card border-2 border-green-500/20 rounded-2xl p-8 space-y-5">
            <div className="flex items-center gap-3">
              <GoldIcon>
                <Mail className="w-5 h-5 text-[#C9A961]" />
              </GoldIcon>
              <div>
                <p className="text-base font-semibold text-foreground">Receber Relatório em PDF por Email</p>
                <p className="text-xs text-muted-foreground">Envia o relatório completo em PDF para o teu email</p>
              </div>
            </div>
            
            {pdfEmailSent ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-green-600">Relatório enviado! Verifica a tua caixa de email (e spam).</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="email"
                  value={pdfEmail || email || sessionStorage.getItem('paymentEmail') || ''}
                  onChange={(e) => setPdfEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
                <Button
                  onClick={handleSendPdfEmail}
                  disabled={pdfEmailSending}
                  className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-6"
                >
                  {pdfEmailSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Enviar PDF
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Pricing CTA (only when NOT paid) ═══ */}
        {!isPaid && (
          <div className="bg-card border-2 border-[#C9A961]/30 rounded-2xl p-8 text-center space-y-5">
            <p className="text-xs font-semibold tracking-wider text-[#C9A961]">DESBLOQUEAR ANÁLISE COMPLETA</p>
            <p className="text-5xl font-bold text-foreground">2,99 €</p>
            <p className="text-sm text-muted-foreground">Acesso imediato a todas as secções</p>
            <div className="space-y-2 text-sm text-muted-foreground max-w-sm mx-auto">
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Diagnóstico detalhado por quadrante</p>
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Curva normal de posicionamento</p>
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Estimativa salarial detalhada</p>
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Potencial de automação da função</p>
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> 15+ recomendações personalizadas</p>
              <p className="flex items-center gap-2 justify-center"><span className="text-[#C9A961]">✓</span> Plano de acção de 30 dias</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Button
                onClick={() => openPaymentModal()}
                className="bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold px-10 py-3 text-base"
              >
                Desbloquear Análise Completa
              </Button>
              <Button
                onClick={() => setShowVoucherModal(true)}
                variant="outline"
                className="border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/5"
              >
                <Ticket className="w-4 h-4 mr-1.5" />
                Tenho um código
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Pagamento seguro via MB WAY ou PayPal</p>
          </div>
        )}
      </main>

      {/* ═══ Payment Modal ═══ */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {paymentStep === 'confirm' && 'Confirmar Pacote'}
              {paymentStep === 'payment' && 'Dados de Pagamento'}
              {paymentStep === 'polling' && 'A aguardar pagamento'}
              {paymentStep === 'success' && (isPaid ? 'Análise Desbloqueada!' : 'Pagamento Iniciado')}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1: Choose Plan & Confirm */}
          {paymentStep === 'confirm' && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Escolhe o teu pacote:</p>
                <div className="space-y-2">
                  {[
                    { name: 'Essencial', price: '2,99', analyses: 1, perUnit: '2,99' },
                    { name: 'Profissional', price: '6,99', analyses: 3, perUnit: '2,33' },
                    { name: 'Premium', price: '9,99', analyses: 5, perUnit: '2,00' },
                  ].map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedPlan.name === plan.name
                          ? 'border-[#C9A961] bg-[#C9A961]/5'
                          : 'border-border hover:border-[#C9A961]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedPlan.name === plan.name ? 'border-[#C9A961]' : 'border-muted-foreground/40'
                          }`}>
                            {selectedPlan.name === plan.name && (
                              <div className="w-2 h-2 rounded-full bg-[#C9A961]" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{plan.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {plan.analyses} {plan.analyses === 1 ? 'análise' : 'análises'}
                            </span>
                            {plan.name === 'Profissional' && (
                              <span className="ml-2 text-[10px] font-bold bg-[#C9A961] text-white px-1.5 py-0.5 rounded">POPULAR</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#C9A961]">€{plan.price}</span>
                          {plan.analyses > 1 && (
                            <p className="text-[10px] text-muted-foreground">€{plan.perUnit}/análise</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground border-t border-border pt-4">
                <p className="text-xs font-semibold text-foreground mb-2">Cada análise inclui:</p>
                <p>→ Todas as secções desbloqueadas no ecrã</p>
                <p>→ Curva normal de posicionamento</p>
                <p>→ Estimativa salarial detalhada</p>
                <p>→ Potencial de automação da função</p>
                <p>→ 15+ recomendações personalizadas</p>
                <p>→ Opção de enviar relatório PDF por email</p>
                {selectedPlan.analyses > 1 && (
                  <p className="text-[#C9A961] font-medium mt-2">→ Recebes um código para usar nas próximas {selectedPlan.analyses - 1} análises</p>
                )}
              </div>

              <Button
                onClick={() => setPaymentStep('payment')}
                className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
              >
                Continuar para Pagamento — €{selectedPlan.price}
              </Button>
            </div>
          )}

          {/* Step 2: Payment */}
          {paymentStep === 'payment' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Método de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('mbway')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'mbway'
                        ? 'border-[#C9A961] bg-[#C9A961]/5'
                        : 'border-border hover:border-[#C9A961]/30'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-[#C9A961]" />
                    <span className="text-sm font-semibold text-foreground">MB WAY</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === 'paypal'
                        ? 'border-[#0070BA] bg-[#0070BA]/5'
                        : 'border-border hover:border-[#0070BA]/30'
                    }`}
                  >
                    <PayPalIcon className="w-6 h-6 text-[#0070BA]" />
                    <span className="text-sm font-semibold text-foreground">PayPal</span>
                  </button>
                </div>
              </div>

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

              {paymentMethod === 'mbway' && (
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
              )}

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500">{paymentError}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-bold text-foreground">€{selectedPlan.price}</span>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full font-semibold ${
                    paymentMethod === 'paypal'
                      ? 'bg-[#0070BA] hover:bg-[#005EA6] text-white'
                      : 'bg-[#C9A961] hover:bg-[#A88B4E] text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      A processar...
                    </>
                  ) : paymentMethod === 'mbway' ? (
                    'Pagar com MB WAY'
                  ) : (
                    <>
                      <PayPalIcon className="w-4 h-4 mr-2" />
                      Pagar com PayPal
                    </>
                  )}
                </Button>
                <button
                  onClick={() => setPaymentStep('confirm')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Polling (MB WAY only) */}
          {paymentStep === 'polling' && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-[#C9A961]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Pedido enviado para MB WAY</h3>
                <p className="text-sm text-muted-foreground">
                  Abre a app MB WAY no teu telemóvel e aprova o pagamento de <span className="font-semibold text-foreground">€{selectedPlan.price}</span>.
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A961]" />
                  <span className="text-sm text-muted-foreground">{pollingMessage}</span>
                </div>
              </div>
              <Button
                onClick={() => setShowPaymentModal(false)}
                variant="outline"
                className="w-full"
              >
                Fechar (o pagamento continua a ser verificado)
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {paymentStep === 'success' && (
            <div className="space-y-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                {isPaid ? (
                  <Unlock className="w-8 h-8 text-green-500" />
                ) : (
                  <FileCheck className="w-8 h-8 text-[#C9A961]" />
                )}
              </div>
              <div className="space-y-2">
                {isPaid ? (
                  <>
                    <h3 className="text-lg font-bold text-green-600">Análise Completa Desbloqueada!</h3>
                    <p className="text-sm text-muted-foreground">
                      Todas as secções foram desbloqueadas. Faz scroll para ver a análise completa.
                    </p>
                    {storedVoucherCode && (
                      <div className="mt-4 p-4 bg-[#C9A961]/5 border border-[#C9A961]/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">O teu código para futuras análises:</p>
                        <p className="text-xl font-mono font-bold text-[#C9A961]">{storedVoucherCode}</p>
                        <p className="text-xs text-muted-foreground mt-1">Restam {storedVoucherRemaining} análise(s)</p>
                      </div>
                    )}
                  </>
                ) : paymentMethod === 'paypal' ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground">Pagamento PayPal</h3>
                    <p className="text-sm text-muted-foreground">
                      Completa o pagamento na janela do PayPal. Após confirmação, a análise será desbloqueada manualmente em até 24h.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Para confirmação imediata, usa MB WAY.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground">Pagamento em processamento</h3>
                    <p className="text-sm text-muted-foreground">
                      O pagamento está a ser verificado. A análise será desbloqueada automaticamente.
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={() => setShowPaymentModal(false)}
                className={isPaid ? "w-full bg-green-600 hover:bg-green-700 text-white font-semibold" : "w-full"}
                variant={isPaid ? "default" : "outline"}
              >
                {isPaid ? 'Ver Análise Completa' : 'Fechar'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Voucher Modal ═══ */}
      <Dialog open={showVoucherModal} onOpenChange={setShowVoucherModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#C9A961]" />
              Inserir Código
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Se compraste um pacote com múltiplas análises, introduz o código que recebeste para desbloquear esta análise.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="S2I-XXXXXX"
                className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground text-center text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-[#C9A961] uppercase"
              />
            </div>

            {voucherError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-500">{voucherError}</p>
              </div>
            )}

            {voucherSuccess && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600">{voucherSuccess}</p>
              </div>
            )}

            <Button
              onClick={handleVoucherValidation}
              disabled={voucherLoading || !voucherCode.trim()}
              className="w-full bg-[#C9A961] hover:bg-[#A88B4E] text-white font-semibold"
            >
              {voucherLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A validar...
                </>
              ) : (
                'Validar Código'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
