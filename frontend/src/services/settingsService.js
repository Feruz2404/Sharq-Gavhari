import { api } from './api.js';

export const settingsService = {
  get:    () => api.get('/settings').then((r) => r.data),
  update: (body) => api.put('/settings', body).then((r) => r.data),
};
