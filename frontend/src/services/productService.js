import { api } from './api.js';

export const productService = {
  list:       () => api.get('/products').then((r) => r.data),
  get:        (id) => api.get(`/products/${id}`).then((r) => r.data),
  byCategory: (categoryId) => api.get(`/products/category/${categoryId}`).then((r) => r.data),
  create:     (body) => api.post('/products', body).then((r) => r.data),
  update:     (id, body) => api.put(`/products/${id}`, body).then((r) => r.data),
  remove:     (id) => api.delete(`/products/${id}`).then((r) => r.data),
  setAvailability: (id, is_available) => api.patch(`/products/${id}/availability`, { is_available }).then((r) => r.data),
  setActive:       (id, is_active)    => api.patch(`/products/${id}/active`,       { is_active }).then((r) => r.data),
};
