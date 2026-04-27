require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const categoryRoutes = require('./src/routes/categories.routes');
const productRoutes = require('./src/routes/products.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const tableRoutes = require('./src/routes/tables.routes');
const uploadRoutes = require('./src/routes/upload.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CLIENT_URL may be a single origin or a comma-separated list of allowed origins.
// Examples:
//   CLIENT_URL=http://localhost:5173
//   CLIENT_URL=https://sharq-gavhari.vercel.app
//   CLIENT_URL=https://sharq-gavhari.vercel.app,https://www.sharqgavhari.uz
const RAW_CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = RAW_CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean);

// Allow all *.vercel.app preview deployments by default in addition to the
// explicit CLIENT_URL list. Disable with ALLOW_VERCEL_PREVIEWS=false.
const ALLOW_VERCEL_PREVIEWS = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';

function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin / curl / mobile webview
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
