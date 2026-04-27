const { supabase } = require('../config/supabase');
const crypto = require('crypto');

// Buckets the API will accept and (if missing) auto-create.
const ALLOWED_BUCKETS = new Set([
  'logos',
  'backgrounds',
  'product-images',
  'category-images',
  // Legacy bucket name kept for backwards-compatibility:
  'restaurant-assets',
]);

const BUCKET_OPTS = {
  public: true,
  fileSizeLimit: '5MB',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

const ensuredBuckets = new Set();

function extFromMime(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

// Best-effort: make sure the bucket exists. If we lack permission to
// list/create buckets we surface a clear, actionable error.
async function ensureBucket(bucket) {
  if (ensuredBuckets.has(bucket)) return { ok: true };
  try {
    const { data: existing, error: getErr } = await supabase.storage.getBucket(bucket);
    if (existing && !getErr) {
      ensuredBuckets.add(bucket);
      return { ok: true };
    }
  } catch (_) { /* fall through to create */ }

  try {
    const { error: createErr } = await supabase.storage.createBucket(bucket, BUCKET_OPTS);
    if (createErr) {
      const msg = String(createErr.message || createErr);
      // "already exists" races are fine
      if (/exists/i.test(msg)) {
        ensuredBuckets.add(bucket);
        return { ok: true };
      }
      return { ok: false, code: 'BUCKET_CREATE_FAILED', message: msg };
    }
    ensuredBuckets.add(bucket);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: 'BUCKET_CREATE_FAILED', message: String(e && e.message || e) };
  }
}

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required (multipart field "file")' });
    }

    const bucket = (req.body && req.body.bucket) || 'logos';
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return res.status(400).json({
        error: `Invalid bucket "${bucket}". Allowed: ${[...ALLOWED_BUCKETS].join(', ')}`,
      });
    }

    const ensured = await ensureBucket(bucket);
    if (!ensured.ok) {
      return res.status(500).json({
        error:
          `Storage bucket "${bucket}" is not available and could not be created automatically. ` +
          `Open your Supabase project → Storage → New bucket and create a public bucket named "${bucket}". ` +
          `See database/storage-setup.md for details.`,
        code: ensured.code,
        detail: ensured.message,
      });
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extFromMime(req.file.mimetype)}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (upErr) {
      const msg = String(upErr.message || upErr);
      if (/bucket.*not.*found/i.test(msg)) {
        return res.status(500).json({
          error:
            `Bucket "${bucket}" not found. Create it in Supabase → Storage (public). ` +
            `See database/storage-setup.md.`,
          code: 'BUCKET_NOT_FOUND',
        });
      }
      return res.status(500).json({ error: msg });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    res.status(201).json({ image_url: data.publicUrl, bucket, path: filename });
  } catch (e) {
    next(e);
  }
};
