require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/categories.routes');
const productRoutes = require('./src/routes/products.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const tableRoutes = require('./src/routes/tables.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const mediaRoutes = require('./src/routes/media.routes');
const menuRoutes = require('./src/routes/menu.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins for CORS.
//
// Resolution order (first non-empty wins):
//   1. CLIENT_URLS  — comma-separated list of origins (preferred for prod).
//        e.g. CLIENT_URLS=http://localhost:5173,https://sharq-gavhari.vercel.app
//   2. CLIENT_URL   — single origin (legacy / simple setups).
//        e.g. CLIENT_URL=https://sharq-gavhari.vercel.app
//   3. Built-in default — http://localhost:5173 so local dev works zero-config.
//
// We never use the wildcard "*" because the API uses credentials.
const RAW = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173').trim();
const ALLOWED_ORIGINS = RAW.split(',').map((s) => s.trim()).filter(Boolean);

// Allow Vercel preview deploys (https://<branch>-<hash>.vercel.app) by default.
// Set ALLOW_VERCEL_PREVIEWS=false to disable.
const ALLOW_VERCEL_PREVIEWS = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';

function isAllowedOrigin(origin) {
  // Same-origin / curl / native webview requests do not send an Origin header.
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (ALLOW_VERCEL_PREVIEWS && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    name: 'sharq-gavhari-api',
    allowedOrigins: ALLOWED_ORIGINS,
    allowVercelPreviews: ALLOW_VERCEL_PREVIEWS,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/menu', menuRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(
    `[sharq-gavhari] API listening on :${PORT} (CORS allowed: ${ALLOWED_ORIGINS.join(', ')}${
      ALLOW_VERCEL_PREVIEWS ? ' + *.vercel.app' : ''
    })`
  );
});
