"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  FolderOpen, 
  AlertTriangle, 
  ChevronRight, 
  Loader2,
  MapPin,
  Tag,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Honorario {
  id: string;
  valor_total: number;
  valor_recebido: number;
  status_pagamento: string;
}

interface Processo {
  id: string;
  numero_processo: string;
  vara_comarca: string;
  tipo_pericia: string;
  status: string;
  data_nomeacao: string;
  prazo_entrega: string;
  descricao: string | null;
  honorarios: Honorario[];
  origem: string;
  subtipo_pericia: string;
}

export default function ProcessosListPage() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/processos');
      if (!res.ok) throw new Error('Erro ao carregar a lista de processos.');
      const data = await res.json();
      setProcessos(data.processos || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyStyles = (prazoStr: string, status: string) => {
    if (status === 'concluido') {
      return { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Concluído' };
    }
    
    const now = new Date();
    const prazo = new Date(prazoStr);
    const diffTime = prazo.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { badge: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Atrasado' };
    }
    if (diffDays <= 3) {
      return { badge: 'bg-destructive/10 text-destructive border-destructive/25 font-bold animate-pulse', label: `Urgente (${diffDays}d)` };
    }
    if (diffDays <= 7) {
      return { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: `Alerta (${diffDays}d)` };
    }
    return { badge: 'bg-zinc-500/10 text-muted-foreground border-border', label: `No Prazo (${diffDays}d)` };
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      nomeacao_judicial: 'Nomeação Judicial',
      pesquisa_dje: 'Pesquisa DJE',
      aguardando_doc: 'Aguardando Doc.',
      diligencia: 'Diligência',
      confeccao_envelope: 'Confecção Envelope',
      estimativa_honorarios: 'Estimativa Honorários',
      elaboracao: 'Elaboração',
      revisao: 'Revisão',
      concluido: 'Concluído',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      nomeacao_judicial: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      pesquisa_dje: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      aguardando_doc: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      diligencia: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      confeccao_envelope: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      estimativa_honorarios: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      elaboracao: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
      revisao: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      concluido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return colors[status] || 'bg-zinc-500/10 text-slate-400 border-slate-500/20';
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

  const filteredProcessos = processos.filter((p) => {
    const matchesSearch = 
      p.numero_processo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vara_comarca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tipo_pericia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Top Banner and Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase">
            Processos e Demandas Judiciais
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
            Gerenciamento geral da carteira pericial
          </p>
        </div>
        <Link
          href="/processos/novo"
          className="bg-foreground text-background hover:opacity-90 text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Perícia
        </Link>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nº processo, vara, tipo de perícia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2.5 bg-card border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs font-medium transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-9 pr-4 py-2.5 bg-card border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs font-semibold transition-all appearance-none cursor-pointer"
          >
            <option value="all">Todos os Status</option>
            <option value="nomeacao_judicial">Nomeação Judicial</option>
            <option value="pesquisa_dje">Pesquisa DJE</option>
            <option value="aguardando_doc">Aguardando Doc.</option>
            <option value="diligencia">Diligência / Vistoria</option>
            <option value="confeccao_envelope">Confecção de Envelope</option>
            <option value="estimativa_honorarios">Estimativa de Honorários</option>
            <option value="elaboracao">Elaboração de Laudo</option>
            <option value="revisao">Revisão do Laudo</option>
            <option value="concluido">Concluído (Entregue)</option>
          </select>
        </div>
      </div>

      {/* Loading & Empty States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Acessando banco de dados...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredProcessos.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <FolderOpen className="w-10 h-10 text-muted-foreground/45" />
          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Nenhum registro</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Nenhuma perícia judicial corresponde aos filtros de pesquisa.</p>
          </div>
          <Link
            href="/processos/novo"
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-bold px-3 py-2 rounded-lg transition-all"
          >
            Lançar Primeira Nomeação
          </Link>
        </div>
      ) : (
        /* Fintech Flat Table */
        <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Nº do Processo</th>
                  <th>Vara e Comarca</th>
                  <th>Tipo de Perícia</th>
                  <th>Status</th>
                  <th>Limite Laudo</th>
                  <th>Honorário</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProcessos.map((p) => {
                  const urgency = getUrgencyStyles(p.prazo_entrega, p.status);
                  const honorario = p.honorarios[0];

                  return (
                    <tr key={p.id} className="group">
                      <td className="font-outfit text-foreground tracking-tight text-[13px] whitespace-nowrap">
                        <div className="font-bold">{p.numero_processo}</div>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.2 border rounded uppercase ${
                            p.origem === 'pesquisa_dje' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {p.origem === 'pesquisa_dje' ? 'DJE' : 'Nomeação'}
                          </span>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.2 bg-zinc-500/10 text-muted-foreground border border-border rounded uppercase">
                            {p.subtipo_pericia === 'assinatura_eletronica' ? 'Eletrônica' : 'Grafo'}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted-foreground text-[12px] truncate max-w-[200px]" title={p.vara_comarca}>
                        {p.vara_comarca}
                      </td>
                      <td className="text-muted-foreground text-[12px] whitespace-nowrap">
                        {p.tipo_pericia}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-md capitalize ${getStatusColor(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-md ${urgency.badge}`}>
                          {urgency.label === 'Concluído' ? 'Entregue' : formatDate(p.prazo_entrega)}
                        </span>
                      </td>
                      <td className="font-bold text-foreground text-[12px] whitespace-nowrap">
                        {honorario ? formatCurrency(honorario.valor_total) : '-'}
                      </td>
                      <td>
                        <Link 
                          href={`/processos/${p.id}`}
                          className="w-7 h-7 rounded-lg hover:bg-muted border border-transparent hover:border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
