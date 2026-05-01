import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production build is tuned for Vercel:
//   * sourcemap off \u2014 saves ~30% upload + faster cold deploys
//   * manualChunks splits vendor libs into stable, long-cacheable bundles so
//     a code change to /menu does not invalidate the framer-motion cache
//   * esbuild drops console.* + debugger statements only in production so dev
//     keeps full diagnostics
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : undefined,
}));
