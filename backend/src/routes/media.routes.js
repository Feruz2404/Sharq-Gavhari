// Admin image upload pipeline — dual-bucket architecture.
//
// WHY TWO BUCKETS:
//   Supabase storage.getPublicUrl() returns a stable URL only when the bucket
//   has public=true. A SELECT RLS policy on storage.objects in a private
//   bucket is fragile (depends on the policy being installed correctly and on
//   RLS being enabled on storage.objects). To make the customer/tablet menu
//   reliably serve optimized + thumbnail images from the Supabase CDN, those
//   derivatives MUST live in a bucket that is itself public. Originals must
//   stay private and only be reachable through short-lived signed URLs.
//
// LAYOUT:
//   media-originals (PRIVATE)
//     products/original/<id>/<uuid>.<ext>
//     categories/original/<id>/<uuid>.<ext>
//   menu-media (PUBLIC, CDN-cached)
//     products/optimized/<id>/<basename>.webp
//     products/thumb/<id>/<basename>.webp
//     categories/optimized/<id>/<basename>.webp
//     categories/thumb/<id>/<basename>.webp
//
// DB columns on products / categories:
//   image_object_path  — path inside media-originals (the source of truth)
//   image_url          — public URL of the optimized webp in menu-media
//   image_thumb_url    — public URL of the thumb webp in menu-media
//   image_original_url — short-lived signed URL into media-originals
//                        (admin-only; the public/tablet menu MUST NEVER use it)
//   image_updated_at   — timestamp
//
// FLOW:
//   1) POST /api/media/sign      -> signed upload URL into media-originals
//   2) PUT  <signed url>          -> binary goes directly to media-originals
//   3) POST /api/media/finalize  -> backend downloads from media-originals,
//                                   sharp builds derivatives, uploads them to
//                                   menu-media, updates the DB row
//   4) POST /api/media/reprocess -> rebuild derivatives for an existing row
//                                   from its image_object_path. Reads the
//                                   original from media-originals first and
//                                   from the legacy single 'media' bucket as
//                                   a fallback for rows uploaded before this
//                                   commit.
//
// LEGACY: a previous version of this pipeline used a single private bucket
// named 'media' for both originals and derivatives. Originals uploaded then
// are still readable by the service role, so /reprocess transparently falls
// back to that bucket if a path is not found in media-originals. The legacy
// bucket can be deleted later once everything has been re-derived.

const express = require('express');
const { randomUUID } = require('crypto');
const sharp = require('sharp');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ACCEPTED = (process.env.ACCEPTED_MIME || 'image/jpeg,image/png,image/webp')
  .split(',')
  .map((s) => s.trim());
const MAX_BYTES  = Number(process.env.MAX_UPLOAD_BYTES || 52428800); // 50 MB
const UPLOAD_TTL = Number(process.env.SIGNED_UPLOAD_TTL_SECONDS || 600);
const READ_TTL   = Number(process.env.SIGNED_READ_TTL_SECONDS || 600);

const BUCKET_ORIGINALS   = 'media-originals';
const BUCKET_DERIVATIVES = 'menu-media';
const LEGACY_BUCKET      = 'media';

const OPTIMIZED_MAX = 1600;
const OPTIMIZED_QUALITY = 90;
const THUMB_MAX = 450;
const THUMB_QUALITY = 82;

const ENTITY_FOLDER = { product: 'products', category: 'categories' };
const EXT_BY_MIME   = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function tableFor(entityType) {
  return entityType === 'product' ? 'products' : 'categories';
}

function envSummary() {
  return {
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    maxUploadBytes: MAX_BYTES,
    acceptedMime: ACCEPTED,
    uploadTtl: UPLOAD_TTL,
    readTtl: READ_TTL,
    bucketOriginals: BUCKET_ORIGINALS,
    bucketDerivatives: BUCKET_DERIVATIVES,
  };
}

