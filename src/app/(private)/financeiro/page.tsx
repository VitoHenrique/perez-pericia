"use client";

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  ArrowUpRight, 
  TrendingDown, 
  Edit3,
  Filter,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

interface ProcessoInfo {
  numero_processo: string;
  vara_comarca: string;
  tipo_pericia: string;
  status: string;
}

interface Honorario {
  id: string;
  processo_id: string;
  valor_total: number;
  valor_recebido: number;
  status_pagamento: string;
  data_vencimento: string;
  processo: ProcessoInfo;
}

interface FinancialKPIS {
  totalPrevisto: number;
  totalRecebido: number;
  totalPendente: number;
}

export default function FinanceiroPage() {
  const { showAlert } = useModal();
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [kpis, setKpis] = useState<FinancialKPIS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isForbidden, setIsForbidden] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Payment State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [valRecebido, setValRecebido] = useState('');
  const [statusPag, setStatusPag] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchFinanceiroData();
  }, []);

  const fetchFinanceiroData = async () => {
    setLoading(true);
    setError('');
    setIsForbidden(false);
    try {
      const res = await fetch('/api/financeiro');
      if (res.status === 403) {
        setIsForbidden(true);
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Acesso negado: permissão insuficiente.');
      }
      if (!res.ok) throw new Error('Não foi possível obter os dados financeiros.');
      const data = await res.json();
      setHonorarios(data.honorarios || []);
      setKpis(data.kpis || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (id: string) => {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/honorarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_recebido: valRecebido,
          status_pagamento: statusPag,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar recebimento.');

      setEditingId(null);
      fetchFinanceiroData();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const startEditing = (h: Honorario) => {
    setEditingId(h.id);
    setValRecebido(h.valor_recebido.toString());
    setStatusPag(h.status_pagamento);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const filteredHonorarios = honorarios.filter(h => {
    if (statusFilter === 'all') return true;
    return h.status_pagamento === statusFilter;
  });

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando dados financeiros...</span>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-4.5 max-w-2xl">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-amber-500 font-outfit text-sm font-extrabold uppercase tracking-wide">Acesso Restrito</h3>
          <p className="text-muted-foreground text-xs font-semibold mt-1 leading-relaxed">
            Seu cargo atual não possui permissões administrativas para visualizar o fluxo de caixa ou dados financeiros do escritório.
          </p>
        </div>
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-xs font-bold">
            <h3 className="text-destructive uppercase tracking-wide">Falha financeira</h3>
            <p className="text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchFinanceiroData}
          className="bg-destructive hover:bg-destructive/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
        >
          Recarregar
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase">
            Fluxo de Faturamento
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
            Conciliação e controle de levantamentos judiciais
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border/80 p-5 rounded-xl flex flex-col justify-between h-28 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Homologado Estimado</span>
            <TrendingUp className="w-4 h-4 text-primary/80" />
          </div>
          <div className="mt-2">
            <h3 className="font-outfit text-2xl font-extrabold text-foreground leading-none">{formatCurrency(kpis.totalPrevisto)}</h3>
            <span className="text-[9px] text-muted-foreground font-semibold mt-1.5 block">Soma de honorários</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border/80 p-5 rounded-xl flex flex-col justify-between h-28 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Liquidado</span>
            <CheckCircle2 className="w-4 h-4 text-success/80" />
          </div>
          <div className="mt-2">
            <h3 className="font-outfit text-2xl font-extrabold text-success leading-none">{formatCurrency(kpis.totalRecebido)}</h3>
            <span className="text-[9px] text-muted-foreground font-semibold mt-1.5 block">Alvarás liberados</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border/80 p-5 rounded-xl flex flex-col justify-between h-28 hover:border-primary/20 transition-all">
          <div className="flex justify-between items-center text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Proventos Pendentes</span>
            <TrendingDown className="w-4 h-4 text-destructive/85" />
          </div>
          <div className="mt-2">
            <h3 className="font-outfit text-2xl font-extrabold text-foreground leading-none">{formatCurrency(kpis.totalPendente)}</h3>
            <span className="text-[9px] text-muted-foreground font-semibold mt-1.5 block">Saldo aguardando depósito</span>
          </div>
        </div>
      </div>

      {/* Extrato Table */}
      <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Extrato de Alvarás</h3>
          
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border/80 text-[10px] font-bold px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="pago">Pago</option>
            </select>
          </div>
        </div>

        {filteredHonorarios.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Sem lançamentos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Caso / Processo</th>
                  <th>Total Homologado</th>
                  <th>Levantado (Pago)</th>
                  <th>Saldo devedor</th>
                  <th>Status</th>
                  <th>Vencimento</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {filteredHonorarios.map((h) => {
                  const isEditing = editingId === h.id;
                  const pendente = h.valor_total - h.valor_recebido;

                  return (
                    <tr key={h.id} className="group">
                      <td>
                        <div className="space-y-1 py-0.5">
                          <Link 
                            href={`/processos/${h.processo_id}`}
                            className="font-outfit font-extrabold text-foreground hover:text-primary transition-all text-[12px] truncate max-w-[160px] block"
                          >
                            {h.processo.numero_processo}
                          </Link>
                          <span className="text-[10px] text-muted-foreground block truncate max-w-[200px]" title={h.processo.vara_comarca}>
                            {h.processo.vara_comarca}
                          </span>
                        </div>
                      </td>
                      <td className="font-bold text-foreground text-[12px] whitespace-nowrap">
                        {formatCurrency(h.valor_total)}
                      </td>
                      
                      {isEditing ? (
                        /* Inline Edit Row */
                        <td colSpan={2} className="p-2">
                          <div className="flex items-center gap-2 bg-card border border-border/80 p-2 rounded-lg text-[10px]">
                            <div>
                              <input
                                type="number"
                                step="0.01"
                                value={valRecebido}
                                onChange={(e) => setValRecebido(e.target.value)}
                                className="bg-background border border-border/60 px-2 py-1 rounded text-xs w-24 text-foreground focus:outline-none"
                              />
                            </div>
                            <div>
                              <select
                                value={statusPag}
                                onChange={(e) => setStatusPag(e.target.value)}
                                className="bg-background border border-border/60 px-2 py-1 rounded text-xs text-foreground focus:outline-none font-bold"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="parcial">Parcial</option>
                                <option value="pago">Pago</option>
                              </select>
                            </div>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 border border-border rounded text-[9px] font-bold text-muted-foreground"
                              >
                                Sair
                              </button>
                              <button
                                onClick={() => handleUpdatePayment(h.id)}
                                disabled={saveLoading}
                                className="px-2 py-1 bg-success text-white rounded text-[9px] font-bold"
                              >
                                {saveLoading ? '...' : 'OK'}
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        /* Read Column */
                        <>
                          <td className="text-success font-bold text-[12px] whitespace-nowrap">
                            {formatCurrency(h.valor_recebido)}
                          </td>
                          <td className={`font-bold text-[12px] whitespace-nowrap ${pendente > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {formatCurrency(pendente)}
                          </td>
                        </>
                      )}

                      {!isEditing && (
                        <td className="whitespace-nowrap">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-md capitalize ${
                            h.status_pagamento === 'pago' ? 'bg-success/15 text-success border-success/20' : 
                            h.status_pagamento === 'parcial' ? 'bg-warning/15 text-warning border-warning/20' : 'bg-destructive/15 text-destructive border-destructive/20'
                          }`}>
                            {h.status_pagamento}
                          </span>
                        </td>
                      )}
                      
                      {!isEditing && (
                        <td className="text-muted-foreground font-bold text-[11px] whitespace-nowrap">
                          {formatDate(h.data_vencimento)}
                        </td>
                      )}

                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {!isEditing && (
                            <button
                              onClick={() => startEditing(h)}
                              className="p-1.5 hover:bg-muted border border-transparent hover:border-border/60 rounded-lg text-muted-foreground hover:text-primary transition-all cursor-pointer"
                              title="Conciliar recebimento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <Link 
                            href={`/processos/${h.processo_id}`}
                            className="p-1.5 hover:bg-muted border border-transparent hover:border-border/60 rounded-lg text-muted-foreground hover:text-foreground transition-all"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
