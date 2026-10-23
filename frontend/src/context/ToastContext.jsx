import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ type = 'success', title, message }) => {
      const id = nextId++;
      setToasts((current) => [...current.slice(-2), { id, type, title, message }]);
      const timer = setTimeout(() => dismiss(id), 6000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const value = { pushToast, dismiss };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-white/10 bg-ink-900/95 px-4 py-3 text-sm text-sand-50 shadow-2xl backdrop-blur"
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-courtly-300" aria-hidden="true" />
            )}
            <div className="flex-1">
              {toast.title ? <p className="font-semibold">{toast.title}</p> : null}
              {toast.message ? (
                <p className="text-sand-200/80">{toast.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 text-sand-200/70 transition hover:bg-white/10 hover:text-white focus-ring"
              aria-label="Dismiss notification"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
