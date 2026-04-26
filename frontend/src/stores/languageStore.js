import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SUPPORTED = ['uz', 'ru', 'en'];

export const useLanguageStore = create(persist(
  (set, get) => ({
    language: 'uz',
    setLanguage: (lng) => set({ language: SUPPORTED.includes(lng) ? lng : 'uz' }),
    getLanguage: () => get().language || 'uz',
  }),
  { name: 'sg_lang' }
));
