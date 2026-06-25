"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  MapPin, 
  Tag, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

interface Processo {
  id: string;
  numero_processo: string;
  vara_comarca: string;
  tipo_pericia: string;
  status: string;
  prazo_entrega: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  glowColor: string;
}

export default function KanbanPage() {
  const { showAlert } = useModal();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);

  const columns: Column[] = [
    { id: 'nomeacao_judicial', title: 'Nomeação Judicial', color: 'border-t-indigo-500 bg-indigo-500/5', glowColor: 'rgba(99, 102, 241, 0.1)' },
    { id: 'pesquisa_dje', title: 'Pesquisa DJE', color: 'border-t-violet-500 bg-violet-500/5', glowColor: 'rgba(139, 92, 246, 0.1)' },
    { id: 'aguardando_doc', title: 'Aguardando Doc.', color: 'border-t-amber-500 bg-amber-500/5', glowColor: 'rgba(245, 158, 11, 0.1)' },
    { id: 'diligencia', title: 'Diligência', color: 'border-t-sky-500 bg-sky-500/5', glowColor: 'rgba(14, 165, 233, 0.1)' },
    { id: 'confeccao_envelope', title: 'Confecção Envelope', color: 'border-t-pink-500 bg-pink-500/5', glowColor: 'rgba(236, 72, 153, 0.1)' },
    { id: 'estimativa_honorarios', title: 'Estimativa Honorários', color: 'border-t-yellow-500 bg-yellow-500/5', glowColor: 'rgba(234, 179, 8, 0.1)' },
    { id: 'elaboracao', title: 'Elaboração', color: 'border-t-fuchsia-500 bg-fuchsia-500/5', glowColor: 'rgba(217, 70, 239, 0.1)' },
    { id: 'revisao', title: 'Revisão', color: 'border-t-teal-500 bg-teal-500/5', glowColor: 'rgba(20, 184, 166, 0.1)' },
    { id: 'concluido', title: 'Concluído', color: 'border-t-emerald-500 bg-emerald-500/5', glowColor: 'rgba(16, 185, 129, 0.1)' },
  ];

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/processos');
      if (!res.ok) throw new Error('Não foi possível carregar os processos.');
      const data = await res.json();
      setProcessos(data.processos || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: any, id: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const processId = e.dataTransfer.getData('text/plain');
    if (!processId) return;

    const currentProcesso = processos.find(p => p.id === processId);
    if (!currentProcesso || currentProcesso.status === targetStatus) return;

    // Optimistic UI Update
    const updatedProcessos = processos.map(p => {
      if (p.id === processId) {
        return { ...p, status: targetStatus };
      }
      return p;
    });
    setProcessos(updatedProcessos);

    try {
      const res = await fetch(`/api/processos/${processId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) throw new Error('Erro na sincronização.');
    } catch (err) {
      console.error(err);
      showAlert('Erro ao atualizar status. Revertendo alteração.');
      fetchProcessos();
    }
  };

  const getUrgencyBadge = (prazoStr: string, status: string) => {
    if (status === 'concluido') return 'text-success bg-success/10 border-success/20';
    
    const now = new Date();
    const prazo = new Date(prazoStr);
    const diffTime = prazo.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-destructive bg-destructive/10 border-destructive/20';
    if (diffDays <= 3) return 'text-destructive bg-destructive/10 border-destructive/25 font-bold';
    if (diffDays <= 7) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-muted-foreground bg-background border-border';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full flex flex-col space-y-6"
    >
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase">
            Quadro Kanban Operacional
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
            Mapeamento ágil do andamento técnico dos laudos
          </p>
        </div>
        <Link
          href="/processos/novo"
          className="bg-foreground text-background hover:opacity-90 text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Novo Processo
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Carregando painel ágil...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs font-semibold shrink-0">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : (
        /* Columns layout */
        <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-stretch min-h-[68vh]">
          {columns.map((col) => {
            const colProcessos = processos.filter(p => p.status === col.id);
            const isHovered = draggedOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-[270px] shrink-0 border-t-2 rounded-xl flex flex-col justify-between p-3.5 transition-all ${col.color} ${
                  isHovered ? 'ring-1 ring-primary border-t-primary scale-[1.005]' : 'border-border/60 bg-card/35'
                }`}
                style={{
                  boxShadow: isHovered ? `0 0 20px ${col.glowColor}` : 'none'
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3.5 shrink-0">
                  <h3 className="font-outfit text-[10px] font-extrabold text-foreground tracking-widest uppercase">
                    {col.title}
                  </h3>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-background border border-border/80 text-muted-foreground">
                    {colProcessos.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 max-h-[64vh] min-h-[350px]">
                  {colProcessos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground/60 border border-dashed border-border/40 rounded-lg py-16">
                      <FolderOpen className="w-5 h-5 text-muted-foreground/25 mb-1.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Sem demandas</span>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {colProcessos.map((p) => (
                        <motion.div
                          key={p.id}
                          layoutId={p.id}
                          draggable
                          onDragStart={(e: any) => handleDragStart(e, p.id)}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileDrag={{ rotate: 1.5, scale: 0.98, opacity: 0.8 }}
                          className="bg-card border border-border/75 rounded-lg p-3.5 shadow-sm active:cursor-grabbing hover:border-primary/20 space-y-3 cursor-grab transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="text-[12px] font-bold text-foreground block leading-tight truncate">
                              {p.numero_processo}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary shrink-0" />
                              {p.vara_comarca}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground">
                            <Tag className="w-3 h-3 text-secondary shrink-0" />
                            <span className="truncate">{p.tipo_pericia}</span>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[9px] font-extrabold">
                            <span className={`px-2 py-0.5 rounded border ${getUrgencyBadge(p.prazo_entrega, p.status)}`}>
                              {col.id === 'concluido' ? 'Entregue' : formatDate(p.prazo_entrega)}
                            </span>
                            
                            <Link 
                              href={`/processos/${p.id}`}
                              className="text-[9px] text-primary flex items-center gap-0.5 hover:underline font-extrabold uppercase tracking-wide"
                            >
                              Ficha
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
