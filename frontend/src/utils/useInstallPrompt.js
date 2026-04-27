import { useEffect, useState, useCallback } from 'react';

/**
 * Wraps the `beforeinstallprompt` event so any page can render an Install
 * button. The browser only fires this event when the page meets PWA install
 * criteria (manifest + service worker + HTTPS), so we never show the button
 * unless the browser actually allows installation.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // Hide the button when running standalone (already installed).
    const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    if (mq && mq.matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return { canInstall: !!deferred && !installed, install, installed };
}
