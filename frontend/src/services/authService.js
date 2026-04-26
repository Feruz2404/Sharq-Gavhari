import { api } from './api.js';

export const authService = {
  // Sends both `login` and `email` keys for backend compatibility.
  login: (identifier, password) =>
    api.post('/auth/login', { login: identifier, email: identifier, password }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};