function missingSupabaseEnv() {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// Best-effort idempotent ensure that a bucket exists with the right public flag.
const ensuredFlags = { [BUCKET_ORIGINALS]: false, [BUCKET_DERIVATIVES]: false };
async function ensureBucket(name, isPublic) {
  if (ensuredFlags[name]) return { ok: true };
  try {
    const { data: existing, error: getErr } = await supabaseAdmin.storage.getBucket(name);
    if (existing && !getErr) {
      if (Boolean(existing.public) !== Boolean(isPublic)) {
        console.warn('[media] bucket ' + name + ' has public=' + existing.public + ' but expected ' + isPublic + '. Fix manually in Supabase Storage settings.');
      }
      ensuredFlags[name] = true;
      return { ok: true, created: false, public: existing.public };
    }
    const { error: createErr } = await supabaseAdmin.storage.createBucket(name, {
      public: Boolean(isPublic),
    });
    if (createErr) {
      const msg = createErr.message || String(createErr);
      if (/already exists/i.test(msg) || /duplicate/i.test(msg)) {
        ensuredFlags[name] = true;
        return { ok: true, created: false };
      }
      console.error('[media] ensureBucket(' + name + ') failed:', msg);
      return { ok: false, error: msg };
    }
    ensuredFlags[name] = true;
    console.log('[media] auto-created bucket:', name, 'public=', Boolean(isPublic));
    return { ok: true, created: true };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[media] ensureBucket(' + name + ') threw:', msg);
    return { ok: false, error: msg };
  }
}

async function ensureAllBuckets() {
  const o = await ensureBucket(BUCKET_ORIGINALS, false);
  if (!o.ok) return o;
  const d = await ensureBucket(BUCKET_DERIVATIVES, true);
  return d;
}

// ---------- helpers ----------

// Try the new private bucket first, fall back to legacy single bucket.
async function downloadOriginal(objectPath) {
  const primary = await supabaseAdmin.storage.from(BUCKET_ORIGINALS).download(objectPath);
  if (primary.data && !primary.error) {
    const buf = Buffer.from(await primary.data.arrayBuffer());
    return { buffer: buf, bucket: BUCKET_ORIGINALS };
  }
  console.log('[media] download fallback to legacy bucket', LEGACY_BUCKET, 'for', objectPath);
  const fb = await supabaseAdmin.storage.from(LEGACY_BUCKET).download(objectPath);
  if (fb.data && !fb.error) {
    const buf = Buffer.from(await fb.data.arrayBuffer());
    return { buffer: buf, bucket: LEGACY_BUCKET };
  }
  return {
    error: (primary.error && primary.error.message) ||
           (fb.error && fb.error.message) ||
           'object not found in any bucket',
  };
}

async function buildDerivatives(originalBuffer) {
  const optimizedBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({ width: OPTIMIZED_MAX, height: OPTIMIZED_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: OPTIMIZED_QUALITY })
    .toBuffer();
  const thumbBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({ width: THUMB_MAX, height: THUMB_MAX, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();
  return { optimizedBuffer, thumbBuffer };
}

async function uploadDerivative(path, buffer) {
  return supabaseAdmin.storage.from(BUCKET_DERIVATIVES).upload(path, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  });
}

function publicDerivativeUrl(path) {
  return supabaseAdmin.storage.from(BUCKET_DERIVATIVES).getPublicUrl(path).data.publicUrl;
}

async function signedOriginalUrl(objectPath, sourceBucket) {
  const bucket = sourceBucket || BUCKET_ORIGINALS;
  try {
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(objectPath, READ_TTL);
    if (error) {
      console.error('[media] signed original url failed:', error.message);
      return null;
    }
    return data && data.signedUrl ? data.signedUrl : null;
  } catch (e) {
    console.error('[media] signed original url threw:', e && e.message);
    return null;
  }
}

// Core: download original, build derivatives, upload them, update the DB row.
async function processOriginal(args) {
  const { entityType, entityId, objectPath } = args;
  const folder = ENTITY_FOLDER[entityType];
  const expectedPrefix = folder + '/original/' + entityId + '/';
  if (!objectPath.startsWith(expectedPrefix)) {
    return { ok: false, error: 'path_mismatch', detail: 'expected prefix ' + expectedPrefix };
  }

  console.log('[media/process] start', { entityType, entityId, objectPath });

  const dl = await downloadOriginal(objectPath);
  if (!dl.buffer) {
    console.error('[media/process] download failed:', dl.error);
    return { ok: false, error: 'download_failed', detail: dl.error };
  }
  console.log('[media/process] download ok', { sourceBucket: dl.bucket, bytes: dl.buffer.length });

  let optimizedBuffer;
  let thumbBuffer;
  try {
    const built = await buildDerivatives(dl.buffer);
    optimizedBuffer = built.optimizedBuffer;
    thumbBuffer = built.thumbBuffer;
    console.log('[media/process] sharp ok', {
      optimizedBytes: optimizedBuffer.length,
      thumbBytes: thumbBuffer.length,
    });
  } catch (e) {
    console.error('[media/process] sharp failed:', e && e.message, e && e.stack);
    return { ok: false, error: 'processing_failed', detail: e && e.message ? e.message : String(e) };
  }

  const lastSegment = objectPath.split('/').pop() || ('img-' + randomUUID());
  const baseName = lastSegment.replace(/\.[^.]+$/, '');
  const optimizedPath = folder + '/optimized/' + entityId + '/' + baseName + '.webp';
  const thumbPath     = folder + '/thumb/'     + entityId + '/' + baseName + '.webp';

  const upOpt = await uploadDerivative(optimizedPath, optimizedBuffer);
  if (upOpt.error) {
    console.error('[media/process] upload optimized failed:', upOpt.error.message);
    return { ok: false, error: 'upload_optimized_failed', detail: upOpt.error.message };
  }
  console.log('[media/process] upload optimized ok', { optimizedPath });

  const upThumb = await uploadDerivative(thumbPath, thumbBuffer);
  if (upThumb.error) {
    console.error('[media/process] upload thumb failed:', upThumb.error.message);
    return { ok: false, error: 'upload_thumb_failed', detail: upThumb.error.message };
  }
  console.log('[media/process] upload thumb ok', { thumbPath });

  const optimizedUrl = publicDerivativeUrl(optimizedPath);
  const thumbUrl     = publicDerivativeUrl(thumbPath);
  const originalUrl  = await signedOriginalUrl(objectPath, dl.bucket);

  const { error: dbErr } = await supabaseAdmin
    .from(tableFor(entityType))
    .update({
      image_original_url: originalUrl,
      image_url:          optimizedUrl,
      image_thumb_url:    thumbUrl,
      image_object_path:  objectPath,
      image_updated_at:   new Date().toISOString(),
    })
    .eq('id', entityId);
  if (dbErr) {
    console.error('[media/process] db update failed:', dbErr.message);
    return { ok: false, error: 'db_update_failed', detail: dbErr.message };
  }
  console.log('[media/process] db update ok', { table: tableFor(entityType), entityId });

  return {
    ok: true,
    image_url: optimizedUrl,
    image_thumb_url: thumbUrl,
    image_object_path: objectPath,
    image_original_url: originalUrl,
    sourceBucket: dl.bucket,
    expiresIn: READ_TTL,
  };
}

// ---------- routes ----------

// GET /api/media/health — diagnostic. Safe — never returns secret values.
router.get('/health', async (_req, res) => {
  const env = envSummary();
  const out = { ok: true, env };
  if (missingSupabaseEnv()) {
    out.ok = false;
    out.originals   = { exists: null, error: 'supabase env not configured' };
    out.derivatives = { exists: null, error: 'supabase env not configured' };
    return res.json(out);
  }
  for (const [key, name, expectedPublic] of [
    ['originals',   BUCKET_ORIGINALS,   false],
    ['derivatives', BUCKET_DERIVATIVES, true],
  ]) {
    try {
      const { data, error } = await supabaseAdmin.storage.getBucket(name);
      if (error) {
        out[key] = { exists: false, name, error: error.message };
        out.ok = false;
      } else {
        const isPublic = Boolean(data && data.public);
        out[key] = {
          exists: Boolean(data),
          name,
          public: isPublic,
          expectedPublic,
          publicMatchesExpected: isPublic === expectedPublic,
        };
        if (isPublic !== expectedPublic) out.ok = false;
      }
    } catch (e) {
      out[key] = { exists: false, name, error: e && e.message ? e.message : String(e) };
      out.ok = false;
    }
  }
  return res.json(out);
});

// POST /api/media/sign — issue a one-shot signed upload URL into media-originals.
router.post('/sign', requireAdmin, async (req, res) => {
  const { entityType, entityId, mime, size } = req.body || {};

  console.log('[media/sign] request', {
    entityType,
    entityIdPresent: Boolean(entityId),
    mime,
    size,
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    bucketOriginals: BUCKET_ORIGINALS,
  });

  if (missingSupabaseEnv()) {
    return res.status(500).json({
      error: 'sign_failed',
      detail: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    });
  }
  if (!ENTITY_FOLDER[entityType]) return res.status(400).json({ error: 'bad_entity_type' });
  if (!entityId) return res.status(400).json({ error: 'missing_entity_id' });
  if (!ACCEPTED.includes(mime)) return res.status(400).json({ error: 'unsupported_mime', accepted: ACCEPTED });
  if (typeof size !== 'number' || size <= 0 || size > MAX_BYTES) return res.status(400).json({ error: 'too_large', maxBytes: MAX_BYTES });

  const ensured = await ensureAllBuckets();
  if (!ensured.ok) {
    return res.status(500).json({ error: 'sign_failed', detail: 'bucket: ' + (ensured.error || 'unknown') });
  }

  const ext = EXT_BY_MIME[mime];
  const objectPath = ENTITY_FOLDER[entityType] + '/original/' + entityId + '/' + randomUUID() + '.' + ext;

  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_ORIGINALS)
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
      bucket: BUCKET_ORIGINALS,
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
  const { entityType, entityId, objectPath } = req.body || {};

  console.log('[media/finalize] request', { entityType, entityId, objectPath });

  if (missingSupabaseEnv()) {
    return res.status(500).json({
      error: 'processing_failed',
      detail: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    });
  }
  if (!ENTITY_FOLDER[entityType]) return res.status(400).json({ error: 'bad_entity_type' });
  if (!entityId || !objectPath) return res.status(400).json({ error: 'missing_fields' });

  await ensureAllBuckets();

  const result = await processOriginal({ entityType, entityId, objectPath });
  if (!result.ok) {
    const status = result.error === 'path_mismatch' ? 400 : 500;
    return res.status(status).json(result);
  }
  return res.json(result);
});

// POST /api/media/reprocess — rebuild derivatives for an existing row using
// its image_object_path. Reads the original from media-originals first; if
// not found, falls back to the legacy 'media' bucket.
router.post('/reprocess', requireAdmin, async (req, res) => {
  const { entityType, entityId } = req.body || {};

  console.log('[media/reprocess] request', { entityType, entityId });

  if (missingSupabaseEnv()) {
    return res.status(500).json({
      error: 'processing_failed',
      detail: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    });
  }
  if (!ENTITY_FOLDER[entityType]) return res.status(400).json({ error: 'bad_entity_type' });
  if (!entityId) return res.status(400).json({ error: 'missing_entity_id' });

  await ensureAllBuckets();

  const { data: row, error: rowErr } = await supabaseAdmin
    .from(tableFor(entityType))
    .select('id, image_object_path')
    .eq('id', entityId)
    .maybeSingle();
  if (rowErr) {
    console.error('[media/reprocess] db read failed:', rowErr.message);
    return res.status(500).json({ error: 'db_read_failed', detail: rowErr.message });
  }
  if (!row) return res.status(404).json({ error: 'entity_not_found' });
  if (!row.image_object_path) {
    return res.status(400).json({
      error: 'no_object_path',
      detail: 'This entity has no image_object_path on file. Please re-upload an image instead.',
    });
  }

  const result = await processOriginal({ entityType, entityId, objectPath: row.image_object_path });
  if (!result.ok) return res.status(500).json(result);
  return res.json(result);
});

// GET /api/media/original-url?objectPath=... — short-lived signed read URL (admin only).
// Tries media-originals first, then the legacy 'media' bucket.
router.get('/original-url', requireAdmin, async (req, res) => {
  try {
    const objectPath = String(req.query.objectPath || '');
    if (!objectPath) return res.status(400).json({ error: 'missing_object_path' });

    const primary = await supabaseAdmin.storage.from(BUCKET_ORIGINALS).createSignedUrl(objectPath, READ_TTL);
    if (primary.data && !primary.error) {
      return res.json({ url: primary.data.signedUrl, expiresIn: READ_TTL, bucket: BUCKET_ORIGINALS });
    }
    const fb = await supabaseAdmin.storage.from(LEGACY_BUCKET).createSignedUrl(objectPath, READ_TTL);
    if (fb.data && !fb.error) {
      return res.json({ url: fb.data.signedUrl, expiresIn: READ_TTL, bucket: LEGACY_BUCKET });
    }
    const detail = (primary.error && primary.error.message) || (fb.error && fb.error.message) || 'not found';
    console.error('[media/original-url] error:', detail);
    return res.status(500).json({ error: 'sign_read_failed', detail });
  } catch (err) {
    console.error('[media/original-url] unexpected:', err && err.message);
    return res.status(500).json({ error: 'original_url_unexpected', detail: String(err) });
  }
});

// DELETE /api/media/:entityType/:entityId — purge originals + derivatives + DB columns.
router.delete('/:entityType/:entityId', requireAdmin, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    if (!ENTITY_FOLDER[entityType]) return res.status(400).json({ error: 'bad_entity_type' });
    const folder = ENTITY_FOLDER[entityType];

    const removeFromBucket = async (bucket, prefix) => {
      try {
        const { data: list } = await supabaseAdmin.storage.from(bucket).list(prefix);
        if (list && list.length) {
          const paths = list.map((o) => prefix + o.name);
          await supabaseAdmin.storage.from(bucket).remove(paths);
        }
      } catch (e) {
        console.warn('[media/delete] cleanup ' + bucket + ' ' + prefix + ' failed:', e && e.message);
      }
    };

    // Originals (private)
    await removeFromBucket(BUCKET_ORIGINALS, folder + '/original/' + entityId + '/');
    // Derivatives (public)
    await removeFromBucket(BUCKET_DERIVATIVES, folder + '/optimized/' + entityId + '/');
    await removeFromBucket(BUCKET_DERIVATIVES, folder + '/thumb/'     + entityId + '/');
    // Legacy bucket cleanup (best-effort)
    await removeFromBucket(LEGACY_BUCKET, folder + '/original/'  + entityId + '/');
    await removeFromBucket(LEGACY_BUCKET, folder + '/optimized/' + entityId + '/');
    await removeFromBucket(LEGACY_BUCKET, folder + '/thumb/'     + entityId + '/');

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
