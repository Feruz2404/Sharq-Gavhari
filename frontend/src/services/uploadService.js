import { api } from './api.js';

// Default bucket names \u2014 keep in sync with backend ALLOWED_BUCKETS
// (backend/src/controllers/upload.controller.js).
export const BUCKETS = {
  logo: 'logos',
  background: 'backgrounds',
  product: 'product-images',
  category: 'category-images',
};

// Sub-folders inside the `backgrounds` bucket so the hero image and the
// full-page global background image never collide. Backend whitelist:
// '', 'global', 'hero', 'cover'.
export const FOLDERS = {
  hero: 'hero',
  global: 'global',
};

async function postFile(file, bucket, folder) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bucket', bucket);
  if (folder) fd.append('folder', folder);
  const r = await api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return r.data; // { image_url, url, bucket, path }
}

export const uploadService = {
  // Generic \u2014 accepts a known bucket name and optional storage sub-folder.
  upload: (file, bucket = BUCKETS.logo, folder) => postFile(file, bucket, folder),
  // Convenience helpers used by the admin UI.
  uploadLogo:             (file) => postFile(file, BUCKETS.logo),
  uploadBackground:       (file) => postFile(file, BUCKETS.background, FOLDERS.hero),
  uploadGlobalBackground: (file) => postFile(file, BUCKETS.background, FOLDERS.global),
  uploadProduct:          (file) => postFile(file, BUCKETS.product),
  uploadCategory:         (file) => postFile(file, BUCKETS.category),
};
