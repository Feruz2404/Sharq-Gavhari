import { api } from './api.js';

// Default bucket names — keep in sync with backend ALLOWED_BUCKETS
// (backend/src/controllers/upload.controller.js).
export const BUCKETS = {
  logo: 'logos',
  background: 'backgrounds',
  product: 'product-images',
  category: 'category-images',
};

async function postFile(file, bucket) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', bucket);
  const r = await api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data; // { image_url, bucket, path }
}

export const uploadService = {
  // Generic — accepts a known bucket name.
  upload: (file, bucket = BUCKETS.logo) => postFile(file, bucket),
  // Convenience helpers used by the admin UI.
  uploadLogo:       (file) => postFile(file, BUCKETS.logo),
  uploadBackground: (file) => postFile(file, BUCKETS.background),
  uploadProduct:    (file) => postFile(file, BUCKETS.product),
  uploadCategory:   (file) => postFile(file, BUCKETS.category),
};
