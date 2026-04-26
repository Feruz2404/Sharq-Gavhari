import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService.js';

export const useAuthStore = create(persist(
  (set, get) => ({
    token: null,
    admin: null,

    login: async (identifier, password) => {
      const { token, admin } = await authService.login(identifier, password);
      set({ token, admin });
      return admin;
    },

    logout: () => set({ token: null, admin: null }),

    checkAuth: async () => {
      try {
        const { admin } = await authService.me();
        set({ admin });
        return true;
      } catch (e) {
        set({ token: null, admin: null });
        return false;
      }
    },
  }),
  {
    name: 'sg_auth',
    partialize: (s) => ({ token: s.token, admin: s.admin }),
  }
));
