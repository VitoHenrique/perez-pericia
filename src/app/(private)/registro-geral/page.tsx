"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, Database, Search, Calendar, User, Clock, FileText, Settings, Key, Trash, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegistroGeralPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications?all=true');
      const data = await res.json();
      if (data.success) {
        setLogs(data.notifications || []);
      } else {
        throw new Error(data.error || 'Erro ao carregar os registros.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('CADAS')) return <FileText className="w-4.5 h-4.5 text-emerald-500" />;
    if (act.includes('UPDATE') || act.includes('EDIT')) return <RefreshCw className="w-4.5 h-4.5 text-blue-500" />;
    if (act.includes('DELETE') || act.includes('EXCLU')) return <Trash className="w-4.5 h-4.5 text-rose-500" />;
    if (act.includes('LOGIN')) return <Key className="w-4.5 h-4.5 text-amber-500" />;
    return <Settings className="w-4.5 h-4.5 text-purple-500" />;
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    let style = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    
    if (act.includes('CREATE') || act.includes('CADAS')) {
      style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    } else if (act.includes('UPDATE') || act.includes('EDIT')) {
      style = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    } else if (act.includes('DELETE') || act.includes('EXCLU')) {
      style = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    } else if (act.includes('LOGIN')) {
      style = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }

    return (
      <span className={`text-[8.5px] font-extrabold px-2 py-0.5 border rounded-md uppercase tracking-wider ${style}`}>
        {action}
      </span>
    );
  };

  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const details = log.details?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    const user = log.user?.nome?.toLowerCase() || '';
    return details.includes(term) || action.includes(term) || user.includes(term);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase flex items-center gap-2">
            <Database className="w-5.5 h-5.5 text-primary" />
            Registro Geral de Atividades
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
            Histórico completo de auditoria e ações realizadas no sistema
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/80 hover:bg-background rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Atualizar Logs
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm">
        <div className="relative rounded-lg shadow-sm max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Filtrar por detalhe, ação ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-semibold"
          />
        </div>
      </div>

      {/* Logs View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando logs...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-semibold text-center">
          {error}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 bg-card border border-border/80 rounded-xl text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Nenhum registro encontrado.
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border/60">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors text-xs font-semibold"
              >
                {/* Left: User Avatar & Activity description */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
                    {getActionIcon(log.action)}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p className="text-foreground text-[12.5px] leading-snug font-bold">
                      {log.details}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {log.user?.nome || 'Sistema'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-secondary" />
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {getActionBadge(log.action)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
