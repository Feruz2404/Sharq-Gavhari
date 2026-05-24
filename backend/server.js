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
// We always allow these baked-in origins so the API keeps working even if
// the Render env vars haven't been updated yet:
//   - http://localhost:5173            (vite dev server)
//   - http://localhost:4173            (vite preview)
//   - https://sharq-gavhari.vercel.app (legacy Vercel domain)
//   - https://sharq-gavhari.uz         (production custom domain, apex)
//   - https://www.sharq-gavhari.uz     (production custom domain, www)
//
// On top of that, CLIENT_URLS (preferred) or CLIENT_URL (legacy) can add
// further origins via a comma-separated env var — useful for staging or
// future domains:
//   CLIENT_URLS=https://staging.sharq-gavhari.uz,https://admin.sharq-gavhari.uz
//
// We never use the wildcard "*" because the API uses credentials.
const BAKED_IN_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://sharq-gavhari.vercel.app',
  'https://sharq-gavhari.uz',
  'https://www.sharq-gavhari.uz',
];

const ENV_RAW = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '').trim();
const ENV_ORIGINS = ENV_RAW.split(',').map((s) => s.trim()).filter(Boolean);

// Merge + de-duplicate while preserving insertion order. Set keeps the
// first occurrence so the printed list stays human-readable.
const ALLOWED_ORIGINS = Array.from(new Set([...BAKED_IN_ORIGINS, ...ENV_ORIGINS]));

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
