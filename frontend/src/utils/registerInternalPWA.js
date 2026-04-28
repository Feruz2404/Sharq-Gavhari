// Register / unregister the internal service worker. Used on /tablet and /admin routes.
// Also exposes update-ready events so the UI can render an update banner.

let registered = false;
let currentRegistration = null;
let waitingWorker = null;
let reloading = false;

function dispatchUpdateReady() {
  try { window.dispatchEvent(new CustomEvent('sg:sw-update-ready')); } catch (_) {}
}

export async function registerInternalPWA() {
  if (registered) return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw-internal.js', { scope: '/' });
    registered = true;
    currentRegistration = reg;

    // If a new worker is already waiting (carry-over from previous session), surface it.
    if (reg.waiting && navigator.serviceWorker.controller) {
      waitingWorker = reg.waiting;
      dispatchUpdateReady();
    }

    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = reg.waiting || installing;
          dispatchUpdateReady();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  } catch (e) {
    console.warn('[pwa] register failed', e);
  }
}

export function applySwUpdate() {
  const w = waitingWorker || (currentRegistration && currentRegistration.waiting);
  if (w) {
    try { w.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
    // Fallback: if controllerchange does not fire (e.g. SW does not handle SKIP_WAITING), force reload.
    setTimeout(() => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    }, 1500);
  } else {
    window.location.reload();
  }
}

export async function unregisterInternalPWA() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  registered = false;
  currentRegistration = null;
  waitingWorker = null;
}
