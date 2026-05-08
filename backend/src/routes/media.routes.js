// Admin image upload pipeline.
//
// Flow:
//   1) Admin PWA -> POST /api/media/sign       (small JSON; gets a signed upload URL)
//   2) Admin PWA -> PUT  <signed url>           (binary goes DIRECTLY to Supabase Storage,
//                                                bypassing this server / Vercel body limits)
//   3) Admin PWA -> POST /api/media/finalize    (triggers Edge Function to build derivatives
//                                                and updates the DB row)
//
// Originals are kept byte-for-byte and remain PRIVATE; only signed read URLs are issued.
//
// Auth: this router uses the canonical middleware/auth.js (same as every
// other admin route) so there is zero chance of token-shape drift.

const express = require('express');
const { randomUUID } = require('crypto');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ACCEPTED = (process.env.ACCEPTED_MIME || 'image/jpeg,image/png,image/webp')
  .split(',')
  .map((s) => s.trim());
const MAX_BYTES  = Number(process.env.MAX_UPLOAD_BYTES || 52428800); // 50 MB
const UPLOAD_TTL = Number(process.env.SIGNED_UPLOAD_TTL_SECONDS || 600);
const READ_TTL   = Number(process.env.SIGNED_READ_TTL_SECONDS || 600);
const BUCKET     = 'media';

const ENTITY_FOLDER = { product: 'products', category: 'categories' };
const EXT_BY_MIME   = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function tableFor(entityType) {
  return entityType === 'product' ? 'products' : 'categories';
}

// Safe summary of media-related env / config. Never includes secret values.
function envSummary() {
  return {
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    maxUploadBytes: MAX_BYTES,
    acceptedMime: ACCEPTED,
    uploadTtl: UPLOAD_TTL,
    readTtl: READ_TTL,
    bucket: BUCKET,
  };
}

function missingSupabaseEnv() {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Best-effort idempotent ensure that the 'media' bucket exists. We cache the
// success so we don't hit Supabase admin endpoints on every upload.
let bucketEnsuredOk = false;
async function ensureBucket() {
  if (bucketEnsuredOk) return { ok: true };
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
    if (data && !error) {
      bucketEnsuredOk = true;
      return { ok: true, created: false };
    }
    // getBucket may return a 404-shaped error when the bucket is missing.
    const { error: createErr } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: false,
    });
    if (createErr) {
      const msg = createErr.message || String(createErr);
      if (/already exists/i.test(msg) || /duplicate/i.test(msg)) {
        bucketEnsuredOk = true;
        return { ok: true, created: false };
      }
      console.error('[media] ensureBucket createBucket failed:', msg);
      return { ok: false, error: msg };
    }
    bucketEnsuredOk = true;
    console.log('[media] auto-created bucket:', BUCKET);
    return { ok: true, created: true };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[media] ensureBucket threw:', msg);
    return { ok: false, error: msg };
  }
}

// GET /api/media/health — diagnostic for production troubleshooting.
// Safe: never returns secret values, only presence flags.
router.get('/health', async (_req, res) => {
  const env = envSummary();
  let bucketStatus = { exists: null };
  if (!missingSupabaseEnv()) {
    try {
      const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
      if (error) bucketStatus = { exists: false, error: error.message };
      else bucketStatus = { exists: Boolean(data), public: data && data.public };
    } catch (e) {
      bucketStatus = { exists: false, error: e && e.message ? e.message : String(e) };
    }
  } else {
    bucketStatus = { exists: null, error: 'supabase env not configured' };
  }
  return res.json({ ok: true, env, bucket: bucketStatus });
});

