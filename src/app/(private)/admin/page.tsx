"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Database, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  Award,
  Layers,
  Calendar,
  Lock,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';

interface UserItem {
  id: string;
  nome: string;
  email: string;
  role: string;
  cargoId?: string | null;
  cargo?: {
    id: string;
    nome: string;
  } | null;
  data_criacao: string;
  _count: {
    processos: number;
  };
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track self id to prevent self-deletion or self-demotion
  const [currentAdminId, setCurrentAdminId] = useState('');

  // Editing state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
    fetchCargosData();
    // Retrieve current user info to set self id
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setCurrentAdminId(data.user.id);
        }
      })
      .catch(console.error);
  }, []);

  const fetchCargosData = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setCargos(data.roles || []);
      }
    } catch (err) {
      console.error('Erro ao carregar cargos:', err);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Acesso negado. Apenas administradores.');
        throw new Error('Falha ao obter lista de usuários.');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { showAlert, showConfirm } = useModal();

  const handleUpdateCargo = async (userId: string, cargoId: string) => {
    setRoleUpdateLoading(true);
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar cargo do usuário.');

      fetchAdminData();
    } catch (err: any) {
      showAlert(err.message);
    } finally {
      setRoleUpdateLoading(false);
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentAdminId) {
      showAlert('Você não pode excluir sua própria conta de administrador.');
      return;
    }

    if (await showConfirm('ATENÇÃO: Você realmente deseja excluir esta conta de usuário? Todos os processos cadastrados por este perito/assistente serão removidos permanentemente.')) {
      try {
        const res = await fetch(`/api/admin/usuarios/${userId}`, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
          fetchAdminData();
        } else {
          showAlert(data.error || 'Erro ao remover usuário.');
        }
      } catch (err) {
        console.error(err);
        showAlert('Erro ao excluir usuário.');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Acessando área restrita admin...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <div>
          <h3 className="font-outfit text-md font-bold text-destructive">Acesso Não Autorizado</h3>
          <p className="text-xs text-muted-foreground mt-1">Sua conta atual não possui privilégios de Administrador.</p>
        </div>
        <Link href="/dashboard" className="bg-primary text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md">
          Voltar ao Painel Geral
        </Link>
      </div>
    );
  }

  // Calculate platform stats
  const totalProcessos = users.reduce((acc, u) => acc + u._count.processos, 0);
  const totalAdmins = users.filter(u => u.role === 'admin').length;
  const totalPeritos = users.filter(u => u.role === 'perito').length;
  const totalAssistentes = users.filter(u => u.role === 'assistente').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Warning banner */}
      <div className="bg-gradient-to-r from-secondary/15 via-background to-background border border-secondary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <h2 className="font-outfit text-xl font-extrabold text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5 text-secondary" />
          Painel de Gestão Admin (SaaS)
        </h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
          Área restrita de controle e provisionamento de acessos de equipe para a marca Perez Perícia. Aqui você pode supervisionar a volumetria e bloquear/ativar usuários.
        </p>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Usuários Cadastrados</span>
            <h3 className="text-2xl font-extrabold mt-0.5 text-foreground">{users.length}</h3>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Total de Processos Ativos</span>
            <h3 className="text-2xl font-extrabold mt-0.5 text-foreground">{totalProcessos}</h3>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground">Distribuição Perícias</span>
            <span className="text-xs font-bold text-foreground block mt-1 leading-tight">
              {totalPeritos} Peritos &bull; {totalAssistentes} Assistentes
            </span>
          </div>
        </div>
      </div>

      {/* User Management List */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-outfit text-sm font-bold text-foreground">Gestão Integrada de Usuários</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Defina cargos e gerencie privilégios dos membros cadastrados</p>
          </div>
          <Link 
            href="/admin/cargos" 
            className="bg-secondary/10 hover:bg-secondary/15 text-secondary border border-secondary/20 hover:border-secondary/30 text-[10px] font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            Configurar Cargos
          </Link>
        </div>

        <div className="space-y-4">
          {users.map((u) => {
            const isSelf = u.id === currentAdminId;
            const isUpdating = updatingUserId === u.id && roleUpdateLoading;

            return (
              <div 
                key={u.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-semibold"
              >
                {/* Details */}
                <div className="space-y-1.5 max-w-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-outfit font-extrabold text-foreground text-sm">
                      {u.nome} {isSelf && '(Você)'}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full capitalize ${
                      u.role === 'admin' ? 'bg-secondary/15 text-secondary border-secondary/20' : 
                      u.role === 'perito' ? 'bg-primary/15 text-primary border-primary/20' : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                    }`}>
                      {u.cargo?.nome || u.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {u.email} &bull; Cadastrado em {formatDate(u.data_criacao)}
                  </span>
                </div>

                {/* Management controls */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-border/50 pt-2 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] text-muted-foreground block">Processos Cadastrados</span>
                    <span className="text-foreground block text-sm font-extrabold mt-0.5">{u._count.processos}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.cargoId || ''}
                      disabled={isSelf || isUpdating}
                      onChange={(e) => handleUpdateCargo(u.id, e.target.value)}
                      className="bg-card border border-border text-[10px] font-bold px-2.5 py-1.5 rounded-xl focus:outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>Selecionar cargo...</option>
                      {cargos.map((cargo) => (
                        <option key={cargo.id} value={cargo.id}>
                          {cargo.nome}
                        </option>
                      ))}
                    </select>

                    <button
                      disabled={isSelf || isUpdating}
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 hover:bg-card border border-border rounded-xl text-destructive hover:border-destructive/25 transition-all disabled:opacity-50"
                      title="Excluir Usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
