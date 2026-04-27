import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from './Icon.jsx';

const ToastCtx = createContext(null);
let idSeq = 0;

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) { clearTimeout(tm); timers.current.delete(id); }
  }, []);

  const push = useCallback((toast) => {
    const id = ++idSeq;
    const t = { id, kind: 'info', duration: 3200, ...toast };
    setItems((arr) => [...arr, t]);
    timers.current.set(id, setTimeout(() => remove(id), t.duration));
  }, [remove]);

  useEffect(() => () => {
    timers.current.forEach((tm) => clearTimeout(tm));
    timers.current.clear();
  }, []);

  const value = {
    success: (text) => push({ kind: 'success', text }),
    error:   (text) => push({ kind: 'error', text, duration: 5000 }),
    info:    (text) => push({ kind: 'info', text }),
  };

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-[calc(100vw-2rem)] w-80">
        <AnimatePresence>
          {items.map((t) => {
            const tone = t.kind === 'success' ? 'border-emerald-400/40 text-emerald-200'
              : t.kind === 'error' ? 'border-red-400/40 text-red-200'
              : 'border-white/15 text-white/85';
            const iconName = t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'image';
            return (
              <motion.div
                key={t.id}
                initial= opacity: 0, y: -8, scale: 0.98 
                animate= opacity: 1, y: 0, scale: 1 
                exit= opacity: 0, y: -8, scale: 0.98 
                transition= duration: 0.18 
                className={`glass-strong px-3.5 py-2.5 flex items-start gap-2.5 ${tone}`}
                role="status"
              >
                <Icon name={iconName} size={16} className="mt-0.5 shrink-0" />
                <span className="text-sm leading-snug flex-1">{t.text}</span>
                <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 shrink-0" aria-label="Close">
                  <Icon name="close" size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastCtx);
  if (!v) {
    // Safe no-op fallback in case a component renders outside the provider.
    return { success: () => {}, error: () => {}, info: () => {} };
  }
  return v;
}
