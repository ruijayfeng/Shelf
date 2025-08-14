'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: ReactNode;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, newToast.duration);
    }
  }, [dismiss]);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastComponent({ toast, onDismiss }: ToastComponentProps) {
  const { type, title, description, action, id } = toast;

  const variants = {
    initial: { opacity: 0, x: 300, scale: 0.3 },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      scale: 0.5,
      transition: {
        duration: 0.2
      }
    },
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      className: 'border-green-200 bg-green-50 text-green-900',
      iconClassName: 'text-green-500',
    },
    error: {
      icon: XCircle,
      className: 'border-red-200 bg-red-50 text-red-900',
      iconClassName: 'text-red-500',
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-900',
      iconClassName: 'text-yellow-500',
    },
    info: {
      icon: Info,
      className: 'border-blue-200 bg-blue-50 text-blue-900',
      iconClassName: 'text-blue-500',
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        'relative w-full rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        config.className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5', config.iconClassName)} />
        
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm">{title}</div>
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
          {action && <div className="mt-2">{action}</div>}
        </div>
        
        <button
          onClick={() => onDismiss(id)}
          className="flex-shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </motion.div>
  );
}

// Convenience functions
export const toast = {
  success: (title: string, description?: string) => {
    // This will be used with the hook
  },
  error: (title: string, description?: string) => {
    // This will be used with the hook
  },
  warning: (title: string, description?: string) => {
    // This will be used with the hook
  },
  info: (title: string, description?: string) => {
    // This will be used with the hook
  },
};