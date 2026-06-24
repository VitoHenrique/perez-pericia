"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sun, Moon, Plus, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

interface TopbarProps {
  userName: string;
}

export default function Topbar({ userName }: TopbarProps) {
  const { showAlert } = useModal();
  const pathname = usePathname();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  if (pathname === '/dashboard') return null;

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Painel de Controle';
    if (pathname === '/processos') return 'Lista de Processos';
    if (pathname === '/processos/novo') return 'Cadastrar Processo';
    if (pathname.startsWith('/processos/')) return 'Detalhes do Processo';
    if (pathname === '/kanban') return 'Quadro Kanban';
    if (pathname === '/financeiro') return 'Fluxo de Caixa / Honorários';
    if (pathname === '/agenda') return 'Agenda & Diligências';
    if (pathname === '/configuracoes') return 'Preferências e Ajustes';
    if (pathname === '/equipe') return 'Equipe do Escritório';
    if (pathname.startsWith('/admin')) return 'Painel do Administrador';
    return 'Sistema Pericial';
  };

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 border-b border-border/80 flex items-center justify-between px-6 sticky top-0 z-20 glass-effect backdrop-blur-md">
      <div>
        <h1 className="font-outfit text-sm font-extrabold text-foreground tracking-tight uppercase">
          {getPageTitle()}
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wider">
          <CalendarIcon className="w-3 h-3" />
          <span>{todayStr}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Action Button */}
        {pathname !== '/processos/novo' && (
          <Link
            href="/processos/novo"
            className="hidden sm:flex items-center gap-1 bg-foreground text-background hover:opacity-90 text-[11px] font-extrabold px-3 py-1.5 rounded-lg transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Processo
          </Link>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg hover:bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => showAlert('Não há novas notificações.')}
          className="w-8 h-8 rounded-lg hover:bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative cursor-pointer"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-border h-6">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-violet-400 flex items-center justify-center text-white font-extrabold text-[12px] shadow-sm select-none">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline text-[11px] font-bold text-foreground max-w-[120px] truncate">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}
