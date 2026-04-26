import { create } from 'zustand';
import { settingsService } from '../services/settingsService.js';

function applyCssVars(s) {
  if (!s) return;
  if (s.accent_color) document.documentElement.style.setProperty('--accent', s.accent_color);
  if (s.background_url) document.documentElement.style.setProperty('--bg-image', `url('${s.background_url}')`);
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
