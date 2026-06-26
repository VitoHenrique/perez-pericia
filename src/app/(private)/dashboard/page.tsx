"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis
} from 'recharts';
import { 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Loader2, 
  Briefcase,
  Layers,
  ArrowRight,
  Search,
  Mail,
  Bell,
  Sparkles,
  MapPin,
  Tag,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';
import NotificationsDropdown from '@/components/NotificationsDropdown';

interface KPIFinanceiro {
  aReceber: number;
  recebido: number;
  total: number;
}

interface KPIS {
  totalProcessos: number;
  ativos: number;
  concluidos: number;
  suspensos: number;
  prazos3dias: number;
  prazos7dias: number;
  prazos15dias: number;
  conclusaoMensal?: number;
  financeiro: KPIFinanceiro;
}

interface ChartItem {
  name: string;
  value: number;
  key?: string;
}

interface FinancialChartItem {
  name: string;
  recebido: number;
  previsto: number;
}

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  role: string;
  foto_url?: string | null;
  cargo?: {
    nome: string;
  } | null;
}

interface DashboardData {
  kpis: KPIS;
  charts: {
    processosPorStatus: ChartItem[];
    financeiroMensal: FinancialChartItem[];
  };
  team?: TeamMember[];
}

interface Processo {
  id: string;
  numero_processo: string;
  vara_comarca: string;
  tipo_pericia: string;
  status: string;
  prazo_entrega: string;
  data_nomeacao: string;
  usuario?: {
    nome: string;
    role: string;
    foto_url?: string | null;
    cargo?: {
      nome: string;
    } | null;
  };
}

interface UserInfo {
  nome: string;
  email: string;
  role: string;
  foto_url?: string | null;
}

interface Diligencia {
  id: string;
  perito: string;
  peritoFotoUrl?: string | null;
  tipo: string;
  desc: string;
  data: string;
  hora: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const colors = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
];

const getColorClass = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getRoleLabel = (role: string) => {
  if (role === 'admin') return 'Administrador';
  if (role === 'perito') return 'Perito';
  if (role === 'assistente') return 'Assistente';
  return role;
};

