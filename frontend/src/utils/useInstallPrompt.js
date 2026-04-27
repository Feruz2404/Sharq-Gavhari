import { useEffect, useState, useCallback } from 'react';

/**
 * Detect the install platform of the current browser:
 *   - 'ios'         : iPhone / iPad / iPod, including iPadOS 13+ "desktop mode"
 *                     where Safari reports MacIntel + touch points. iOS Safari
 *                     never fires `beforeinstallprompt`, so we must show a
 *                     manual instructions modal.
 *   - 'native'      : Any other browser. We listen for `beforeinstallprompt`
 *                     and trigger `prompt()` on click (Android Chrome,
 *                     desktop Chrome / Edge, Samsung Internet, ...).
 *   - 'unsupported' : SSR / no `window`.
 */
function detectPlatform() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'unsupported';
  const ua = navigator.userAgent || '';
  const isIOSUA = /iPhone|iPad|iPod/i.test(ua);
  // iPadOS 13+ Safari (and "Request Desktop Site" on iPad) reports as MacIntel
  // but exposes touch points. window.MSStream rules out old IE on Windows.
  const isIPadDesktop =
    navigator.platform === 'MacIntel' &&
    (navigator.maxTouchPoints || 0) > 1 &&
    !window.MSStream;
  if (isIOSUA || isIPadDesktop) return 'ios';
  return 'native';
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  // iOS uses navigator.standalone; everything else uses display-mode media query.
  if (window.navigator && window.navigator.standalone === true) return true;
  if (window.matchMedia) {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  }
  return false;
}

/**
 * Wraps the `beforeinstallprompt` event so any page can render an Install
 * button. On iOS Safari, where that event is never fired, we still report
 * `canInstall: true` (when the app is not running standalone) and expose
 * `platform === 'ios'` so the caller can open a manual instructions modal
 * instead of calling `install()`.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(() => detectStandalone());
  // Platform is stable for the lifetime of the page — compute once.
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    // React to display-mode changes (e.g. user just installed the PWA).
    const mq = window.matchMedia && window.matchMedia('(display-mode: standalone)');
    const onMq = (e) => { if (e.matches) setInstalled(true); };
    if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  // Show the install affordance when:
  //   - Not already installed/standalone, AND
  //   - Either the browser fired beforeinstallprompt (native), OR we're on iOS
  //     where the event never fires but Add-to-Home-Screen is still possible.
  const canInstall = installed
    ? false
    : platform === 'ios'
      ? true
      : !!deferred;

  return { canInstall, install, installed, platform };
}
