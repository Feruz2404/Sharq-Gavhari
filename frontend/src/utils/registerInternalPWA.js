// Register / unregister the internal service worker. Only used on /tablet and /admin routes.
let registered = false;

export async function registerInternalPWA() {
  if (registered) return;
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw-internal.js', { scope: '/' });
    registered = true;
  } catch (e) {
    console.warn('[pwa] register failed', e);
  }
}

export async function unregisterInternalPWA() {
  if (!('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  registered = false;
}
