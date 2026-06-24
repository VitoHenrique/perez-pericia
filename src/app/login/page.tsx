"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, AlertTriangle, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useModal } from '@/components/ModalProvider';

function LoginForm() {
  const { showAlert } = useModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao efetuar login.');
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      {/* Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-6 ml-4 sm:ml-0 uppercase tracking-wider">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Home
        </Link>
        <div className="flex justify-center mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-violet-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-primary/20">
            P
          </div>
        </div>
        <h1 className="font-outfit text-2xl font-extrabold text-center text-foreground tracking-tight uppercase">
          Login de Acesso
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Sistema de Gestão Perez Perícia
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-card border border-border/80 py-7 px-6 sm:px-9 rounded-xl shadow-sm">
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-destructive shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-destructive">{error}</span>
            </div>
          )}

          <form className="space-y-5 text-xs font-semibold text-muted-foreground" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login-email" className="block text-foreground mb-1.5">
                Endereço de E-mail
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium transition-all"
                  placeholder="exemplo@perito.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-foreground">
                  Sua Senha
                </label>
                <button
                  type="button"
                  onClick={() => showAlert('Para redefinir sua senha, contate a administração.')}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-background bg-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Autenticando...
                  </>
                ) : (
                  'Entrar no Painel'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Novo na plataforma?{' '}
              <Link id="login-register-link" href="/cadastro" className="font-bold text-primary hover:underline">
                Crie sua credencial
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span className="uppercase tracking-wider">Conexão segura SSL e criptografia local</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
