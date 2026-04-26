import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export function useInstallPrompt() {
  const { pathname } = useLocation();
  const allowed = pathname.startsWith('/tablet') || pathname.startsWith('/admin');
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!allowed) { setDeferred(null); return; }
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [allowed]);

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return { canInstall: allowed && !!deferred && !installed, install, installed };
}
