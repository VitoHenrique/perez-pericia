"use client";

import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Phone, 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

interface Processo {
  id: string;
  numero_processo: string;
  vara_comarca: string;
  tipo_pericia: string;
  status: string;
  prazo_entrega: string;
  data_nomeacao: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export default function AgendaPage() {
  const { showAlert, showConfirm } = useModal();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  // Vistoria Scheduler state
  const [scheduledVistorias, setScheduledVistorias] = useState<{
    id?: string;
    processoId: string;
    data: string;
    hora: string;
    endereco: string;
    contato: string;
    perito?: string;
    tipo?: string;
  }[]>([]);
  
  const [selectedProcessoId, setSelectedProcessoId] = useState('');
  const [visData, setVisData] = useState('');
  const [visHora, setVisHora] = useState('');
  const [visEndereco, setVisEndereco] = useState('');
  const [visContato, setVisContato] = useState('');

  const fetchVistorias = async () => {
    try {
      const res = await fetch('/api/vistorias');
      if (!res.ok) throw new Error('Não foi possível obter a lista de vistorias.');
      const data = await res.json();
      if (data.success) {
        const mapped = (data.vistorias || []).map((v: any) => ({
          id: v.id,
          processoId: v.processo_id,
          data: v.data,
          hora: v.hora,
          endereco: v.endereco,
          contato: v.contato,
          perito: v.processo?.usuario?.nome || 'N/A',
          tipo: v.processo?.tipo_pericia || 'Vistoria'
        }));
        setScheduledVistorias(mapped);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProcessos();
    fetchVistorias();
    const savedChecklist = localStorage.getItem('diligencia_checklist');
    if (savedChecklist) setChecklist(JSON.parse(savedChecklist));
    else {
      const defaults = [
        { id: '1', text: 'Imprimir Termo de Diligência / Intimação', done: false },
        { id: '2', text: 'Separar câmera fotográfica e baterias', done: false },
        { id: '3', text: 'Levar trena eletrônica e bloco de anotações', done: false },
        { id: '4', text: 'Confirmar horário da vistoria com assistentes técnicos', done: false },
      ];
      setChecklist(defaults);
      localStorage.setItem('diligencia_checklist', JSON.stringify(defaults));
    }
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/processos');
      if (!res.ok) throw new Error('Não foi possível obter processos.');
      const data = await res.json();
      setProcessos(data.processos || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map(item => {
      if (item.id === id) return { ...item, done: !item.done };
      return item;
    });
    setChecklist(updated);
    localStorage.setItem('diligencia_checklist', JSON.stringify(updated));
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      done: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewItemText('');
    localStorage.setItem('diligencia_checklist', JSON.stringify(updated));
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    localStorage.setItem('diligencia_checklist', JSON.stringify(updated));
  };

  const handleScheduleVistoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProcessoId || !visData || !visHora || !visEndereco) {
      showAlert('Preencha os campos obrigatórios.');
      return;
    }

    try {
      const res = await fetch('/api/vistorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processoId: selectedProcessoId,
          data: visData,
          hora: visHora,
          endereco: visEndereco,
          contato: visContato,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao agendar vistoria no servidor.');
      }

      await fetchVistorias();

      // Clear form
      setSelectedProcessoId('');
      setVisData('');
      setVisHora('');
      setVisEndereco('');
      setVisContato('');
    } catch (err: any) {
      showAlert(err.message);
    }
  };

  const handleDeleteVistoria = async (id: string | undefined, index: number) => {
    if (await showConfirm('Deseja desmarcar esta vistoria técnica?')) {
      if (id) {
        try {
          const res = await fetch(`/api/vistorias/${id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Falha ao desmarcar vistoria no servidor.');
          await fetchVistorias();
        } catch (err: any) {
          showAlert(err.message);
        }
      } else {
        const updated = scheduledVistorias.filter((_, i) => i !== index);
        setScheduledVistorias(updated);
        localStorage.setItem('diligencia_vistorias', JSON.stringify(updated));
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getProcessoNumber = (id: string) => {
    const p = processos.find(x => x.id === id);
    return p ? p.numero_processo : 'N/A';
  };

  const activeProcessos = processos.filter(p => p.status !== 'concluido');

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="font-outfit text-xl font-extrabold text-foreground tracking-tight uppercase">
          Agenda e Planejamento
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
          Controle de perícias em campo e vistorias agendadas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Diligencias Form & list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form */}
          <div className="bg-card border border-border/80 p-5 rounded-xl">
            <h3 className="font-outfit text-xs font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
              Agendar Vistoria de Campo
            </h3>

            <form onSubmit={handleScheduleVistoria} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-foreground">Processo Judicial *</label>
                <select
                  value={selectedProcessoId}
                  onChange={(e) => setSelectedProcessoId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background border border-border/80 rounded-lg focus:outline-none text-foreground font-bold cursor-pointer"
                >
                  <option value="">Selecione um caso ativo...</option>
                  {activeProcessos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numero_processo} - {p.tipo_pericia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Data Agendada *</label>
                <input
                  type="date"
                  value={visData}
                  onChange={(e) => setVisData(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Horário *</label>
                <input
                  type="time"
                  value={visHora}
                  onChange={(e) => setVisHora(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-foreground font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 text-foreground">Local / Endereço Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo"
                  value={visEndereco}
                  onChange={(e) => setVisEndereco(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-foreground font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1.5 text-foreground">Contatos Locais (Ex: Assistentes Técnicos)</label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Carlos (11) 98888-7777"
                  value={visContato}
                  onChange={(e) => setVisContato(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-foreground font-medium"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-foreground text-background hover:opacity-90 text-[11px] font-bold px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar
                </button>
              </div>
            </form>
          </div>

          {/* Timeline list */}
          <div className="bg-card border border-border/80 p-5 rounded-xl">
            <h3 className="font-outfit text-xs font-bold text-foreground mb-5 uppercase tracking-wider">Cronograma de Atendimento</h3>
            
            {scheduledVistorias.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/60 border border-dashed border-border/40 rounded-lg">
                <CalendarIcon className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider">Nenhuma diligência agendada</p>
              </div>
            ) : (
              /* Custom Vertical Timeline Style */
              <div className="relative border-l border-border/70 ml-3.5 pl-6 space-y-6 text-xs font-semibold">
                {scheduledVistorias.map((v, i) => (
                  <div key={i} className="relative">
                    {/* Node marker */}
                    <span className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                    
                    <div className="bg-background/40 border border-border/60 p-4 rounded-lg flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-outfit font-extrabold text-foreground text-sm">
                            {formatDate(v.data)} às {v.hora}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                            &bull; Proc: {getProcessoNumber(v.processoId)}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                            {v.endereco}
                          </span>
                          {v.contato && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                              {v.contato}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteVistoria(v.id, i)}
                        className="p-1.5 hover:bg-card border border-transparent hover:border-border/60 rounded-lg text-destructive transition-all shrink-0 cursor-pointer"
                        title="Desmarcar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Checklist */}
        <div className="bg-card border border-border/80 p-5 rounded-xl h-fit space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Kit de Diligência</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Checklist operacional de campo</p>
          </div>

          <form onSubmit={handleAddChecklistItem} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Adicionar item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="block w-full px-3 py-2 bg-background border border-border/80 rounded-lg focus:outline-none text-[11px] text-foreground font-medium"
            />
            <button
              type="submit"
              className="p-2 bg-foreground text-background rounded-lg shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-2">
            {checklist.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2.5 bg-background/50 border border-border/40 rounded-lg text-xs group"
              >
                <button
                  onClick={() => handleToggleChecklist(item.id)}
                  className="flex items-center gap-2 text-left text-foreground font-semibold min-w-0 cursor-pointer"
                >
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`truncate ${item.done ? 'line-through text-muted-foreground font-medium' : ''}`}>
                    {item.text}
                  </span>
                </button>

                <button
                  onClick={() => handleDeleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
