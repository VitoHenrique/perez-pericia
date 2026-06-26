"use client";

import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Edit2, 
  Plus, 
  Loader2, 
  ArrowLeft,
  Check,
  X,
  Lock,
  Users,
  Settings,
  FileText,
  DollarSign,
  MapPin,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface Permission {
  id: string;
  nome: string;
  descricao: string;
}

interface CargoPermissao {
  permissaoId: string;
  permissao: Permission;
}

interface Cargo {
  id: string;
  nome: string;
  descricao: string;
  permissoes: CargoPermissao[];
  _count?: {
    usuarios: number;
  };
}

const CATEGORY_MAP: Record<string, { label: string; color: string; icon: any }> = {
  processos: { label: 'Processos', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', icon: FileText },
  honorarios: { label: 'Financeiro', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: DollarSign },
  vistorias: { label: 'Vistorias', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: MapPin },
  admin: { label: 'Administração', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', icon: Settings },
  cargos: { label: 'Acessos', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: Shield },
  data: { label: 'Acessos', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', icon: Shield },
};

const PERMISSION_FRIENDLY_NAMES: Record<string, string> = {
  'processos.view': 'Visualizar Processos',
  'processos.create': 'Criar Novos Processos',
  'processos.edit': 'Editar Processos',
  'processos.delete': 'Excluir Processos',
  'honorarios.view': 'Visualizar Financeiro',
  'honorarios.create': 'Adicionar Honorários',
  'honorarios.edit': 'Editar Honorários',
  'honorarios.delete': 'Excluir Honorários',
  'vistorias.view': 'Visualizar Vistorias',
  'vistorias.create': 'Agendar Vistorias',
  'vistorias.delete': 'Excluir Vistorias',
  'admin.view': 'Acesso Administrativo',
  'cargos.manage': 'Gerenciar Cargos',
  'data.view_all': 'Visualizar Todos os Dados',
};

function getFriendlyPermissionName(name: string): string {
  return PERMISSION_FRIENDLY_NAMES[name] || name;
}

function getPermissionCategory(name: string) {
  const prefix = name.split('.')[0];
  return CATEGORY_MAP[prefix] || { label: 'Outros', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20', icon: ShieldCheck };
}

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoesIds: [] as string[],
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const { showAlert, showConfirm } = useModal();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cargosRes, permsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions')
      ]);

      if (!cargosRes.ok || !permsRes.ok) {
        throw new Error('Falha ao carregar dados do servidor.');
      }

      const cargosData = await cargosRes.json();
      const permsData = await permsRes.json();

      setCargos(cargosData.roles || []);
      setPermissions(permsData.permissions || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar cargos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedCargo(null);
    setFormData({
      nome: '',
      descricao: '',
      permissoesIds: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cargo: Cargo) => {
    setModalMode('edit');
    setSelectedCargo(cargo);
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao,
      permissoesIds: cargo.permissoes.map((cp) => cp.permissaoId),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setFormData((prev) => {
      const isSelected = prev.permissoesIds.includes(permId);
      const newIds = isSelected 
        ? prev.permissoesIds.filter((id) => id !== permId)
        : [...prev.permissoesIds, permId];
      return { ...prev, permissoesIds: newIds };
    });
  };

  const handleSelectAllCategory = (categoryPrefix: string, selectAll: boolean) => {
    const categoryPermIds = permissions
      .filter((p) => p.nome.startsWith(categoryPrefix))
      .map((p) => p.id);

    setFormData((prev) => {
      let newIds = prev.permissoesIds.filter(id => !categoryPermIds.includes(id));
      if (selectAll) {
        newIds = [...newIds, ...categoryPermIds];
      }
      return { ...prev, permissoesIds: newIds };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setFormError('O nome do cargo é obrigatório.');
      return;
    }

    setSubmitLoading(true);
    setFormError('');

    try {
      const url = modalMode === 'create' ? '/api/admin/roles' : `/api/admin/roles/${selectedCargo?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar cargo.');
      }

      setIsModalOpen(false);
      fetchInitialData();
      showAlert(
        modalMode === 'create' ? 'Cargo criado com sucesso!' : 'Cargo atualizado com sucesso!',
        'Sucesso'
      );
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Ocorreu um erro.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCargo = async (cargo: Cargo) => {
    if (cargo.nome === 'Desenvolvedor' || cargo.nome === 'Perito' || cargo.nome === 'Assistente') {
      showAlert('Os cargos principais do sistema não podem ser excluídos.', 'Ação Bloqueada');
      return;
    }

    const message = `Tem certeza que deseja excluir o cargo "${cargo.nome}"? Esta ação não pode ser desfeita.`;
    if (await showConfirm(message, 'Confirmar Exclusão')) {
      try {
        const res = await fetch(`/api/admin/roles/${cargo.id}`, { method: 'DELETE' });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Falha ao excluir cargo.');
        }

        fetchInitialData();
        showAlert('Cargo excluído com sucesso.', 'Sucesso');
      } catch (err: any) {
        console.error(err);
        showAlert(err.message || 'Erro ao excluir cargo.');
      }
    }
  };

  // Group permissions by category prefix
  const permissionsByCategory = permissions.reduce((acc, perm) => {
    const prefix = perm.nome.split('.')[0];
    if (!acc[prefix]) {
      acc[prefix] = [];
    }
    acc[prefix].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading && cargos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Carregando cargos e acessos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <div>
          <h3 className="font-outfit text-md font-bold text-destructive">Erro de Carregamento</h3>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
        <button onClick={fetchInitialData} className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-secondary/15 via-background to-background border border-secondary/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="p-1.5 hover:bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h2 className="font-outfit text-xl font-extrabold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Gestão de Cargos e Permissões
            </h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Configure funções customizadas e as permissões de acesso para a equipe. Controle com precisão o que cada membro pode visualizar ou modificar.
          </p>
        </div>
        
        <button 
          onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start md:self-center shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Cargo
        </button>
      </div>

      {/* Cargos Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cargos.map((cargo) => {
          const isSystemRole = ['Desenvolvedor', 'Perito', 'Assistente'].includes(cargo.nome);
          
          return (
            <motion.div 
              layout
              key={cargo.id}
              className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-black/5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Title and actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-outfit font-extrabold text-foreground text-sm flex items-center gap-2">
                      {cargo.nome}
                      {isSystemRole && (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-secondary/10 border border-secondary/20 text-secondary rounded-full">
                          Sistema
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed min-h-[32px] line-clamp-2">
                      {cargo.descricao || 'Sem descrição cadastrada.'}
                    </p>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold bg-background/50 border border-border/50 px-2.5 py-1.5 rounded-xl self-start w-fit">
                  <Users className="w-3.5 h-3.5" />
                  <span>{cargo._count?.usuarios || 0} usuários associados</span>
                </div>

                {/* Permissions Summarized */}
                <div className="space-y-2 border-t border-border/50 pt-4">
                  <span className="text-[10px] text-muted-foreground font-bold block uppercase tracking-wider">
                    Permissões Ativas ({cargo.permissoes.length})
                  </span>
                  
                  {cargo.permissoes.length === 0 ? (
                    <span className="text-[11px] text-muted-foreground italic block">
                      Nenhuma permissão associada.
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {cargo.permissoes.map((cp) => {
                        const cat = getPermissionCategory(cp.permissao.nome);
                        return (
                          <span 
                            key={cp.permissaoId}
                            className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${cat.color}`}
                            title={cp.permissao.descricao}
                          >
                            {getFriendlyPermissionName(cp.permissao.nome)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-4 mt-6">
                <button
                  onClick={() => handleOpenEditModal(cargo)}
                  className="p-2 hover:bg-background border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all"
                  title="Editar Cargo"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {!isSystemRole && (
                  <button
                    onClick={() => handleDeleteCargo(cargo)}
                    className="p-2 hover:bg-background border border-border rounded-xl text-destructive hover:border-destructive/25 transition-all"
                    title="Excluir Cargo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create/Edit Modal Slide-over or Center Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitLoading && setIsModalOpen(false)}
              className="absolute inset-0 bg-background/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-2xl shadow-xl shadow-black/10 flex flex-col max-h-[85vh] relative z-10"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-outfit text-md font-extrabold text-foreground">
                    {modalMode === 'create' ? 'Criar Novo Cargo' : `Editar Cargo: ${selectedCargo?.nome}`}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Preencha as informações básicas e configure as permissões de acesso.
                  </p>
                </div>
                <button 
                  disabled={submitLoading}
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-muted border border-border rounded-xl text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                {formError && (
                  <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Basic Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Nome do Cargo *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={submitLoading || (modalMode === 'edit' && selectedCargo?.nome === 'Desenvolvedor')}
                      placeholder="Ex: Auxiliar de Laudos"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-background border border-border text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Descrição
                    </label>
                    <input
                      type="text"
                      disabled={submitLoading}
                      placeholder="Ex: Acesso a relatórios e cadastro de processos."
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full bg-background border border-border text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Permissions List */}
                <div className="space-y-4 border-t border-border pt-6">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Definição de Permissões</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Selecione quais recursos este cargo poderá operar no sistema.
                    </p>
                  </div>

                  <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                    {Object.keys(permissionsByCategory).map((prefix) => {
                      const catInfo = CATEGORY_MAP[prefix] || { label: prefix.toUpperCase(), color: 'text-slate-500', icon: ShieldCheck };
                      const CategoryIcon = catInfo.icon;
                      
                      const categoryPerms = permissionsByCategory[prefix];
                      const allSelected = categoryPerms.every(p => formData.permissoesIds.includes(p.id));
                      const someSelected = categoryPerms.some(p => formData.permissoesIds.includes(p.id)) && !allSelected;

                      return (
                        <div key={prefix} className="bg-background border border-border/80 rounded-xl p-4 space-y-3">
                          {/* Category Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-border/50">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${catInfo.color.split(' ')[1]} ${catInfo.color.split(' ')[2]}`}>
                                <CategoryIcon className={`w-4 h-4 ${catInfo.color.split(' ')[0]}`} />
                              </div>
                              <span className="font-outfit font-extrabold text-foreground text-xs">
                                {catInfo.label}
                              </span>
                            </div>

                            {/* Select All Toggle */}
                            <button
                              type="button"
                              onClick={() => handleSelectAllCategory(prefix, !allSelected)}
                              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-all focus:outline-none"
                            >
                              {allSelected ? 'Limpar Todos' : 'Selecionar Todos'}
                            </button>
                          </div>

                          {/* Permission Checklist */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {categoryPerms.map((perm) => {
                              const isChecked = formData.permissoesIds.includes(perm.id);
                              
                              return (
                                <button
                                  key={perm.id}
                                  type="button"
                                  onClick={() => handleTogglePermission(perm.id)}
                                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all hover:bg-card focus:outline-none cursor-pointer ${
                                    isChecked 
                                      ? 'border-primary/30 bg-primary/5' 
                                      : 'border-border'
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                    isChecked 
                                      ? 'bg-primary border-primary text-white animate-scale-up' 
                                      : 'border-border bg-background'
                                  }`}>
                                    {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                  </div>
                                  <div>
                                    <span className="text-[11px] font-bold text-foreground block">
                                      {getFriendlyPermissionName(perm.nome)}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground leading-normal block mt-0.5">
                                      {perm.descricao}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center gap-3 pt-4 border-t border-border justify-end">
                  <button
                    type="button"
                    disabled={submitLoading}
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {submitLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Cargo'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