export default function DashboardPage() {
  const { showAlert } = useModal();
  const [data, setData] = useState<DashboardData | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [scheduledVistorias, setScheduledVistorias] = useState<Diligencia[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch('/api/processos').then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch('/api/auth/me').then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      fetch('/api/vistorias').then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
    ]).then(([dashboardJson, processosJson, meJson, vistoriasJson]) => {
      setData(dashboardJson);
      setProcessos(processosJson.processos || []);
      if (meJson.user) {
        setUser(meJson.user);
      }
      
      // Load Scheduled Vistorias from Database
      const mapped = (vistoriasJson.vistorias || []).map((v: any) => ({
        id: v.id,
        perito: v.processo?.usuario?.nome || 'N/A',
        peritoFotoUrl: v.processo?.usuario?.foto_url || null,
        tipo: v.processo?.tipo_pericia || 'Vistoria',
        desc: `${v.endereco || 'Endereço não cadastrado'} - Contato: ${v.contato || 'N/A'}`,
        data: v.data,
        hora: v.hora
      }));
      setScheduledVistorias(mapped);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setError('Erro ao carregar dados do painel.');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando painel Coursue...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-xs font-bold">
            <h3 className="text-destructive uppercase tracking-wide">Falha na inicialização do painel</h3>
            <p className="text-muted-foreground mt-0.5">{error || 'Tente novamente.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, charts } = data;

  const getProgressPercent = (status: string) => {
    const percentages: { [key: string]: number } = {
      nomeacao_judicial: 10,
      pesquisa_dje: 20,
      aguardando_doc: 30,
      diligencia: 40,
      confeccao_envelope: 50,
      estimativa_honorarios: 60,
      elaboracao: 75,
      revisao: 90,
      concluido: 100,
    };
    return percentages[status] || 0;
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: { [key: string]: string } = {
      nomeacao_judicial: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
      pesquisa_dje: 'bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400',
      aguardando_doc: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
      diligencia: 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400',
      confeccao_envelope: 'bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400',
      estimativa_honorarios: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400',
      elaboracao: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/20 dark:text-fuchsia-400',
      revisao: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400',
      concluido: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
    };
    return classes[status] || 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400';
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const percentConcluidos = kpis.conclusaoMensal !== undefined
    ? kpis.conclusaoMensal
    : (kpis.totalProcessos ? Math.round((kpis.concluidos / kpis.totalProcessos) * 100) : 0);

  // weekly/monthly data for the sidebar Recharts
  const barChartData = charts?.financeiroMensal?.map(item => ({
    name: item.name.substring(0, 3), 
    value: Math.round(item.recebido / 1000)
  })) || [
    { name: 'S1', value: 20 },
    { name: 'S2', value: 48 },
    { name: 'S3', value: 65 },
    { name: 'S4', value: 30 }
  ];

  const filteredProcessos = processos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.numero_processo.toLowerCase().includes(term) ||
      p.tipo_pericia.toLowerCase().includes(term) ||
      p.vara_comarca.toLowerCase().includes(term)
    );
  });

  const recentProcessos = filteredProcessos.slice(0, 3);

  const filteredVistorias = scheduledVistorias.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.perito.toLowerCase().includes(term) ||
      v.tipo.toLowerCase().includes(term) ||
      v.desc.toLowerCase().includes(term)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-fade-in-up">
      {/* 1. Center Content Area (spans 3 columns on large screens) */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Search bar row */}
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/80">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Pesquise seus processos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-card border border-border/80 rounded-full text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all shadow-sm shadow-black/5"
          />
        </div>

        {/* Banner Card */}
        <div className="bg-gradient-to-tr from-primary to-indigo-700 rounded-2xl p-7 text-white relative overflow-hidden flex flex-col justify-between shadow-md shadow-primary/10 min-h-[220px]">
          {/* Subtle decoration elements resembling Coursue banner stars */}
          <div className="absolute top-8 right-16 w-12 h-12 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-6 right-8 text-white/10 pointer-events-none select-none">
            <Sparkles className="w-24 h-24 stroke-[0.5]" />
          </div>
          
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
              Operação Pericial
            </span>
            <h2 className="font-outfit text-2xl font-extrabold max-w-lg leading-tight mt-4 text-white">
              Otimize suas Nomeações e Prazos com Praticidade
            </h2>
          </div>

          <div className="mt-6">
            <Link 
              href="/processos/novo"
              className="inline-flex items-center gap-2 bg-foreground text-background hover:opacity-95 text-[11px] font-extrabold px-4 py-2.5 rounded-full transition-all shadow-sm"
            >
              Cadastrar Processo
              <div className="w-5 h-5 rounded-full bg-background text-foreground flex items-center justify-center shrink-0">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>

        {/* Small Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Laudos Entregues</span>
              <span className="text-xs font-extrabold text-foreground mt-0.5 block">{kpis.concluidos}/{kpis.totalProcessos} concluídos</span>
            </div>
          </div>

          <div className="bg-card border border-border/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Prazos Críticos</span>
              <span className="text-xs font-extrabold text-foreground mt-0.5 block">{kpis.prazos3dias} urgentes (3d)</span>
            </div>
          </div>

          <div className="bg-card border border-border/80 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Demandas Ativas</span>
              <span className="text-xs font-extrabold text-foreground mt-0.5 block">{kpis.ativos} em andamento</span>
            </div>
          </div>
        </div>

        {/* Recent Demands (Continue Watching) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-outfit text-sm font-extrabold text-foreground uppercase tracking-wider">Demandas Recentes</h3>
            <div className="flex items-center gap-1.5">
              <button className="w-6 h-6 rounded-full bg-card border border-border/80 text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold select-none cursor-pointer">&lt;</button>
              <button className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold select-none cursor-pointer">&gt;</button>
            </div>
          </div>

          {recentProcessos.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground">
              Nenhuma perícia recente em andamento.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentProcessos.map((p) => (
                <div key={p.id} className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm p-4 space-y-3.5 flex flex-col justify-between">
                  {/* Decorative Cover Gradient representing course image */}
                  <div className="w-full h-24 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/5 border border-border/40 relative flex items-center justify-center">
                    <FolderOpen className="w-7 h-7 text-primary/30" />
                  </div>

                  <div className="space-y-1">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${getStatusBadgeClass(p.status)}`}>
                      {getStatusLabel(p.status)}
                    </span>
                    <h4 className="text-xs font-extrabold text-foreground truncate block leading-tight mt-1">{p.numero_processo}</h4>
                    <span className="text-[10px] text-muted-foreground font-bold truncate block">{p.tipo_pericia} &bull; {p.vara_comarca}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground/75">
                      <span>Progresso</span>
                      <span>{getProgressPercent(p.status)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${getProgressPercent(p.status)}%` }} />
                    </div>
                  </div>

                  {/* Mentor footer */}
                  <div className="flex items-center gap-2 border-t border-border/40 pt-2 text-[10px]">
                    {p.usuario?.foto_url ? (
                      <img
                        src={p.usuario.foto_url}
                        alt={p.usuario.nome}
                        className="w-5.5 h-5.5 rounded-full object-cover shrink-0 border border-primary/20 shadow-sm"
                      />
                    ) : (
                      <div className={`w-5.5 h-5.5 rounded-full ${p.usuario?.nome ? getColorClass(p.usuario.nome) : 'bg-indigo-50 text-primary'} flex items-center justify-center font-bold text-[9px] shrink-0 border border-primary/20`}>
                        {p.usuario?.nome ? getInitials(p.usuario.nome) : 'FP'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-foreground truncate leading-tight">
                        {p.usuario?.nome || 'Fernando Perez'}
                      </span>
                      <span className="text-[8px] font-semibold text-muted-foreground/75 leading-none">
                        {p.usuario?.cargo?.nome || (p.usuario?.role ? getRoleLabel(p.usuario.role) : 'Perito')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vistorias / Diligências (Your Lesson) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h3 className="font-outfit text-sm font-extrabold text-foreground uppercase tracking-wider">Próximas Diligências</h3>
            <Link href="/agenda" className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider">Ver Agenda</Link>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Especialidade</th>
                    <th className="py-3 px-4">Localização & Contato</th>
                    <th className="py-3 px-4 text-center">Data & Hora</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs font-semibold text-foreground">
                  {filteredVistorias.slice(0, 3).map((v) => (
                    <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        {v.peritoFotoUrl ? (
                          <img
                            src={v.peritoFotoUrl}
                            alt={v.perito}
                            className="w-6.5 h-6.5 rounded-full object-cover shrink-0 border border-primary/10 shadow-sm"
                          />
                        ) : (
                          <div className={`w-6.5 h-6.5 rounded-full ${getColorClass(v.perito)} flex items-center justify-center font-bold text-[9px] shrink-0 border border-primary/10 shadow-sm`}>
                            {getInitials(v.perito)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold truncate text-foreground">{v.perito}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold capitalize">
                          {v.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-medium text-[11px] truncate max-w-[200px]" title={v.desc}>
                        {v.desc}
                      </td>
                      <td className="py-3.5 px-4 text-center text-foreground font-bold">
                        <span className="block text-[11px]">{new Date(v.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        <span className="text-[9px] text-muted-foreground/75 font-semibold block">{v.hora}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link 
                          href={v.id.startsWith('mock') ? '/agenda' : `/processos/${v.id}`}
                          className="inline-flex w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary items-center justify-center transition-colors"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Right Sidebar Column (spans 1 column on large screens) */}
      <div className="space-y-6 lg:border-l lg:border-border/60 lg:pl-6">
        
        {/* User Topbar Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => showAlert('Mensagens em desenvolvimento')}
              className="w-9 h-9 rounded-full bg-card border border-border/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer shadow-sm transition-all"
            >
              <Mail className="w-4 h-4" />
            </button>
            <NotificationsDropdown />
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-bold text-foreground block leading-tight">{user?.nome || 'Jason Ranti'}</span>
              <span className="text-[9px] font-bold text-muted-foreground block capitalize tracking-wider">{user?.role || 'Perito'}</span>
            </div>
            {user?.foto_url ? (
              <img
                src={user.foto_url}
                alt={user.nome}
                className="w-8 h-8 rounded-full object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-violet-400 flex items-center justify-center text-white font-extrabold text-[12px] shadow-sm select-none shrink-0">
                {user?.nome ? user.nome.charAt(0).toUpperCase() : 'J'}
              </div>
            )}
          </div>
        </div>

        {/* Statistic Card (Concentric progress ring + Weekly Recharts) */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Desempenho</h4>
            <span className="text-[10px] text-muted-foreground font-bold">Mensal</span>
          </div>

          {/* Concentric Progress Ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* SVG concentric circles */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="42"
                  className="stroke-muted"
                  strokeWidth="6.5"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="42"
                  className="stroke-primary"
                  strokeWidth="6.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - percentConcluidos / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </svg>
              
              {/* Circular Avatar in the center */}
              {user?.foto_url ? (
                <img
                  src={user.foto_url}
                  alt={user.nome}
                  className="absolute w-17 h-17 rounded-full object-cover shadow-md border-2 border-card"
                />
              ) : (
                <div className="absolute w-17 h-17 rounded-full bg-gradient-to-tr from-primary to-violet-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md border-2 border-card">
                  {user?.nome ? user.nome.charAt(0).toUpperCase() : 'J'}
                </div>
              )}

              {/* Percentage Badge Top Right */}
              <div className="absolute top-0.5 right-0.5 bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                {percentConcluidos}%
              </div>
            </div>

            <div className="text-center mt-4">
              <h4 className="font-outfit text-sm font-extrabold text-foreground">
                Bom dia, {user?.nome ? user.nome.split(' ')[0] : 'Jason'}! 🔥
              </h4>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 max-w-[200px] leading-tight mx-auto uppercase tracking-wide">
                Seu percentual de conclusão de laudos deste mês.
              </p>
            </div>
          </div>


        </div>

        {/* Office Team Members (Your Mentor) */}
        <div className="bg-card border border-border/80 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <h4 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Equipe do Escritório</h4>
          </div>

          <div className="space-y-3.5">
            {data.team && data.team.length > 0 ? (
              data.team.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  {member.foto_url ? (
                    <img
                      src={member.foto_url}
                      alt={member.nome}
                      className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm border border-border/50"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${getColorClass(member.nome)} flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm`}>
                      {getInitials(member.nome)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-foreground truncate leading-tight">{member.nome}</span>
                    <span className="text-[8px] font-bold text-muted-foreground/75 mt-0.5 leading-none">{member.cargo?.nome || getRoleLabel(member.role)}</span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground block text-center py-2">Nenhum membro cadastrado</span>
            )}
          </div>

          <Link 
            href="/equipe"
            className="w-full block text-center bg-muted/40 hover:bg-muted/80 text-[10px] font-bold py-2 rounded-xl border border-border/40 transition-all text-muted-foreground"
          >
            Ver Equipe Completa
          </Link>
        </div>

      </div>
    </div>
  );
}
