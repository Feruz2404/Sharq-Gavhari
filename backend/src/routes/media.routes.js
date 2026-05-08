// Admin image upload pipeline.
//
// Flow:
//   1) Admin PWA -> POST /api/media/sign       (small JSON; gets a signed upload URL)
//   2) Admin PWA -> PUT  <signed url>           (binary goes DIRECTLY to Supabase Storage,
//                                                bypassing this server / Vercel body limits)
//   3) Admin PWA -> POST /api/media/finalize   (triggers Edge Function to build derivatives
//                                                and updates the DB row)
//
// Derivatives:
//   optimized.webp  ≤ 1600px long edge, quality 90
//   thumb.webp      ≤  450px long edge, quality 82
//
// Originals are kept byte-for-byte and remain PRIVATE; only signed read URLs are issued.

const express = require('express');
const { randomUUID } = require('crypto');
const { supabaseAdmin } = require('../lib/supabaseAdmin');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

const ACCEPTED = (process.env.ACCEPTED_MIME || 'image/jpeg,image/png,image/webp')
  .split(',')
  .map((s) => s.trim());
const MAX_BYTES   = Number(process.env.MAX_UPLOAD_BYTES || 52428800); // 50 MB
const UPLOAD_TTL  = Number(process.env.SIGNED_UPLOAD_TTL_SECONDS || 600);
const READ_TTL    = Number(process.env.SIGNED_READ_TTL_SECONDS || 600);

const ENTITY_FOLDER = { product: 'products', category: 'categories' };
const EXT_BY_MIME   = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function tableFor(entityType) {
  return entityType === 'product' ? 'products' : 'categories';
}

// POST /api/media/sign — issue a one-shot signed upload URL for a single object.
router.post('/sign', requireAdmin, async (req, res) => {
  try {
    const { entityType, entityId, mime, size } = req.body || {};

    if (!ENTITY_FOLDER[entityType])
      return res.status(400).json({ error: 'bad_entity_type' });
    if (!entityId)
      return res.status(400).json({ error: 'missing_entity_id' });
    if (!ACCEPTED.includes(mime))
      return res.status(400).json({ error: 'unsupported_mime' });
    if (typeof size !== 'number' || size <= 0 || size > MAX_BYTES)
      return res.status(400).json({ error: 'too_large', maxBytes: MAX_BYTES });

    const ext        = EXT_BY_MIME[mime];
    const objectPath = `${ENTITY_FOLDER[entityType]}/original/${entityId}/${randomUUID()}.${ext}`;

    const { data, error } = await supabaseAdmin
      .storage
      .from('media')
      .createSignedUploadUrl(objectPath, { upsert: false });

    if (error) return res.status(500).json({ error: 'sign_failed', detail: error.message });

    return res.json({
      objectPath,
      uploadUrl: data.signedUrl,
      token: data.token,
      expiresIn: UPLOAD_TTL,
      maxBytes: MAX_BYTES,
    });
  } catch (err) {
    return res.status(500).json({ error: 'sign_unexpected', detail: String(err) });
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

    const expectedPrefix = `${ENTITY_FOLDER[entityType]}/original/${entityId}/`;
    if (!objectPath.startsWith(expectedPrefix))
      return res.status(400).json({ error: 'path_mismatch' });

    // Invoke the Supabase Edge Function that produces optimized.webp + thumb.webp.
    const { data: proc, error: procErr } = await supabaseAdmin.functions.invoke(
      'image-processor',
      { body: { entityType, entityId, objectPath } }
    );
    if (procErr)
      return res.status(500).json({ error: 'processing_failed', detail: procErr.message });
    if (!proc || !proc.optimizedPath || !proc.thumbPath)
      return res.status(500).json({ error: 'processing_invalid_response' });

    const { optimizedPath, thumbPath } = proc;

    const optimizedUrl = supabaseAdmin
      .storage.from('media').getPublicUrl(optimizedPath).data.publicUrl;
    const thumbUrl = supabaseAdmin
      .storage.from('media').getPublicUrl(thumbPath).data.publicUrl;

    const { data: signedRead } = await supabaseAdmin
      .storage.from('media').createSignedUrl(objectPath, READ_TTL);

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

    if (dbErr)
      return res.status(500).json({ error: 'db_update_failed', detail: dbErr.message });

    return res.json({
      image_url: optimizedUrl,
      image_thumb_url: thumbUrl,
      image_object_path: objectPath,
      image_original_url: signedRead && signedRead.signedUrl ? signedRead.signedUrl : null,
      expiresIn: READ_TTL,
    });
  } catch (err) {
    return res.status(500).json({ error: 'finalize_unexpected', detail: String(err) });
  }
});

// GET /api/media/original-url?objectPath=... — short-lived signed read URL (admin only).
router.get('/original-url', requireAdmin, async (req, res) => {
  try {
    const objectPath = String(req.query.objectPath || '');
    if (!objectPath) return res.status(400).json({ error: 'missing_object_path' });

    const { data, error } = await supabaseAdmin
      .storage.from('media').createSignedUrl(objectPath, READ_TTL);

    if (error)
      return res.status(500).json({ error: 'sign_read_failed', detail: error.message });
    return res.json({ url: data.signedUrl, expiresIn: READ_TTL });
  } catch (err) {
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
      `${folder}/original/${entityId}/`,
      `${folder}/optimized/${entityId}/`,
      `${folder}/thumb/${entityId}/`,
    ];

    for (const prefix of prefixes) {
      const { data: list } = await supabaseAdmin.storage.from('media').list(prefix);
      if (list && list.length) {
        const paths = list.map((o) => prefix + o.name);
        await supabaseAdmin.storage.from('media').remove(paths);
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
    return res.status(500).json({ error: 'delete_unexpected', detail: String(err) });
  }
});

module.exports = router;
