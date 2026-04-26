import { api } from './api.js';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  me:    () => api.get('/auth/me').then((r) => r.data),
};
