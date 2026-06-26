"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Mail, 
  Search, 
  Loader2, 
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Briefcase,
  Layers,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
  id: string;
  nome: string;
  email: string;
  role: string;
  foto_url?: string | null;
  data_criacao: string;
  _count: {
    processos: number;
  };
  cargo?: {
    nome: string;
  } | null;
}

export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todos' | 'admin' | 'perito' | 'assistente'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/equipe');
      if (!res.ok) throw new Error('Não foi possível obter a lista da equipe.');
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar a equipe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const colors = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/45 dark:text-indigo-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/45 dark:text-violet-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-950/45 dark:text-purple-300',
    'bg-pink-100 text-pink-700 dark:bg-pink-950/45 dark:text-pink-300',
    'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300'
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
    if (role === 'perito') return 'Perito Judicial';
    if (role === 'assistente') return 'Assistente Técnico';
    return role;
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'admin') return 'bg-secondary/10 border-secondary/20 text-secondary';
    if (role === 'perito') return 'bg-primary/10 border-primary/20 text-primary';
    return 'bg-muted border-border/40 text-muted-foreground';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter & Search Logic
  const filteredMembers = members.filter((member) => {
    const matchesSearch = 
      member.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'todos') return matchesSearch;
    return matchesSearch && member.role === activeFilter;
  });

  // Calculate quick totals
  const totalCount = members.length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const peritoCount = members.filter(m => m.role === 'perito').length;
  const assistenteCount = members.filter(m => m.role === 'assistente').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard"
              className="inline-flex w-7 h-7 rounded-lg hover:bg-muted border border-border/50 items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase">
              Membros do Escritório
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
            Visualização completa e informações de contato de todos os colaboradores
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Carregando dados da equipe...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        <>
          {/* Statistics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/80 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Total Equipe</span>
                <span className="text-sm font-extrabold text-foreground mt-0.5 block">{totalCount} integrantes</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Administradores</span>
                <span className="text-sm font-extrabold text-foreground mt-0.5 block">{adminCount} gestores</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-500 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Peritos Judiciais</span>
                <span className="text-sm font-extrabold text-foreground mt-0.5 block">{peritoCount} peritos</span>
              </div>
            </div>

            <div className="bg-card border border-border/80 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Assistentes Técnicos</span>
                <span className="text-sm font-extrabold text-foreground mt-0.5 block">{assistenteCount} técnicos</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground/60">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-9 pr-4 py-2 bg-card border border-border/80 rounded-xl text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all shadow-sm shadow-black/5"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {(['todos', 'admin', 'perito', 'assistente'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-primary border-primary text-white shadow-sm shadow-primary/15 scale-[1.02]'
                      : 'bg-card border-border/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {filter === 'todos' ? 'Todos' : filter === 'admin' ? 'Administradores' : filter === 'perito' ? 'Peritos' : 'Assistentes'}
                </button>
              ))}
            </div>
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <div className="p-12 border border-dashed border-border/60 rounded-xl text-center text-muted-foreground space-y-2">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider">Nenhum membro encontrado</p>
              <p className="text-[10px] text-muted-foreground/75">Tente ajustar seus termos de busca ou filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-border/80 rounded-xl p-5 shadow-sm hover:border-primary/20 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Member Details */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {member.foto_url ? (
                        <img
                          src={member.foto_url}
                          alt={member.nome}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-border/10 shadow-sm"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full ${getColorClass(member.nome)} flex items-center justify-center font-extrabold text-sm shrink-0 border border-border/10 shadow-sm`}>
                          {getInitials(member.nome)}
                        </div>
                      )}

                      <div className="space-y-1 min-w-0">
                        <span className={`text-[9px] font-bold px-2.5 py-0.5 border rounded-full uppercase tracking-wider inline-block ${getRoleBadgeStyle(member.role)}`}>
                          {member.cargo?.nome || getRoleLabel(member.role)}
                        </span>
                        <h4 className="text-xs font-extrabold text-foreground truncate block leading-snug">
                          {member.nome}
                        </h4>
                        <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Mail className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </span>
                      </div>
                    </div>

                    {/* Member stats (Processes counts) */}
                    <div className="bg-background/40 border border-border/40 rounded-lg p-2.5 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase tracking-wide">Volume de Perícias</span>
                      <span className="text-foreground bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {member._count.processos} {member._count.processos === 1 ? 'processo' : 'processos'}
                      </span>
                    </div>

                    {/* Footer Info / Date & Actions */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-3.5 text-[9px] font-extrabold">
                      <span className="text-muted-foreground/75 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                        <span>Membro desde {formatDate(member.data_criacao)}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy email button */}
                        <button
                          onClick={() => handleCopyEmail(member.email, member.id)}
                          className="w-6 h-6 rounded-lg bg-background border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                          title="Copiar e-mail"
                        >
                          {copiedId === member.id ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Send email button */}
                        <a
                          href={`mailto:${member.email}`}
                          className="w-6 h-6 rounded-lg bg-primary/10 hover:bg-primary/25 border border-primary/15 text-primary flex items-center justify-center transition-colors"
                          title="Enviar e-mail"
                        >
                          <Mail className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
