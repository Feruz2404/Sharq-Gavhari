import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './router/AppRouter.jsx';
import { syncManifestForRoute } from './utils/manifestManager.js';
import { registerInternalPWA, unregisterInternalPWA } from './utils/registerInternalPWA.js';
import { useSettingsStore } from './stores/settingsStore.js';
import { ToastProvider } from './components/common/Toast.jsx';
import { enforceQrModeIfNeeded, isQrMode } from './lib/pwa.js';

export default function App() {
  const { pathname } = useLocation();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => { fetchSettings().catch(() => {}); }, [fetchSettings]);

  useEffect(() => {
    // QR visitors: ensure no SW + no manifest, on every route change.
    if (enforceQrModeIfNeeded()) {
      syncManifestForRoute(pathname); // runs the QR-mode no-op branch
      return;
    }
    syncManifestForRoute(pathname);
    if (isQrMode()) return; // belt-and-suspenders
    if (pathname.startsWith('/tablet') || pathname.startsWith('/admin')) {
      registerInternalPWA();
    } else {
      unregisterInternalPWA();
    }
  }, [pathname]);

  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
