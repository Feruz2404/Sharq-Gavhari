// frontend/src/lib/menuCache.js
//
// Tiny session-scoped cache + version helpers for the customer menu.
//
// Scope of this module (intentionally narrow):
//   - Stores the most recent menu payload ({ cats, prods }) in sessionStorage
//     so that re-entering /menu inside the same tab is instant.
//   - Stores the most recent server menu version (an ISO timestamp from
//     GET /api/menu/version) so the customer page can detect when admin
//     changes happened on another device / tab.
//   - Exposes a small "dirty" flag so admin save / delete actions can
//     mark the cache as stale even before the next poll.
//
// Things this module deliberately does NOT touch:
//   - sg_lang        (selected UI language)
//   - sg_qr / sg_table_id  (active QR session)
//   - cart state     (zustand persisted cart)
// Those keep working across invalidations because we never call
// sessionStorage.clear() / localStorage.clear() — only the menu keys.

const CACHE_KEY = 'sg_menu_cache_v1';
const VERSION_KEY = 'sg_menu_version_v1';
const DIRTY_KEY = 'sg_menu_dirty_v1';

// In-memory fallback used when sessionStorage is unavailable (private
// mode in some browsers, embedded webviews, etc.). Mirrors the keys.
const mem = { cache: null, version: null, dirty: false };

function safeGet(key) {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem(key);
  } catch (_e) { return null; }
}
function safeSet(key, value) {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch (_e) { /* quota / disabled — ignore */ }
}

// ---- Menu payload (cats + prods) ------------------------------------------------

export function getCachedMenu() {
  const raw = safeGet(CACHE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (_e) { /* fallthrough */ }
  }
  return mem.cache;
}

export function setCachedMenu(data) {
  if (!data || typeof data !== 'object') return;
  mem.cache = data;
  try { safeSet(CACHE_KEY, JSON.stringify(data)); } catch (_e) { /* ignore */ }
  // Setting fresh data clears the dirty bit — the freshly-stored payload
  // came from the live API so it is not stale.
  mem.dirty = false;
  safeSet(DIRTY_KEY, null);
}

export function clearMenuCache() {
  mem.cache = null;
  mem.version = null;
  mem.dirty = true;
  safeSet(CACHE_KEY, null);
  safeSet(VERSION_KEY, null);
  safeSet(DIRTY_KEY, '1');
}

// ---- Version polling -----------------------------------------------------------

export function getCachedVersion() {
  const v = safeGet(VERSION_KEY);
  return v || mem.version || null;
}

export function setCachedVersion(version) {
  mem.version = version || null;
  safeSet(VERSION_KEY, version || null);
}

// ---- Dirty flag ----------------------------------------------------------------

export function markMenuDirty() {
  mem.dirty = true;
  safeSet(DIRTY_KEY, '1');
}

export function isMenuDirty() {
  if (mem.dirty) return true;
  return safeGet(DIRTY_KEY) === '1';
}

export default {
  getCachedMenu,
  setCachedMenu,
  clearMenuCache,
  getCachedVersion,
  setCachedVersion,
  markMenuDirty,
  isMenuDirty,
};
