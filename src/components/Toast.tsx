'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-primary shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-500/30 bg-card text-foreground',
    error: 'border-rose-500/30 bg-card text-foreground',
    info: 'border-primary/30 bg-card text-foreground',
  };

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${borderColors[toast.type]}`}
    >
      <div className="flex items-start space-x-2.5">
        <div className="mt-0.5">{icons[toast.type]}</div>
        <div>
          <h4 className="text-xs font-bold font-mono tracking-tight">{toast.title}</h4>
          {toast.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              {toast.description}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground hover:text-foreground ml-3 -mr-1 -mt-1 p-1 rounded-md"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
