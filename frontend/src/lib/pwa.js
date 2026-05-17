// Centralized PWA gatekeeper.
//
// QR visitors must NEVER see an install affordance and must NEVER have a
// service worker register. This module is the single source of truth for
// detecting QR mode and enforcing those rules across the app.
//
// QR mode is set by:
//   - the /qr/:tableId entry route (QrEntryPage), or
//   - any URL that carries the `?qr=1` query parameter, or
//   - a previously persisted `sessionStorage["qrMode"]` value (so a guest who
//     navigates from /menu to /cart and back keeps QR mode for the session).

const QR_MODE_KEY = 'qrMode';
const QR_TABLE_ID_KEY = 'qrTableId';
const QR_TABLE_LABEL_KEY = 'qrTableLabel';

function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch (_) { return null; }
}
function safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch (_) {}
}

export function isQrMode() {
  if (typeof window === 'undefined') return false;
  if (safeSessionGet(QR_MODE_KEY) === 'true') return true;
  try {
    const path = window.location.pathname || '';
    if (path === '/qr' || path.startsWith('/qr/')) return true;
    const sp = new URLSearchParams(window.location.search || '');
    if (sp.get('qr') === '1') return true;
  } catch (_) {}
  return false;
}

export function markQrMode(tableId, tableLabel) {
  safeSessionSet(QR_MODE_KEY, 'true');
  if (tableId)    safeSessionSet(QR_TABLE_ID_KEY, String(tableId));
  if (tableLabel) safeSessionSet(QR_TABLE_LABEL_KEY, String(tableLabel));
}

export function getQrTable() {
  return {
    id: safeSessionGet(QR_TABLE_ID_KEY),
    label: safeSessionGet(QR_TABLE_LABEL_KEY),
  };
}

export async function unregisterServiceWorkerForQrMode() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  } catch (e) {
    console.warn('[pwa] failed to unregister service workers for QR mode', e);
  }
}

// One-shot side effect that strips any cached manifest link and unregisters
// any active service worker when QR mode is on. Safe to call repeatedly.
export function enforceQrModeIfNeeded() {
  if (!isQrMode()) return false;
  unregisterServiceWorkerForQrMode();
  try {
    document.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove());
    document.querySelectorAll('link[rel="sg-disabled-manifest"]').forEach((l) => l.remove());
  } catch (_) {}
  return true;
}

// For callers that want a single entry point at boot. Pass the registration
// function (e.g. registerInternalPWA) and we'll either run it or refuse it.
export async function enablePwaIfAllowed(registerFn) {
  if (isQrMode()) {
    await unregisterServiceWorkerForQrMode();
    return false;
  }
  if (typeof registerFn === 'function') {
    try { await registerFn(); } catch (_) {}
  }
  return true;
}
