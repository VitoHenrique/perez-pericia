"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, User, AlertTriangle, ShieldCheck, ArrowLeft, Loader2, Award, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState('assistente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao efetuar cadastro.');
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
          Criar sua conta
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
          Sistema de Gestão Perez Perícia
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border/80 py-7 px-6 sm:px-9 rounded-xl shadow-sm"
        >
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-destructive shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-destructive">{error}</span>
            </div>
          )}

          <form className="space-y-5 text-xs font-semibold text-muted-foreground" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="register-name" className="block text-foreground mb-1.5">
                Nome Completo
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium transition-all"
                  placeholder="ex: Dr. Fernando Perez"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="block text-foreground mb-1.5">
                Endereço de E-mail
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className="block text-foreground mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-xs text-foreground font-medium transition-all"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <button
                id="register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-bold text-background bg-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Registrando...
                  </>
                ) : (
                  'Registrar e Começar'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-border/60 pt-5 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Já tem uma conta?{' '}
              <Link id="register-login-link" href="/login" className="font-bold text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span className="uppercase tracking-wider">Políticas de privacidade ativas</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
