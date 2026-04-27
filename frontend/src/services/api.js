import axios from 'axios';
import { useAuthStore } from '../stores/authStore.js';

// Resolve API base URL from Vite env. We deliberately do NOT fall back to a
// hardcoded localhost URL in production: in production, falling back to
// http://localhost:5000/api would silently try to call the user's machine and
// fail with confusing CORS errors. Instead:
//   - In dev (vite dev server): fall back to http://localhost:5000/api so
//     `npm run dev` keeps working out of the box.
//   - In prod (vite build): if VITE_API_URL is missing, log a clear error and
//     fall back to a same-origin /api path. That way:
//       * if the backend is reverse-proxied at the same origin, it still works,
//       * otherwise the failure is obvious in the network tab (404 on the
//         frontend domain) instead of a misleading CORS error against
//         localhost:5000.
const envApiUrl = import.meta.env.VITE_API_URL;
const isDev = !!import.meta.env.DEV;
const defaultBase = isDev ? 'http://localhost:5000/api' : '/api';
const baseURL = (envApiUrl && String(envApiUrl).trim()) || defaultBase;

if (!envApiUrl && !isDev && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.error(
    '[sharq-gavhari] VITE_API_URL is not set in this build. ' +
      'Configure VITE_API_URL=https://your-backend-domain/api in Vercel ' +
      '(Project \u2192 Settings \u2192 Environment Variables) and redeploy. ' +
      'Falling back to same-origin /api which will likely 404.'
  );
}

export const API_BASE_URL = baseURL;

export const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);