// POST /api/media/sign — issue a one-shot signed upload URL for a single object.
router.post('/sign', requireAdmin, async (req, res) => {
  const { entityType, entityId, mime, size } = req.body || {};

  // Safe diagnostic log (never logs the actual service role key).
  console.log('[media/sign] request', {
    entityType,
    entityIdPresent: Boolean(entityId),
    mime,
    size,
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    maxUploadBytes: MAX_BYTES,
    acceptedMime: ACCEPTED,
    bucket: BUCKET,
  });

  if (missingSupabaseEnv()) {
    console.error('[media/sign] missing Supabase env vars on the server');
    return res.status(500).json({
      error: 'sign_failed',
      detail: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  if (!ENTITY_FOLDER[entityType])
    return res.status(400).json({ error: 'bad_entity_type' });
  if (!entityId)
    return res.status(400).json({ error: 'missing_entity_id' });
  if (!ACCEPTED.includes(mime))
    return res.status(400).json({ error: 'unsupported_mime', accepted: ACCEPTED });
  if (typeof size !== 'number' || size <= 0 || size > MAX_BYTES)
    return res.status(400).json({ error: 'too_large', maxBytes: MAX_BYTES });

  // Make sure the bucket exists. Most prod failures so far have been a
  // missing 'media' bucket because the storage policy SQL was never applied.
  const ensured = await ensureBucket();
  if (!ensured.ok) {
    return res.status(500).json({
      error: 'sign_failed',
      detail: 'bucket: ' + (ensured.error || 'unknown'),
    });
  }

  const ext        = EXT_BY_MIME[mime];
  const objectPath = ENTITY_FOLDER[entityType] + '/original/' + entityId + '/' + randomUUID() + '.' + ext;

  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (error) {
      console.error('[media/sign] createSignedUploadUrl error:', error.message || error, {
        statusCode: error.statusCode || error.status || null,
        objectPath,
      });
      return res.status(500).json({
        error: 'sign_failed',
        detail: error.message || String(error),
        statusCode: error.statusCode || error.status || null,
      });
    }

    return res.json({
      objectPath,
      uploadUrl: data.signedUrl,
      token: data.token,
      expiresIn: UPLOAD_TTL,
      maxBytes: MAX_BYTES,
    });
  } catch (err) {
    console.error('[media/sign] unexpected error:', err && err.message, err && err.stack);
    return res.status(500).json({
      error: 'sign_unexpected',
      detail: err && err.message ? err.message : String(err),
    });
  }
});

// POST /api/media/finalize — process derivatives and update the DB row.
router.post('/finalize', requireAdmin, async (req, res) => {
  try {
    const { entityType, entityId, objectPath } = req.body || {};

    if (!ENTITY_FOLDER[entityType])
      return res.status(400).json({ error: 'bad_entity_type' });
    if (!entityId || !objectPath)
      return res.status(400).json({ error: 'missing_fields' });

    const expectedPrefix = ENTITY_FOLDER[entityType] + '/original/' + entityId + '/';
    if (!objectPath.startsWith(expectedPrefix))
      return res.status(400).json({ error: 'path_mismatch' });

    // Invoke the Supabase Edge Function that produces optimized.webp + thumb.webp.
    const { data: proc, error: procErr } = await supabaseAdmin.functions.invoke(
      'image-processor',
      { body: { entityType, entityId, objectPath } }
    );
    if (procErr) {
      console.error('[media/finalize] processor error:', procErr.message || procErr);
      return res.status(500).json({ error: 'processing_failed', detail: procErr.message });
    }
    if (!proc || !proc.optimizedPath || !proc.thumbPath) {
      console.error('[media/finalize] processor returned invalid response:', proc);
      return res.status(500).json({ error: 'processing_invalid_response' });
    }

    const { optimizedPath, thumbPath } = proc;

    const optimizedUrl = supabaseAdmin
      .storage.from(BUCKET).getPublicUrl(optimizedPath).data.publicUrl;
    const thumbUrl = supabaseAdmin
      .storage.from(BUCKET).getPublicUrl(thumbPath).data.publicUrl;

    const { data: signedRead } = await supabaseAdmin
      .storage.from(BUCKET).createSignedUrl(objectPath, READ_TTL);

    const { error: dbErr } = await supabaseAdmin
      .from(tableFor(entityType))
      .update({
        image_original_url: signedRead && signedRead.signedUrl ? signedRead.signedUrl : null,
        image_url:          optimizedUrl,
        image_thumb_url:    thumbUrl,
        image_object_path:  objectPath,
        image_updated_at:   new Date().toISOString(),
      })
      .eq('id', entityId);

    if (dbErr) {
      console.error('[media/finalize] db update error:', dbErr.message);
      return res.status(500).json({ error: 'db_update_failed', detail: dbErr.message });
    }

    return res.json({
      image_url: optimizedUrl,
      image_thumb_url: thumbUrl,
      image_object_path: objectPath,
      image_original_url: signedRead && signedRead.signedUrl ? signedRead.signedUrl : null,
      expiresIn: READ_TTL,
    });
  } catch (err) {
    console.error('[media/finalize] unexpected error:', err && err.message, err && err.stack);
    return res.status(500).json({ error: 'finalize_unexpected', detail: String(err) });
  }
});

// GET /api/media/original-url?objectPath=... — short-lived signed read URL (admin only).
router.get('/original-url', requireAdmin, async (req, res) => {
  try {
    const objectPath = String(req.query.objectPath || '');
    if (!objectPath) return res.status(400).json({ error: 'missing_object_path' });

    const { data, error } = await supabaseAdmin
      .storage.from(BUCKET).createSignedUrl(objectPath, READ_TTL);

    if (error) {
      console.error('[media/original-url] error:', error.message);
      return res.status(500).json({ error: 'sign_read_failed', detail: error.message });
    }
    return res.json({ url: data.signedUrl, expiresIn: READ_TTL });
  } catch (err) {
    console.error('[media/original-url] unexpected:', err && err.message);
    return res.status(500).json({ error: 'original_url_unexpected', detail: String(err) });
  }
});

// DELETE /api/media/:entityType/:entityId — purge original + derivatives and clear DB columns.
router.delete('/:entityType/:entityId', requireAdmin, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    if (!ENTITY_FOLDER[entityType])
      return res.status(400).json({ error: 'bad_entity_type' });

    const folder = ENTITY_FOLDER[entityType];
    const prefixes = [
      folder + '/original/' + entityId + '/',
      folder + '/optimized/' + entityId + '/',
      folder + '/thumb/' + entityId + '/',
    ];

    for (const prefix of prefixes) {
      const { data: list } = await supabaseAdmin.storage.from(BUCKET).list(prefix);
      if (list && list.length) {
        const paths = list.map((o) => prefix + o.name);
        await supabaseAdmin.storage.from(BUCKET).remove(paths);
      }
    }

    await supabaseAdmin.from(tableFor(entityType)).update({
      image_original_url: null,
      image_url: null,
      image_thumb_url: null,
      image_object_path: null,
      image_updated_at: new Date().toISOString(),
    }).eq('id', entityId);

    return res.json({ ok: true });
  } catch (err) {
    console.error('[media/delete] unexpected:', err && err.message);
    return res.status(500).json({ error: 'delete_unexpected', detail: String(err) });
  }
});

module.exports = router;
