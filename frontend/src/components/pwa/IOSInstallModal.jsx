import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import { useT } from '../../locales/useT.js';

// Named motion props (avoid inline double-brace object literals).
const BACKDROP_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};
const CARD_RISE = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: { duration: 0.25 },
};

/**
 * iOS "Add to Home Screen" instructions modal. Rendered via portal so it
 * floats above any header / card / backdrop-filter stacking context.
 */
export default function IOSInstallModal({ open, onClose }) {
  const t = useT();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          {...BACKDROP_FADE}
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-6 pt-10 sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t('pwa.iosTitle')}
        >
          <motion.div
            {...CARD_RISE}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0B0B0B]/95 shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Soft gold glow */}
            <div className="pointer-events-none absolute -top-24 -right-16 w-56 h-56 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />

            <div className="relative px-6 pt-6 pb-2 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-gold/15 ring-1 ring-gold/40 grid place-items-center text-gold">
                  <Icon name="install" size={20} />
                </div>
                <div className="min-w-0">
                  <div className="font-display gold-text text-lg leading-tight">
                    {t('pwa.iosTitle')}
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/45 mt-1">
                    iPhone · iPad · Safari
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon shrink-0"
                aria-label={t('pwa.close')}
                title={t('pwa.close')}
              >
                <Icon name="close" size={16} className="text-white/80" />
              </button>
            </div>

            <div className="relative px-6 py-4 text-sm text-white/85 leading-relaxed">
              {t('pwa.iosIntro')}
            </div>

            <ol className="relative px-6 pb-4 grid gap-3">
              <Step n={1} icon={<ShareIcon />} text={t('pwa.iosStep1')} />
              <Step n={2} icon={<PlusSquareIcon />} text={t('pwa.iosStep2')} />
              <Step n={3} icon={<CheckIcon />} text={t('pwa.iosStep3')} />
            </ol>

            <div className="relative mx-6 mb-6 mt-1 rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold/90">
              {t('pwa.iosTip')}
            </div>

            <div className="relative px-6 pb-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-gold w-full justify-center"
              >
                <Icon name="check" size={16} />
                <span>{t('pwa.gotIt')}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Step({ n, icon, text }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gold/15 ring-1 ring-gold/40 grid place-items-center font-display text-gold text-sm">
        {n}
      </div>
      <div className="flex-1 min-w-0 text-[13px] text-white/90 leading-snug">
        {text}
      </div>
      <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center text-white/85">
        {icon}
      </div>
    </li>
  );
}

// iOS Share icon (square with up arrow).
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

// Plus-in-square icon for "Add to Home Screen".
function PlusSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}
