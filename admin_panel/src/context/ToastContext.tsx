import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<Toast, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
      {children}
      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 text-white border-slate-800';
          let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-white text-slate-900 border-emerald-200 shadow-emerald-500/10';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-white text-slate-900 border-rose-200 shadow-rose-500/10';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-white text-slate-900 border-amber-200 shadow-amber-500/10';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
          } else if (toast.type === 'info') {
            bgClass = 'bg-white text-slate-900 border-blue-200 shadow-blue-500/10';
            icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all transform animate-slideIn ${bgClass}`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                <h5 className="font-bold text-sm leading-tight text-slate-900">{toast.title}</h5>
                {toast.message && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
