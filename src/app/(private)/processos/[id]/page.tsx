"use client";

import React, { useEffect, useState, use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  FileText, 
  Trash2, 
  Edit, 
  Save, 
  Upload, 
  DollarSign, 
  Download, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  AlertTriangle,
  FolderOpen,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Documento {
  id: string;
  nome_arquivo: string;
  url_arquivo: string;
  data_upload: string;
}

interface Honorario {
  id: string;
  valor_total: number;
  valor_recebido: number;
  status_pagamento: string;
  data_vencimento: string;
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
  documentos: Documento[];
  honorarios: Honorario[];
  origem: string;
  subtipo_pericia: string;
  relatorio_pesquisa: string | null;
}

export default function ProcessoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { showAlert, showConfirm } = useModal();
  const resolvedParams = use(params);
  const router = useRouter();
  const processoId = resolvedParams.id;

  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Mode state
  const [editMode, setEditMode] = useState(false);
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [varaComarca, setVaraComarca] = useState('');
  const [tipoPericia, setTipoPericia] = useState('');
  const [status, setStatus] = useState('');
  const [dataNomeacao, setDataNomeacao] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('');
  const [subtipoPericia, setSubtipoPericia] = useState('');
  const [relatorioPesquisa, setRelatorioPesquisa] = useState('');

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // New Honorario form state
  const [showHonorarioModal, setShowHonorarioModal] = useState(false);
  const [hValorTotal, setHValorTotal] = useState('');
  const [hValorRecebido, setHValorRecebido] = useState('');
  const [hStatus, setHStatus] = useState('pendente');
  const [hDataVencimento, setHDataVencimento] = useState('');
  const [honorarioLoading, setHonorarioLoading] = useState(false);

  // Editing Honorario state
  const [editingHonorarioId, setEditingHonorarioId] = useState<string | null>(null);
  const [ehValorRecebido, setEhValorRecebido] = useState('');
  const [ehStatus, setEhStatus] = useState('');
  const [ehLoading, setEhLoading] = useState(false);

  useEffect(() => {
    fetchProcessoDetails();
  }, [processoId]);

  const fetchProcessoDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/processos/${processoId}`);
      if (!res.ok) throw new Error('Não foi possível obter detalhes do processo.');
      const data = await res.json();
      setProcesso(data.processo);
      
      // Populate edit states
      if (data.processo) {
        setNumeroProcesso(data.processo.numero_processo);
        setVaraComarca(data.processo.vara_comarca);
        setTipoPericia(data.processo.tipo_pericia);
        setStatus(data.processo.status);
        setDataNomeacao(data.processo.data_nomeacao.substring(0, 10));
        setPrazoEntrega(data.processo.prazo_entrega.substring(0, 10));
        setDescricao(data.processo.descricao || '');
        setOrigem(data.processo.origem || 'nomeacao_judicial');
        setSubtipoPericia(data.processo.subtipo_pericia || 'grafo');
        setRelatorioPesquisa(data.processo.relatorio_pesquisa || '');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/processos/${processoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_processo: numeroProcesso,
          vara_comarca: varaComarca,
          tipo_pericia: tipoPericia,
          status,
          data_nomeacao: dataNomeacao,
          prazo_entrega: prazoEntrega,
          descricao,
          origem,
          subtipo_pericia: subtipoPericia,
          relatorio_pesquisa: origem === 'pesquisa_dje' ? relatorioPesquisa : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar processo.');

      setProcesso(data.processo);
      setEditMode(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcess = async () => {
    if (await showConfirm('Você realmente deseja excluir este processo de forma definitiva?')) {
      try {
        const res = await fetch(`/api/processos/${processoId}`, { method: 'DELETE' });
        if (res.ok) {
          router.push('/processos');
          router.refresh();
        } else {
          const data = await res.json();
          showAlert(data.error || 'Falha ao deletar o processo.');
        }
      } catch (err) {
        console.error(err);
        showAlert('Erro ao excluir o processo.');
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`/api/processos/${processoId}/documentos`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar documento.');

      setSelectedFile(null);
      fetchProcessoDetails();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddHonorario = async (e: React.FormEvent) => {
    e.preventDefault();
    setHonorarioLoading(true);

    try {
      const res = await fetch(`/api/processos/${processoId}/honorarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_total: hValorTotal,
          valor_recebido: hValorRecebido || '0',
          status_pagamento: hStatus,
          data_vencimento: hDataVencimento,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar honorário.');

      setShowHonorarioModal(false);
      setHValorTotal('');
      setHValorRecebido('');
      setHStatus('pendente');
      setHDataVencimento('');
      fetchProcessoDetails();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setHonorarioLoading(false);
    }
  };

  const handleSaveHonorarioUpdate = async (honorarioId: string) => {
    setEhLoading(true);
    try {
      const res = await fetch(`/api/honorarios/${honorarioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_recebido: ehValorRecebido,
          status_pagamento: ehStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar honorário.');

      setEditingHonorarioId(null);
      fetchProcessoDetails();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setEhLoading(false);
    }
  };

  const startEditingHonorario = (h: Honorario) => {
    setEditingHonorarioId(h.id);
    setEhValorRecebido(h.valor_recebido.toString());
    setEhStatus(h.status_pagamento);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
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
    return colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      nomeacao_judicial: 'Nomeação Judicial',
      pesquisa_dje: 'Pesquisa DJE',
      aguardando_doc: 'Aguardando Doc.',
      diligencia: 'Diligência / Vistoria',
      confeccao_envelope: 'Confecção de Envelope',
      estimativa_honorarios: 'Estimativa de Honorários',
      elaboracao: 'Elaboração de Laudo',
      revisao: 'Revisão do Laudo',
      concluido: 'Concluído (Entregue)',
    };
    return labels[status] || status;
  };

  if (loading && !processo) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Carregando detalhes...</span>
      </div>
    );
  }

  if (error || !processo) {
    return (
      <div className="max-w-4xl mx-auto p-5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-xs font-bold">
            <h3 className="text-destructive uppercase tracking-wide">Erro de Carregamento</h3>
            <p className="text-muted-foreground mt-0.5">{error || 'Processo inválido.'}</p>
          </div>
        </div>
        <Link href="/processos" className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
          Voltar
        </Link>
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
      {/* Navigation and actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/processos" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Lista
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/80 hover:bg-background rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-primary" />
            {editMode ? 'Cancelar Edição' : 'Editar Ficha'}
          </button>

          <button
            onClick={handleDeleteProcess}
            className="flex items-center gap-1.5 px-3 py-2 bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 rounded-lg text-xs font-bold text-destructive transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Deletar Processo
          </button>
        </div>
      </div>

      {/* Main Details block */}
      {editMode ? (
        /* Edit Form */
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
          <h3 className="font-outfit text-xs font-extrabold mb-5 uppercase tracking-wider text-foreground">Editar Ficha cadastral</h3>
          <form onSubmit={handleUpdateProcess} className="space-y-5 text-xs font-semibold text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-foreground">Número do Processo</label>
                <input
                  type="text"
                  required
                  value={numeroProcesso}
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Vara e Comarca</label>
                <input
                  type="text"
                  required
                  value={varaComarca}
                  onChange={(e) => setVaraComarca(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Origem do Processo</label>
                <select
                  value={origem}
                  onChange={(e) => {
                    setOrigem(e.target.value);
                    if (e.target.value === 'pesquisa_dje' && status === 'nomeacao_judicial') {
                      setStatus('pesquisa_dje');
                    } else if (e.target.value === 'nomeacao_judicial' && status === 'pesquisa_dje') {
                      setStatus('nomeacao_judicial');
                    }
                  }}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-bold"
                >
                  <option value="nomeacao_judicial">Nomeação Judicial</option>
                  <option value="pesquisa_dje">Pesquisa DJE</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Tipo de Perícia</label>
                <input
                  type="text"
                  disabled
                  value="Grafotécnica"
                  className="block w-full px-3.5 py-2 bg-muted/40 border border-border/85 rounded-lg text-muted-foreground font-medium select-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Detalhe da Perícia</label>
                <select
                  value={subtipoPericia}
                  onChange={(e) => setSubtipoPericia(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-bold"
                >
                  <option value="grafo">Grafo (manuscrito)</option>
                  <option value="assinatura_eletronica">Assinatura eletrônica</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Status do Fluxo</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-bold"
                >
                  <option value="nomeacao_judicial">Nomeação Judicial</option>
                  <option value="pesquisa_dje">Pesquisa DJE</option>
                  <option value="aguardando_doc">Aguardando Documentação</option>
                  <option value="diligencia">Diligência / Vistoria</option>
                  <option value="confeccao_envelope">Confecção de Envelope</option>
                  <option value="estimativa_honorarios">Estimativa de Honorários</option>
                  <option value="elaboracao">Elaboração de Laudo</option>
                  <option value="revisao">Revisão do Laudo</option>
                  <option value="concluido">Concluído (Entregue)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">
                  {origem === 'pesquisa_dje' ? 'Data da Pesquisa' : 'Data da Nomeação'}
                </label>
                <input
                  type="date"
                  required
                  value={dataNomeacao}
                  onChange={(e) => setDataNomeacao(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Prazo Limite de Entrega</label>
                <input
                  type="date"
                  required
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium"
                />
              </div>
            </div>

            {origem === 'pesquisa_dje' && (
              <div className="mt-4">
                <label className="block mb-1.5 text-foreground">Relatório de Pesquisa *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva o relatório de pesquisa DJE..."
                  value={relatorioPesquisa}
                  onChange={(e) => setRelatorioPesquisa(e.target.value)}
                  className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium resize-none"
                />
              </div>
            )}

            <div className="mt-4">
              <label className="block mb-1.5 text-foreground">Resumo da Demanda / Partes</label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="block w-full px-3.5 py-2 bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-medium resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-border rounded-lg text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-foreground text-background hover:opacity-90 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Read Details view */
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-outfit text-md font-extrabold text-foreground tracking-tight">
                  Processo {processo.numero_processo}
                </h2>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-md capitalize ${getStatusColor(processo.status)}`}>
                  {getStatusLabel(processo.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[11px] font-bold text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  {processo.vara_comarca}
                </span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-secondary shrink-0" />
                  {processo.tipo_pericia} &bull; {processo.subtipo_pericia === 'assinatura_eletronica' ? 'Assinatura Eletrônica' : 'Grafo (Manuscrito)'}
                </span>
                <span className={`text-[9px] font-extrabold px-2 py-0.5 border rounded-md uppercase ${
                  processo.origem === 'pesquisa_dje' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }`}>
                  {processo.origem === 'pesquisa_dje' ? 'Pesquisa DJE' : 'Nomeação Judicial'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-background/50 border border-border/80 p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase tracking-wider">
                  {processo.origem === 'pesquisa_dje' ? 'Pesquisa' : 'Nomeação'}
                </span>
                <span className="font-bold text-foreground block mt-0.5">{formatDate(processo.data_nomeacao)}</span>
              </div>
              <div className="bg-background/50 border border-border/80 p-2.5 rounded-lg">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase tracking-wider">Prazo Laudo</span>
                <span className="font-bold text-foreground block mt-0.5">{formatDate(processo.prazo_entrega)}</span>
              </div>
            </div>
          </div>

          {processo.origem === 'pesquisa_dje' && (
            <div>
              <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Relatório de Pesquisa (DJE)</h3>
              <p className="text-xs text-foreground leading-relaxed font-semibold bg-violet-500/5 border border-violet-500/20 p-4 rounded-lg whitespace-pre-wrap mb-4">
                {processo.relatorio_pesquisa || 'Nenhum detalhe adicional informado.'}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-1.5">Resumo Técnico</h3>
            <p className="text-xs text-foreground leading-relaxed font-semibold bg-background/50 border border-border/50 p-4 rounded-lg whitespace-pre-wrap">
              {processo.descricao || 'Nenhum detalhe adicional informado.'}
            </p>
          </div>
        </div>
      )}

      {/* Grid: Left: GED, Right: Honorarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GED */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">GED - Gestão de Documentos</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Armazenamento local de arquivos judiciais</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-background border border-border text-muted-foreground">
                {processo.documentos.length} arquivos
              </span>
            </div>

            <form onSubmit={handleFileUpload} className="flex items-center gap-2">
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-[11px] text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer border border-border/50 rounded-lg bg-background/40 pr-3"
              />
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="bg-primary hover:bg-primary/95 disabled:opacity-50 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Anexar
              </button>
            </form>

            {processo.documentos.length === 0 ? (
              <div className="py-12 border border-dashed border-border/80 rounded-lg text-center flex flex-col items-center justify-center gap-2">
                <FolderOpen className="w-8 h-8 text-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground font-semibold">Sem documentos anexados.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {processo.documentos.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-2.5 bg-background border border-border/60 rounded-lg flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate" title={doc.nome_arquivo}>
                          {doc.nome_arquivo}
                        </p>
                        <span className="text-[8px] text-muted-foreground block">
                          {formatDate(doc.data_upload)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={doc.url_arquivo}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg hover:bg-card border border-border/80 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
                      title="Baixar arquivo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Honorarios */}
        <div className="bg-card border border-border/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-outfit text-xs font-bold text-foreground uppercase tracking-wider">Faturas e Recebíveis</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Controle de depósitos judiciais e alvarás</p>
              </div>
              <button
                onClick={() => setShowHonorarioModal(true)}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Fatura
              </button>
            </div>

            {processo.honorarios.length === 0 ? (
              <div className="py-12 border border-dashed border-border/80 rounded-lg text-center flex flex-col items-center justify-center gap-2">
                <DollarSign className="w-8 h-8 text-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground font-semibold">Nenhuma fatura lançada.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {processo.honorarios.map((h) => {
                  const isEditing = editingHonorarioId === h.id;
                  const pendente = h.valor_total - h.valor_recebido;

                  return (
                    <div 
                      key={h.id} 
                      className="p-3 bg-background border border-border/60 rounded-lg space-y-2 text-[11px]"
                    >
                      <div className="flex items-center justify-between border-b border-border/40 pb-1.5 font-bold">
                        <span className="text-foreground">Total: {formatCurrency(h.valor_total)}</span>
                        {!isEditing && (
                          <button
                            onClick={() => startEditingHonorario(h)}
                            className="text-[9px] text-primary hover:underline font-extrabold"
                          >
                            Editar
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2.5 bg-card p-2.5 rounded border border-border/50 text-[10px] font-bold">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block mb-1 text-muted-foreground">Valor Recebido</label>
                              <input
                                type="number"
                                step="0.01"
                                value={ehValorRecebido}
                                onChange={(e) => setEhValorRecebido(e.target.value)}
                                className="block w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-muted-foreground">Status Pagamento</label>
                              <select
                                value={ehStatus}
                                onChange={(e) => setEhStatus(e.target.value)}
                                className="block w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground font-bold"
                              >
                                <option value="pendente">Pendente</option>
                                <option value="parcial">Parcial</option>
                                <option value="pago">Pago</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setEditingHonorarioId(null)}
                              className="px-2 py-1 border border-border rounded text-[9px] font-bold text-muted-foreground"
                            >
                              Sair
                            </button>
                            <button
                              onClick={() => handleSaveHonorarioUpdate(h.id)}
                              disabled={ehLoading}
                              className="px-2 py-1 bg-success text-white rounded text-[9px] font-bold"
                            >
                              {ehLoading ? '...' : 'Salvar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 font-bold text-[10px]">
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase block">Recebido</span>
                            <span className="text-success block mt-0.5">{formatCurrency(h.valor_recebido)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase block">Pendente</span>
                            <span className={`block mt-0.5 ${pendente > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatCurrency(pendente)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[8px] text-muted-foreground uppercase block">Vencimento</span>
                            <span className="text-foreground block mt-0.5">{formatDate(h.data_vencimento)}</span>
                          </div>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase mt-1">
                          <span className="text-muted-foreground">Liquidação:</span>
                          <span className={`${
                            h.status_pagamento === 'pago' ? 'text-success' : 
                            h.status_pagamento === 'parcial' ? 'text-warning' : 'text-destructive'
                          }`}>
                            {h.status_pagamento}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Nova Fatura */}
      {showHonorarioModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowHonorarioModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-outfit text-xs font-extrabold text-foreground uppercase tracking-wider">Lançar Faturamento</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Registre os honorários desta nomeação judicial.</p>
            </div>

            <form onSubmit={handleAddHonorario} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div>
                <label className="block mb-1 text-foreground">Valor Total Proposto *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={hValorTotal}
                  onChange={(e) => setHValorTotal(e.target.value)}
                  className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-foreground">Adiantamento de Honorários</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={hValorRecebido}
                  onChange={(e) => setHValorRecebido(e.target.value)}
                  className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-foreground">Liquidação</label>
                  <select
                    value={hStatus}
                    onChange={(e) => setHStatus(e.target.value)}
                    className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-bold focus:outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-foreground">Data Limite *</label>
                  <input
                    type="date"
                    required
                    value={hDataVencimento}
                    onChange={(e) => setHDataVencimento(e.target.value)}
                    className="block w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowHonorarioModal(false)}
                  className="px-3.5 py-2 border border-border rounded-lg text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={honorarioLoading}
                  className="px-3.5 py-2 bg-success text-white rounded-lg text-[10px] font-bold shadow-sm"
                >
                  {honorarioLoading ? 'Gravando...' : 'Lançar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
