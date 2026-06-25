"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  Bell, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  User,
  Clock,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityLog {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'DELETED' | 'MOVED' | 'LOGIN' | 'LOGOUT';
  entityType: 'Processo' | 'Honorario' | 'Usuario' | 'Vistoria';
  entityId: string;
  details: any;
  timestamp: string;
  userId: string;
  user: {
    nome: string;
    foto_url?: string | null;
  };
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar logs de atividade recentes
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
        
        // Calcular não lidas baseado no localStorage do último clique
        const lastReadTime = localStorage.getItem('last_notifications_read') || '1970-01-01T00:00:00.000Z';
        const unread = data.notifications.filter(
          (n: ActivityLog) => new Date(n.timestamp).getTime() > new Date(lastReadTime).getTime()
        );
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll a cada 60 segundos
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      // Marcar todas como lidas
      localStorage.setItem('last_notifications_read', new Date().toISOString());
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  // Helper para formatar o tempo relativo
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays} d`;
  };

  // Mapeamento de status amigável
  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      nomeacao_judicial: 'Nomeação Judicial',
      pesquisa_dje: 'Pesquisa DJE',
      aguardando_doc: 'Aguardando Doc.',
      diligencia: 'Diligência',
      confeccao_envelope: 'Confecção Envelope',
      estimativa_honorarios: 'Estimativa Honorários',
      elaboracao: 'Elaboração',
      revisao: 'Revisão',
      concluido: 'Concluído',
    };
    return labels[status] || status;
  };

  // Humanizar a mensagem de log
  const humanizeNotification = (log: ActivityLog) => {
    const details = log.details || {};
    const actorName = log.user?.nome || 'Alguém';

    if (log.entityType === 'Processo') {
      if (log.action === 'CREATED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> cadastrou o processo{' '}
            <span className="text-primary font-bold">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
      if (log.action === 'MOVED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> alterou o status do processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span> para{' '}
            <span className="text-primary font-bold">{getStatusLabel(details.status_novo)}</span>.
          </span>
        );
      }
      if (log.action === 'UPDATED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> atualizou dados do processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
      if (log.action === 'DELETED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> excluiu o processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
    }

    if (log.entityType === 'Honorario') {
      const valorStr = details.valor_total 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.valor_total)
        : 'N/A';
      if (log.action === 'CREATED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> adicionou honorários de{' '}
            <span className="text-success font-bold">{valorStr}</span> no processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
      if (log.action === 'UPDATED') {
        const pagLabel = details.status_pagamento === 'pago' ? 'Pago' : details.status_pagamento === 'parcial' ? 'Pago Parcial' : 'Pendente';
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> atualizou honorários do processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span> para{' '}
            <span className="text-primary font-bold">{pagLabel}</span>.
          </span>
        );
      }
    }

    if (log.entityType === 'Vistoria') {
      const dataStr = details.data ? new Date(details.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
      if (log.action === 'CREATED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> agendou vistoria dia{' '}
            <span className="text-foreground font-bold">{dataStr} {details.hora}</span> para o processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
      if (log.action === 'DELETED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> cancelou a vistoria do processo{' '}
            <span className="font-bold text-foreground">{details.numero_processo || 'N/A'}</span>.
          </span>
        );
      }
    }

    if (log.entityType === 'Usuario') {
      if (log.action === 'UPDATED') {
        return (
          <span>
            <strong className="text-foreground">{actorName}</strong> atualizou dados do perfil profissional.
          </span>
        );
      }
    }

    // Fallback humanizado genérico
    return (
      <span>
        <strong className="text-foreground">{actorName}</strong> realizou uma ação em {log.entityType}.
      </span>
    );
  };

  // Definir ícone e cor por tipo de notificação
  const getNotificationVisuals = (log: ActivityLog) => {
    if (log.entityType === 'Processo') {
      if (log.action === 'CREATED') {
        return {
          icon: <Plus className="w-3.5 h-3.5" />,
          color: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
        };
      }
      if (log.action === 'MOVED') {
        return {
          icon: <ArrowRight className="w-3.5 h-3.5" />,
          color: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
        };
      }
      if (log.action === 'DELETED') {
        return {
          icon: <Trash2 className="w-3.5 h-3.5" />,
          color: 'bg-red-500/10 text-red-500 border border-red-500/20'
        };
      }
      return {
        icon: <FileText className="w-3.5 h-3.5" />,
        color: 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
      };
    }

    if (log.entityType === 'Honorario') {
      return {
        icon: <DollarSign className="w-3.5 h-3.5" />,
        color: 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
      };
    }

    if (log.entityType === 'Vistoria') {
      return {
        icon: <Calendar className="w-3.5 h-3.5" />,
        color: 'bg-violet-500/10 text-violet-500 border border-violet-500/20'
      };
    }

    return {
      icon: <User className="w-3.5 h-3.5" />,
      color: 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Sino trigger button */}
      <button
        onClick={handleToggle}
        className={`w-9 h-9 sm:w-8 sm:h-8 rounded-lg hover:bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative cursor-pointer ${
          isOpen ? 'bg-muted/40 text-foreground border-primary/30' : ''
        }`}
        title="Atividades Recentes"
      >
        <Bell className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        
        {/* Badge vermelho pulsante */}
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </button>

      {/* Pop-over Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2.5 w-[330px] bg-card border border-border/80 rounded-2xl shadow-xl shadow-black/10 z-50 overflow-hidden glass-effect backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-muted/20 border-b border-border/60 flex items-center justify-between">
              <div>
                <h4 className="font-outfit text-xs font-extrabold text-foreground uppercase tracking-wider">
                  Atividade Recente
                </h4>
                <p className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                  Últimas 24 horas no escritório
                </p>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded">
                  {notifications.length} logs
                </span>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/40">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Clock className="w-6 h-6 text-muted-foreground/35" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Sem atividades recentes</span>
                </div>
              ) : (
                notifications.map((log) => {
                  const visuals = getNotificationVisuals(log);
                  return (
                    <div 
                      key={log.id} 
                      className="p-3.5 flex gap-3 hover:bg-muted/15 transition-colors text-[10px] font-semibold text-muted-foreground leading-relaxed"
                    >
                      {/* Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${visuals.color}`}>
                        {visuals.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="pr-1 text-muted-foreground">
                          {humanizeNotification(log)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground/75 font-bold">
                          {log.user?.foto_url ? (
                            <img
                              src={log.user.foto_url}
                              alt={log.user.nome}
                              className="w-3.5 h-3.5 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-primary to-violet-400 flex items-center justify-center text-white font-extrabold text-[7px]">
                              {log.user?.nome?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                          <span>{log.user?.nome}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5 text-[8px]">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border/40 bg-muted/10 text-center">
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                Sincronizado em tempo real
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
