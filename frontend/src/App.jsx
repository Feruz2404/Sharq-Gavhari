import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './router/AppRouter.jsx';
import { syncManifestForRoute } from './utils/manifestManager.js';
import { registerInternalPWA, unregisterInternalPWA } from './utils/registerInternalPWA.js';
import { useSettingsStore } from './stores/settingsStore.js';

export default function App() {
  const { pathname } = useLocation();
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => { fetchSettings().catch(() => {}); }, [fetchSettings]);

  useEffect(() => {
    syncManifestForRoute(pathname);
    if (pathname.startsWith('/tablet') || pathname.startsWith('/admin')) {
      registerInternalPWA();
    } else {
      unregisterInternalPWA();
    }
  }, [pathname]);

  return <AppRouter />;
}
