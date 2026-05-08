import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { ToastMessage } from '../../types';
import './Toast.css';

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  return (
    <div className={`toast toast--${toast.type}`} role="alert">
      <span className="toast__icon">
        <Icon size={17} strokeWidth={2.5} />
      </span>
      <span className="toast__message">{toast.message}</span>
      <button className="toast__close" onClick={() => onRemove(toast.id)} aria-label="Fermer">
        <X size={14} strokeWidth={2.5} />
      </button>
      <div className="toast__progress" style={{ animationDuration: `${toast.duration ?? 4000}ms` }} />
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  );
}
