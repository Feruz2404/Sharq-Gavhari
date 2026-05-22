import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SUPPORTED = ['uz', 'ru', 'en'];

export const useLanguageStore = create(persist(
  (set, get) => ({
    language: 'uz',
    // True once the user has explicitly picked a language via the switcher.
    // setLanguageFromSettings only fills the language while this is still
    // false so an explicit manual choice always wins over the server-side
    // restaurant default.
    userPicked: false,
    setLanguage: (lng) => set({
      language: SUPPORTED.includes(lng) ? lng : 'uz',
      userPicked: true,
    }),
    setLanguageFromSettings: (lng) => {
      if (!lng || !SUPPORTED.includes(lng)) return;
      if (get().userPicked) return;
      if (get().language === lng) return;
      set({ language: lng });
    },
    getLanguage: () => get().language || 'uz',
  }),
  { name: 'sg_lang' }
));
