import { useEffect, useState } from 'react';
import { applySwUpdate } from '../../utils/registerInternalPWA.js';
import { useT } from '../../locales/useT.js';
import { isQrMode } from '../../lib/pwa.js';

export default function UpdateBanner() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // QR guests never get a service worker, so they cannot get an update event.
    // Skip wiring the listener at all to keep the code path obviously dead.
    if (isQrMode()) return;
    const onReady = () => setShow(true);
    window.addEventListener('sg:sw-update-ready', onReady);
    return () => window.removeEventListener('sg:sw-update-ready', onReady);
  }, []);

  if (isQrMode()) return null;
  if (!show) return null;

  const onUpdate = () => {
    setBusy(true);
    try { applySwUpdate(); } catch (_) {}
  };

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 px-4 w-[min(92vw,420px)]">
      <div className="glass-strong border border-gold/30 shadow-gold rounded-2xl px-3 py-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/30 grid place-items-center text-gold text-base">
          \u2728
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white/90 truncate">{t('pwa.updateAvailable')}</div>
        </div>
        <button
          onClick={onUpdate}
          disabled={busy}
          className="btn-gold text-xs px-3 py-1.5"
        >
          {busy ? t('pwa.updating') : t('pwa.update')}
        </button>
        <button
          onClick={() => setShow(false)}
          aria-label="Close"
          className="text-white/50 hover:text-white/90 text-lg leading-none px-1"
        >
          \u00d7
        </button>
      </div>
    </div>
  );
}
