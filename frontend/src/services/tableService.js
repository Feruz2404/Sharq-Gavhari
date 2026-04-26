import { api } from './api.js';

export const tableService = {
  list:   () => api.get('/tables').then((r) => r.data),
  get:    (id) => api.get(`/tables/${id}`).then((r) => r.data),
  create: (body) => api.post('/tables', body).then((r) => r.data),
  update: (id, body) => api.put(`/tables/${id}`, body).then((r) => r.data),
  setActive: (id, is_active) => api.patch(`/tables/${id}/active`, { is_active }).then((r) => r.data),
  remove: (id) => api.delete(`/tables/${id}`).then((r) => r.data),
};
