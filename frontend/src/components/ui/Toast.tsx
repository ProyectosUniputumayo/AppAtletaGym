import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lg',
                'bg-white dark:bg-gray-900',
                toast.type === 'success' && 'border-emerald-200 dark:border-emerald-900',
                toast.type === 'error' && 'border-red-200 dark:border-red-900',
                toast.type === 'info' && 'border-blue-200 dark:border-blue-900',
              )}
            >
              {toast.type === 'success' ? (
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
              ) : toast.type === 'info' ? (
                <Info
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              )}
              <p className="flex-1 text-sm text-gray-800 dark:text-gray-200">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
