"use client";

import React, { useEffect, useState } from 'react';
import { Settings, Shield, User, Bell, Sliders, Moon, Sun, Loader2, Save } from 'lucide-react';
import { useModal } from '@/components/ModalProvider';

export default function ConfiguracoesPage() {
  const { showAlert } = useModal();
  const [theme, setTheme] = useState('light');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    // Get Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Get User info
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserName(data.user.nome);
          setUserEmail(data.user.email);
          setUserRole(data.user.role);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleThemeChange = (newTheme: string) => {
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    // Simulating profile save
    await new Promise(resolve => setTimeout(resolve, 1000));
    await showAlert('Perfil atualizado com sucesso! (Função simulada no MVP)');
    setSaveLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Title */}
      <div>
        <h2 className="font-outfit text-2xl font-extrabold text-foreground">
          Configurações do Sistema
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Gerencie seu perfil de atuação técnica, segurança e preferências visuais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="bg-card border border-border rounded-2xl p-4 h-fit space-y-1">
          <button className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-white flex items-center gap-2 shadow-md shadow-primary/10">
            <User className="w-4.5 h-4.5" />
            Meu Perfil
          </button>
          <button onClick={() => showAlert('Disponível na versão final.')} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground transition-all flex items-center gap-2">
            <Shield className="w-4.5 h-4.5" />
            Segurança & Senha
          </button>
          <button onClick={() => showAlert('Disponível na versão final.')} className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground transition-all flex items-center gap-2">
            <Bell className="w-4.5 h-4.5" />
            Notificações
          </button>
        </div>

        {/* Content Panel */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Theme card */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-outfit text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Sliders className="w-5 h-5 text-primary shrink-0" />
              Preferência de Tema Visual
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border bg-background hover:border-muted text-muted-foreground'
                }`}
              >
                <Sun className="w-6 h-6" />
                <span className="text-xs font-bold">Tema Claro</span>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border bg-background hover:border-muted text-muted-foreground'
                }`}
              >
                <Moon className="w-6 h-6" />
                <span className="text-xs font-bold">Tema Escuro</span>
              </button>
            </div>
          </div>

          {/* Profile form */}
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="font-outfit text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3 mb-6">
              <User className="w-5 h-5 text-primary shrink-0" />
              Dados do Profissional
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-foreground">Nome do Perito</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none text-foreground text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-foreground">Perfil de Acesso</label>
                  <input
                    type="text"
                    disabled
                    value={userRole}
                    className="block w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none text-muted-foreground text-sm font-bold capitalize"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-foreground">E-mail Cadastrado</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-background border border-border rounded-xl focus:outline-none text-foreground text-sm font-medium"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
                >
                  {saveLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Dados
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
