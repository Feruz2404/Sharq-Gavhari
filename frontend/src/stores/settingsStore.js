import { create } from 'zustand';
import { settingsService } from '../services/settingsService.js';

// Static cinematic fallback gradient \u2014 must stay in sync with the
// `--bg-image` declaration in index.css. Used when no global background
// image is configured by the admin.
const FALLBACK_BG =
  'linear-gradient(135deg, #0B0907 0%, #050505 60%, #0B0907 100%)';

/**
 * Push customizable theme values into CSS custom properties so the public
 * customer app can pick them up without per-component prop drilling.
 *
 *   --accent     : settings.accent_color (defaults to existing :root value)
 *   --bg-image   : settings.global_background_image_url, rendered behind the
 *                  entire customer experience by the `.app-bg::before` rule
 *                  in index.css. Falls back to a dark cinematic gradient.
 *
 * NOTE: `settings.background_image_url` (the HERO / header image) is
 * intentionally NOT pushed into a CSS variable. The hero image is rendered
 * inline by the customer MenuPage hero card so it stays visually distinct
 * from the full-page global background.
 */
function applyCssVars(s) {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  if (s && s.accent_color) {
    root.style.setProperty('--accent', s.accent_color);
  }
  const globalBg = s && s.global_background_image_url;
  if (globalBg) {
    root.style.setProperty('--bg-image', `url("${globalBg}")`);
  } else {
    root.style.setProperty('--bg-image', FALLBACK_BG);
  }
}

export const useSettingsStore = create((set, get) => ({
  settings: null,
  loading: false,

  fetchSettings: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const s = await settingsService.get();
      applyCssVars(s);
      set({ settings: s });
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: async (patch) => {
    const s = await settingsService.update(patch);
    applyCssVars(s);
    set({ settings: s });
    return s;
  },
}));
