import { api } from './api.js';

export const categoryService = {
  list:    () => api.get('/categories').then((r) => r.data),
  get:     (idOrSlug) => api.get(`/categories/${idOrSlug}`).then((r) => r.data),
  create:  (body) => api.post('/categories', body).then((r) => r.data),
  update:  (id, body) => api.put(`/categories/${id}`, body).then((r) => r.data),
  remove:  (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
