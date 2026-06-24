"use client";

import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface ModalContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal deve ser utilizado dentro de um ModalProvider');
  }
  return context;
}

export default function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'alert' | 'confirm'>('alert');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  const resolveRef = useRef<((value: any) => void) | null>(null);

  const showAlert = (message: string, title: string = 'Aviso') => {
    setTitle(title);
    setMessage(message);
    setType('alert');
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve as any;
    });
  };

  const showConfirm = (message: string, title: string = 'Confirmação') => {
    setTitle(title);
    setMessage(message);
    setType('confirm');
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleAction = (result: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleAction(false)}
              className="absolute inset-0 bg-background/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="bg-card border border-border/80 rounded-2xl w-full max-w-sm shadow-xl shadow-black/10 p-6 relative z-10 flex flex-col items-center text-center space-y-4"
            >
              {/* Icon Banner */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                type === 'alert'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                  : 'bg-primary/10 text-primary border border-primary/10'
              }`}>
                {type === 'alert' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>

              {/* Title & Message */}
              <div className="space-y-1.5 w-full">
                <h3 className="font-outfit text-sm font-extrabold text-foreground uppercase tracking-wider">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold leading-relaxed whitespace-pre-wrap px-2">
                  {message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full pt-2">
                {type === 'confirm' && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleAction(false)}
                    className="flex-1 text-center bg-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground text-[11px] font-bold py-2.5 rounded-xl border border-border transition-all cursor-pointer"
                  >
                    Cancelar
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAction(true)}
                  className="flex-1 text-center bg-primary hover:bg-primary/95 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-primary/10"
                >
                  Confirmar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}
