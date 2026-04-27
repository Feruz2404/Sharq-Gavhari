import { create } from 'zustand';
import { settingsService } from '../services/settingsService.js';

/**
 * Push the customizable accent color into a CSS variable.
 *
 * NOTE: we intentionally do NOT push `s.background_image_url` into
 * `--bg-image` anymore. The uploaded background image is now used
 * exclusively as the customer-menu HERO visual; the page-wide background
 * stays a fixed cinematic gradient (see index.css) so the two main visuals
 * never duplicate each other.
 */
function applyCssVars(s) {
  if (!s) return;
  if (s.accent_color) {
    document.documentElement.style.setProperty('--accent', s.accent_color);
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
