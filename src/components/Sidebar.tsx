"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Layers, 
  DollarSign, 
  Calendar, 
  Settings, 
  UserCheck, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

interface SidebarProps {
  user: {
    nome: string;
    email: string;
    role: string;
    foto_url?: string | null;
    cargo?: {
      nome: string;
    } | null;
  } | null;
  team: Array<{
    id: string;
    nome: string;
    email: string;
    role: string;
    foto_url?: string | null;
    cargo?: {
      nome: string;
    } | null;
  }>;
}

export default function Sidebar({ user, team }: SidebarProps) {
  const { showConfirm } = useModal();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Processos', path: '/processos', icon: FileText },
    { name: 'Kanban', path: '/kanban', icon: Layers },
    { name: 'Financeiro', path: '/financeiro', icon: DollarSign },
    { name: 'Agenda & Diligências', path: '/agenda', icon: Calendar },
  ];

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
    if (role === 'perito') return 'Perito Judicial';
    if (role === 'assistente') return 'Assistente Técnico';
    return role;
  };

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    if (await showConfirm('Deseja realmente sair?')) {
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Erro ao deslogar:', err);
      }
    }
  };

  return (
    <aside 
      className={`bg-card border-r border-border h-screen flex flex-col transition-all duration-300 ease-in-out sticky top-0 z-30 shrink-0 ${
        collapsed ? 'w-[72px]' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden pl-1.5">
          {/* Logo: Circular badge with a white sparkle star inside */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
            <Sparkles className="w-4 h-4 fill-white text-white" />
          </div>
          {!collapsed && (
            <span className="font-outfit text-sm font-extrabold tracking-tight text-foreground uppercase tracking-wide truncate">
              Perez Perícia
            </span>
          )}
        </Link>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* OVERVIEW SECTION */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[9px] uppercase font-extrabold text-muted-foreground/60 tracking-widest block mb-2">
              Visão Geral
            </span>
          )}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all relative group ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {/* Background Pill Animation */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* EQUIPE (FRIENDS) SECTION */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[9px] uppercase font-extrabold text-muted-foreground/60 tracking-widest block">
                Equipe
              </span>
              <Link href="/equipe" className="text-[8px] font-bold text-primary hover:underline uppercase tracking-wide">
                Ver Tudo
              </Link>
            </div>
          )}
          <div className="space-y-2.5 px-3">
            {(team || []).map((member) => (
              <div key={member.id} className="flex items-center gap-2.5 overflow-hidden">
                {member.foto_url ? (
                  <img
                    src={member.foto_url}
                    alt={member.nome}
                    className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm ${getColorClass(member.nome)}`}>
                    {getInitials(member.nome)}
                  </div>
                )}
                {!collapsed && (
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold text-foreground truncate leading-tight">{member.nome}</span>
                    <span className="text-[8px] font-bold text-muted-foreground/75 truncate mt-0.5">{member.cargo?.nome || getRoleLabel(member.role)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SETTINGS / ADMIN SECTION */}
        <div>
          {!collapsed && (
            <span className="px-3 text-[9px] uppercase font-extrabold text-muted-foreground/60 tracking-widest block mb-2">
              Ajustes
            </span>
          )}
          <div className="space-y-1">
            <Link
              href="/configuracoes"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all relative group ${
                pathname === '/configuracoes' 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {pathname === '/configuracoes' && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Settings className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                pathname === '/configuracoes' ? 'text-primary' : 'text-muted-foreground'
              }`} />
              {!collapsed && <span className="truncate">Configurações</span>}
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all relative group ${
                    pathname === '/admin' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pathname === '/admin' && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <UserCheck className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    pathname === '/admin' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  {!collapsed && <span className="truncate">Painel Admin</span>}
                </Link>

                <Link
                  href="/admin/cargos"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold transition-all relative group ${
                    pathname === '/admin/cargos' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pathname === '/admin/cargos' && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Shield className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    pathname === '/admin/cargos' ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  {!collapsed && <span className="truncate">Cargos & Permissões</span>}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* User Section / Bottom */}
      <div className="p-3 border-t border-border bg-background/20 space-y-2 shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="text-[11px] font-bold text-foreground truncate leading-tight">{user.nome}</h4>
            <div className="flex items-center gap-1 mt-1">
              {user.role === 'admin' ? (
                <Shield className="w-2.5 h-2.5 text-primary" />
              ) : (
                <Briefcase className="w-2.5 h-2.5 text-muted-foreground" />
              )}
              <span className="text-[8px] font-bold text-muted-foreground capitalize tracking-wider uppercase">
                {user.cargo?.nome || (user.role === 'admin' ? 'Administrador' : user.role === 'perito' ? 'Perito' : 'Assistente')}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold text-destructive hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0 text-destructive" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
