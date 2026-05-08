import React, { createContext, useCallback, useContext, useReducer } from 'react';
import type { ToastMessage } from '../types';

// ─── State ──────────────────────────────────────────────────────────────────

interface ToastState {
  toasts: ToastMessage[];
}

type ToastAction =
  | { type: 'ADD'; payload: ToastMessage }
  | { type: 'REMOVE'; payload: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD':
      return { toasts: [...state.toasts, action.payload] };
    case 'REMOVE':
      return { toasts: state.toasts.filter((t) => t.id !== action.payload) };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  const showToast = useCallback((type: ToastMessage['type'], message: string, duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'ADD', payload: { id, type, message, duration } });
    setTimeout(() => dispatch({ type: 'REMOVE', payload: id }), duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', payload: id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
