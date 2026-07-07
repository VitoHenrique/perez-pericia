"use client";

import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Scale, AlertCircle, Calendar, Clock, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PesquisaTjmsPage() {
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [nomeParte, setNomeParte] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/search/tjms?numeroProcesso=${encodeURIComponent(numeroProcesso)}&nomeParte=${encodeURIComponent(nomeParte)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar a pesquisa.');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Page Header */}
      <div>
        <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase flex items-center gap-2">
          <Scale className="w-5.5 h-5.5 text-primary" />
          Pesquisa de Processos TJMS & IA
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
          Prototipagem de automação eSAJ e análise inteligente de movimentações
        </p>
      </div>

      {/* Info Warning */}
      <div className="p-4 bg-primary/5 border border-primary/10 text-primary rounded-xl flex items-start gap-3 text-xs leading-relaxed font-semibold">
        <Sparkles className="w-5 h-5 shrink-0 text-primary" />
        <div>
          <span className="font-extrabold block">Estudo de Viabilidade (eSAJ TJMS)</span>
          <p className="text-muted-foreground mt-0.5 font-medium">
            Este painel demonstra a capacidade de integrar robôs de web scraping no portal eSAJ/TJMS com inteligência artificial para resumir despachos e extrair prazos cruciais de perícia.
          </p>
        </div>
      </div>

      {/* Search Card */}
      <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm p-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end text-xs font-semibold">
          <div className="md:col-span-2">
            <label className="block mb-1.5 text-foreground">Número do Processo (eSAJ)</label>
            <input
              type="text"
              placeholder="Ex: 0802315-44.2026.8.12.0001"
              value={numeroProcesso}
              onChange={(e) => setNumeroProcesso(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block mb-1.5 text-foreground">Nome da Parte</label>
            <input
              type="text"
              placeholder="Ex: Fernando Perez"
              value={nomeParte}
              onChange={(e) => setNomeParte(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background hover:opacity-90 disabled:opacity-50 text-xs font-bold py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Pesquisando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar TJMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs font-semibold">
          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results block */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left: General Info & Movements */}
            <div className="lg:col-span-2 space-y-6">
              {/* Process Card */}
              <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Dados Coletados via Crawler</span>
                  <h3 className="font-outfit text-sm font-extrabold text-foreground mt-0.5">
                    Processo {result.data.processo}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-muted-foreground">
                  <div>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground/75 block">Classe</span>
                    <span className="text-foreground font-medium block mt-0.5">{result.data.classe}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground/75 block">Assunto</span>
                    <span className="text-foreground font-medium block mt-0.5">{result.data.assunto}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground/75 block">Distribuição</span>
                    <span className="text-foreground font-medium block mt-0.5">{result.data.distribuicao}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground/75 block">Juiz da Causa</span>
                    <span className="text-foreground font-medium block mt-0.5">{result.data.juiz}</span>
                  </div>
                </div>

                {/* Parties list */}
                <div className="pt-3 border-t border-border/50 space-y-2">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-extrabold block">Partes do Processo</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.data.partes.map((p: any, idx: number) => (
                      <div key={idx} className="p-2 bg-background border border-border/50 rounded-lg flex items-center justify-between text-[11px]">
                        <span className="text-foreground font-bold">{p.nome}</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-muted/60 text-muted-foreground border rounded uppercase">
                          {p.papel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline (Movimentações) */}
              <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider border-b border-border/60 pb-3">
                  Histórico de Movimentações (eSAJ)
                </h3>

                <div className="relative pl-6 border-l border-border/80 space-y-5 py-2">
                  {result.data.movimentacoes.map((m: any, idx: number) => (
                    <div key={idx} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1.5 w-2 h-2 rounded-full bg-primary border-2 border-background ring-4 ring-primary/10"></span>
                      
                      <div className="flex items-center gap-1.5 text-muted-foreground font-bold mb-1">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{m.data}</span>
                      </div>
                      <p className="text-foreground leading-relaxed text-[11px] font-medium bg-background/30 p-2.5 border rounded-lg">
                        {m.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: IA Analysis Box */}
            <div className="space-y-6">
              {/* IA Box */}
              <div className="bg-primary/5 dark:bg-purple-950/10 border-2 border-primary/20 dark:border-primary/10 rounded-xl p-5 shadow-sm space-y-5 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                
                <div className="flex items-center gap-2 border-b border-primary/20 pb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4 fill-primary/10" />
                  </div>
                  <div>
                    <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Análise Inteligente (IA)</h3>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Gemini Engine</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-primary font-extrabold block">Resumo do Laudo/Demanda</span>
                  <p className="text-foreground text-[11px] leading-relaxed font-semibold bg-card/65 p-3.5 border border-border/80 rounded-lg">
                    {result.aiAnalysis.resumo_geral}
                  </p>
                </div>

                {/* Next steps */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-primary font-extrabold block">Próxima Ação Necessária</span>
                  <p className="text-foreground text-[11px] leading-relaxed font-semibold bg-card/65 p-3.5 border border-border/80 rounded-lg">
                    {result.aiAnalysis.proximo_passo}
                  </p>
                </div>

                {/* Deadlines Table */}
                <div className="space-y-2 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-primary font-extrabold block">Prazos e Alarmes Identificados</span>
                  <div className="space-y-2">
                    {result.aiAnalysis.prazos_estimados.map((p: any, idx: number) => (
                      <div key={idx} className="p-3 bg-card/75 border border-border/80 rounded-lg space-y-1.5 text-[11px] font-semibold">
                        <div className="flex items-center justify-between border-b border-border/40 pb-1 text-foreground">
                          <span>{p.acao}</span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-destructive/10 text-destructive border border-destructive/20 rounded uppercase animate-pulse">
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{p.prazo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tone/Details */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[9px] uppercase tracking-wider text-primary font-extrabold block">Análise de Clima Processual</span>
                  <p className="text-muted-foreground text-[10.5px] leading-relaxed font-semibold">
                    {result.aiAnalysis.analise_sentimento}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
