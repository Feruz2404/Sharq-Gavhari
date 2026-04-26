import { api } from './api.js';

export const uploadService = {
  upload: async (file, bucket = 'restaurant-assets') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', bucket);
    const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data;
  },
};
