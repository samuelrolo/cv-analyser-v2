import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Por favor, carregue um ficheiro PDF ou DOCX');
        setFile(null);
        return;
      }
      
      // Validate file size (max 5MB)
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
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64 = reader.result as string;
        const base64Content = base64.split(',')[1]; // Remove data:application/pdf;base64, prefix

        // Call Supabase Edge Function for free analysis
        const response = await fetch('https://fvwqkjwzqgvpjjqoqcxp.supabase.co/functions/v1/hyper-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2d3Framp3enFndnBqanFvcWN4cCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NjM4MjU2LCJleHAiOjIwNTAyMTQyNTZ9.eDuEYVqJKhR8uJZmCfRLiZxPLXrWrp9NlQQhRZCFOJ4'
          },
          body: JSON.stringify({
            task: 'analyze_cv_free',
            file_base64: base64Content,
            filename: file.name
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao analisar CV');
        }

        const data = await response.json();
        
        // Store analysis data, CV file and filename in sessionStorage
        sessionStorage.setItem('cvAnalysis', JSON.stringify(data));
        sessionStorage.setItem('cvFile', base64Content);
        sessionStorage.setItem('cvFilename', file.name);
        
        // Navigate to results page
        setLocation('/results');
      };

      reader.onerror = () => {
        setError('Erro ao ler o ficheiro');
        setLoading(false);
      };

    } catch (err) {
      setError('Erro ao analisar o CV. Por favor, tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/105354394/nPCrQxnqRnkcyVVr.png" 
              alt="Share2Inspire" 
              className="h-10 w-auto"
            />
            <span className="text-sm font-medium text-foreground">S2I</span>
          </div>
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
                A analisar...
              </>
            ) : (
              'Analisar CV Gratuitamente'
            )}
          </Button>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-sm font-medium text-foreground">Análise instantânea</p>
              <p className="text-xs text-muted-foreground">Resultados em 30 segundos</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <span className="text-xl">🤖</span>
              </div>
              <p className="text-sm font-medium text-foreground">Powered by AI</p>
              <p className="text-xs text-muted-foreground">Análise com Google Gemini</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#C9A961]/10 flex items-center justify-center mx-auto">
                <span className="text-xl">🔒</span>
              </div>
              <p className="text-sm font-medium text-foreground">100% Privado</p>
              <p className="text-xs text-muted-foreground">Os teus dados são seguros</p>
            </div>
          </div>
        </div>

        {/* What You Get */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-bold text-center text-foreground">
            O que inclui a análise gratuita?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Score ATS</h3>
              <p className="text-sm text-muted-foreground">
                Probabilidade de rejeição automática por sistemas de recrutamento
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">4 Quadrantes</h3>
              <p className="text-sm text-muted-foreground">
                Análise de estrutura, conteúdo, formação e experiência
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Benchmarks</h3>
              <p className="text-sm text-muted-foreground">
                Comparação com médias do mercado (com transparência de 50%)
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#C9A961]/10 flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Percepção</h3>
              <p className="text-sm text-muted-foreground">
                Como os recrutadores percecionam o teu perfil nos primeiros 5 segundos
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
