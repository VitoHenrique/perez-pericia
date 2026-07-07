"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Upload, Image as ImageIcon, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NovoProcessoPage() {
  const router = useRouter();
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [status, setStatus] = useState('nomeacao_judicial');
  const [dataNomeacao, setDataNomeacao] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Novos campos
  const [origem, setOrigem] = useState('nomeacao_judicial');
  const [subtipoPericia, setSubtipoPericia] = useState('grafo');
  const [relatorioPesquisa, setRelatorioPesquisa] = useState('');

  // Geografia
  const [estados, setEstados] = useState<any[]>([]);
  const [selectedEstadoId, setSelectedEstadoId] = useState('');
  const [comarcas, setComarcas] = useState<any[]>([]);
  const [selectedComarcaId, setSelectedComarcaId] = useState('');
  const [varas, setVaras] = useState<any[]>([]);
  const [selectedVaraId, setSelectedVaraId] = useState('');
  const [tipoPericia, setTipoPericia] = useState('GRAFOTECNICA');

  // Imagens
  const [imagemAssinaturaUrl, setImagemAssinaturaUrl] = useState('');
  const [imagemEnvelopeUrl, setImagemEnvelopeUrl] = useState('');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingEnvelope, setUploadingEnvelope] = useState(false);

  // Honorario inicial (opcional)
  const [valorTotal, setValorTotal] = useState('');
  const [dataVencimentoHonorario, setDataVencimentoHonorario] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGeografia();
  }, []);

  const fetchGeografia = async () => {
    try {
      const res = await fetch('/api/geografia');
      const data = await res.json();
      if (data.success) {
        setEstados(data.estados || []);
      }
    } catch (err) {
      console.error('Erro ao buscar estados:', err);
    }
  };

  const handleEstadoChange = (estadoId: string) => {
    setSelectedEstadoId(estadoId);
    setSelectedComarcaId('');
    setVaras([]);
    setSelectedVaraId('');
    
    const est = estados.find(e => e.id === estadoId);
    setComarcas(est ? est.comarcas : []);
  };

  const handleComarcaChange = async (comarcaId: string) => {
    setSelectedComarcaId(comarcaId);
    setSelectedVaraId('');
    setVaras([]);
    
    if (!comarcaId) return;

    try {
      const res = await fetch(`/api/geografia?comarcaId=${comarcaId}`);
      const data = await res.json();
      if (data.success) {
        setVaras(data.varas || []);
      }
    } catch (err) {
      console.error('Erro ao buscar varas:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'envelope') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'signature') setUploadingSignature(true);
    else setUploadingEnvelope(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (type === 'signature') setImagemAssinaturaUrl(data.url);
        else setImagemEnvelopeUrl(data.url);
      } else {
        alert(data.error || 'Erro ao fazer upload da imagem.');
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao conectar ao servidor para upload.');
    } finally {
      if (type === 'signature') setUploadingSignature(false);
      else setUploadingEnvelope(false);
    }
  };

  const handleOrigemChange = (val: string) => {
    setOrigem(val);
    if (val === 'pesquisa_dje') {
      setStatus('pesquisa_dje');
    } else {
      setStatus('nomeacao_judicial');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!selectedEstadoId || !selectedComarcaId || !selectedVaraId) {
      setError('Por favor, selecione o Estado, Comarca e Vara.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/processos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_processo: numeroProcesso,
          tipo_pericia: tipoPericia,
          status,
          data_nomeacao: dataNomeacao,
          prazo_entrega: prazoEntrega,
          descricao,
          origem,
          subtipo_pericia: subtipoPericia,
          relatorio_pesquisa: origem === 'pesquisa_dje' ? relatorioPesquisa : null,
          valor_total: valorTotal ? parseFloat(valorTotal) : null,
          data_vencimento_honorario: dataVencimentoHonorario || null,
          varaId: selectedVaraId,
          comarcaId: selectedComarcaId,
          imagemAssinaturaUrl: imagemAssinaturaUrl || null,
          imagemEnvelopeUrl: imagemEnvelopeUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar o processo.');
      }

      router.push('/processos');
      router.refresh();
    } catch (err: any) {
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
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <Link href="/processos" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Lista
        </Link>
      </div>

      <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <h2 className="font-outfit text-md font-extrabold text-foreground uppercase tracking-tight">
            Cadastrar Processo Judicial
          </h2>
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
            Preencha os dados da nomeação, faturamento e localização geográfica
          </p>
        </div>

        {error && (
          <div className="p-4 mx-6 mt-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-2 text-xs font-semibold">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs font-semibold text-muted-foreground">
          {/* Sessão 1: Informações Judiciais */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-extrabold text-foreground border-l-2 border-primary pl-2 uppercase tracking-widest">
              1. Dados do Processo e Nomeação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block mb-1.5 text-foreground">Número do Processo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 1002341-92.2026.8.26.0100"
                  value={numeroProcesso}
                  onChange={(e) => setNumeroProcesso(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Estado *</label>
                <select
                  required
                  value={selectedEstadoId}
                  onChange={(e) => handleEstadoChange(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer"
                >
                  <option value="">Selecione o Estado</option>
                  {estados.map((est) => (
                    <option key={est.id} value={est.id}>{est.nome} ({est.sigla})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Comarca *</label>
                <select
                  required
                  disabled={!selectedEstadoId}
                  value={selectedComarcaId}
                  onChange={(e) => handleComarcaChange(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer disabled:opacity-50"
                >
                  <option value="">Selecione a Comarca</option>
                  {comarcas.map((com) => (
                    <option key={com.id} value={com.id}>{com.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Vara *</label>
                <select
                  required
                  disabled={!selectedComarcaId}
                  value={selectedVaraId}
                  onChange={(e) => setSelectedVaraId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer disabled:opacity-50"
                >
                  <option value="">Selecione a Vara</option>
                  {varas.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Origem do Processo *</label>
                <select
                  value={origem}
                  onChange={(e) => handleOrigemChange(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer"
                >
                  <option value="nomeacao_judicial">Nomeação Judicial</option>
                  <option value="pesquisa_dje">Pesquisa DJE</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Tipo de Perícia *</label>
                <select
                  value={tipoPericia}
                  onChange={(e) => setTipoPericia(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer"
                >
                  <option value="GRAFOTECNICA">Grafotécnica</option>
                  <option value="PAPILOSCOPICA">Papiloscópica</option>
                  <option value="ACIDENTE_TRANSITO">Acidente de Trânsito</option>
                  <option value="DIGITAL">Digital</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Detalhe da Perícia *</label>
                <select
                  value={subtipoPericia}
                  onChange={(e) => setSubtipoPericia(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer"
                >
                  <option value="grafo">Grafo (manuscrito)</option>
                  <option value="assinatura_eletronica">Assinatura eletrônica</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-bold cursor-pointer"
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
                  {origem === 'pesquisa_dje' ? 'Data da Pesquisa *' : 'Data da Nomeação *'}
                </label>
                <input
                  type="date"
                  required
                  value={dataNomeacao}
                  onChange={(e) => setDataNomeacao(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Prazo Limite de Entrega *</label>
                <input
                  type="date"
                  required
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sessão 2: Honorários (Opcional) */}
          <div className="pt-5 border-t border-border/60 space-y-4">
            <h3 className="text-[10px] font-extrabold text-foreground border-l-2 border-emerald-500 pl-2 uppercase tracking-widest">
              2. Faturamento & Honorários (Opcional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-foreground">Valor Estimado / Homologado</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground text-xs font-bold">
                    R$
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valorTotal}
                    onChange={(e) => setValorTotal(e.target.value)}
                    className="block w-full pl-8 pr-4 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">Previsão para Depósito</label>
                <input
                  type="date"
                  value={dataVencimentoHonorario}
                  onChange={(e) => setDataVencimentoHonorario(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium"
                />
              </div>
            </div>
          </div>

          {/* Sessão 3: Anexar Imagens (Assinatura e Envelope) */}
          <div className="pt-5 border-t border-border/60 space-y-4">
            <h3 className="text-[10px] font-extrabold text-foreground border-l-2 border-purple-500 pl-2 uppercase tracking-widest">
              3. Imagens de Assinatura e Envelope
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagem de Assinatura */}
              <div className="bg-background/30 border border-border/80 p-4 rounded-xl space-y-3">
                <span className="block text-foreground font-bold">Imagem da Assinatura</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg cursor-pointer transition-colors text-[10px] font-bold">
                    {uploadingSignature ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Assinatura
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'signature')}
                      className="hidden"
                    />
                  </label>
                  {imagemAssinaturaUrl && (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Carregada
                    </span>
                  )}
                </div>
                {imagemAssinaturaUrl && (
                  <div className="relative w-36 h-20 border border-border rounded-lg overflow-hidden bg-white/50 p-1 flex items-center justify-center">
                    <img
                      src={imagemAssinaturaUrl}
                      alt="Assinatura"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Imagem de Envelope */}
              <div className="bg-background/30 border border-border/80 p-4 rounded-xl space-y-3">
                <span className="block text-foreground font-bold">Imagem do Envelope</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg cursor-pointer transition-colors text-[10px] font-bold">
                    {uploadingEnvelope ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Envelope
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'envelope')}
                      className="hidden"
                    />
                  </label>
                  {imagemEnvelopeUrl && (
                    <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Carregada
                    </span>
                  )}
                </div>
                {imagemEnvelopeUrl && (
                  <div className="relative w-36 h-20 border border-border rounded-lg overflow-hidden bg-white/50 p-1 flex items-center justify-center">
                    <img
                      src={imagemEnvelopeUrl}
                      alt="Envelope"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sessão 4: Descrição e Detalhes */}
          <div className="pt-5 border-t border-border/60 space-y-4">
            <h3 className="text-[10px] font-extrabold text-foreground border-l-2 border-amber-500 pl-2 uppercase tracking-widest">
              4. Resumo da Demanda / Anotações
            </h3>
            
            {origem === 'pesquisa_dje' && (
              <div className="animate-fade-in">
                <label className="block mb-1.5 text-foreground">Relatório de Pesquisa *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva o relatório de pesquisa DJE (partes encontradas, telefones, histórico de tentativas de contato)..."
                  value={relatorioPesquisa}
                  onChange={(e) => setRelatorioPesquisa(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium resize-none mb-2"
                />
              </div>
            )}

            <div>
              <label className="block mb-1.5 text-foreground">Detalhes das Partes / Assistentes</label>
              <textarea
                rows={3}
                placeholder="Identifique as partes (Autor/Réu), juiz do caso, ou pontos técnicos chaves..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-5 border-t border-border/60 flex items-center justify-end gap-3">
            <Link
              href="/processos"
              className="px-4 py-2.5 border border-border hover:bg-muted/40 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 bg-foreground text-background hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Processo'
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
