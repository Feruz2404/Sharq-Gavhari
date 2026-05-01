const { supabase } = require('../config/supabase');
const crypto = require('crypto');
let sharp = null;
try { sharp = require('sharp'); } catch (_) { /* sharp optional; thumbnails skipped if unavailable */ }

// Buckets the API will accept and (if missing) auto-create.
const ALLOWED_BUCKETS = new Set([
  'logos',
  'backgrounds',
  'product-images',
  'category-images',
  // Legacy bucket name kept for backwards-compatibility:
  'restaurant-assets',
]);

// Whitelisted upload sub-folders (per bucket) so a malicious client cannot
// write outside the storage paths the app cares about. Files uploaded with
// no folder are written at the bucket root, which is the historical layout.
const SAFE_FOLDERS = new Set(['', 'global', 'hero', 'cover']);

// Per-bucket target widths for the auto-generated WebP thumbnail. Chosen so
// the menu cards / global background never download the full original.
const THUMB_WIDTHS = {
  'product-images': 600,
  'category-images': 600,
  'backgrounds': 1280,
  'restaurant-assets': 600,
  'logos': 256,
};
const THUMB_QUALITY = 80;

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 15);

const BUCKET_OPTS = {
  public: true,
  fileSizeLimit: `${MAX_UPLOAD_MB}MB`,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

const ensuredBuckets = new Set();

function extFromMime(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

function safeFolder(input) {
  if (!input) return '';
  const v = String(input).trim().replace(/^\/+|\/+$/g, '');
  if (!v) return '';
  if (!SAFE_FOLDERS.has(v)) return '';
  return v;
}

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
      if (/exists/i.test(msg)) {
        ensuredBuckets.add(bucket);
        return { ok: true };
      }
      return { ok: false, code: 'BUCKET_CREATE_FAILED', message: msg };
    }
    ensuredBuckets.add(bucket);
    return { ok: true };
  } catch (e) {
    return { ok: false, code: 'BUCKET_CREATE_FAILED', message: String((e && e.message) || e) };
  }
}

/**
 * Generate a small WebP thumbnail buffer for the given bucket. Returns null
 * when sharp is not available, the bucket is not in the thumbnail map, the
 * source is already smaller than the target width, or any sharp step fails.
 * Failures must NEVER block the original upload \u2014 we always fall back
 * to using the original image as the thumbnail URL too.
 */
async function maybeGenerateThumbnail(bucket, buffer) {
  if (!sharp) return null;
  const targetWidth = THUMB_WIDTHS[bucket];
  if (!targetWidth) return null;
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta || !meta.width || meta.width <= targetWidth) return null;
    const out = await sharp(buffer)
      .rotate() // honor EXIF orientation
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toBuffer();
    return out;
  } catch (e) {
    console.warn('[upload] thumbnail generation failed:', (e && e.message) || e);
    return null;
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

    const folder = safeFolder(req.body && req.body.folder);

    const ensured = await ensureBucket(bucket);
    if (!ensured.ok) {
      return res.status(500).json({
        error:
          `Storage bucket "${bucket}" is not available and could not be created automatically. ` +
          `Open your Supabase project \u2192 Storage \u2192 New bucket and create a public bucket named "${bucket}". ` +
          `See database/storage-setup.md for details.`,
        code: ensured.code,
        detail: ensured.message,
      });
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extFromMime(req.file.mimetype)}`;
    const path = folder ? `${folder}/${filename}` : filename;

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (upErr) {
      const msg = String(upErr.message || upErr);
      if (/bucket.*not.*found/i.test(msg)) {
        return res.status(500).json({
          error:
            `Bucket "${bucket}" not found. Create it in Supabase \u2192 Storage (public). ` +
            `See database/storage-setup.md.`,
          code: 'BUCKET_NOT_FOUND',
        });
      }
      return res.status(500).json({ error: msg });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const fullUrl = data.publicUrl;

    // Generate + upload optimized thumbnail. If anything fails we silently
    // fall back to the original URL so the admin upload UX is never blocked.
    let thumbnail_url = fullUrl;
    let thumbnail_path = path;
    const thumbBuf = await maybeGenerateThumbnail(bucket, req.file.buffer);
    if (thumbBuf) {
      const thumbPath = path.replace(/\.[^.]+$/, '') + '.thumb.webp';
      const { error: tErr } = await supabase.storage.from(bucket).upload(thumbPath, thumbBuf, {
        contentType: 'image/webp',
        upsert: true,
      });
      if (!tErr) {
        const { data: tData } = supabase.storage.from(bucket).getPublicUrl(thumbPath);
        thumbnail_url = tData.publicUrl;
        thumbnail_path = thumbPath;
      } else {
        console.warn('[upload] thumbnail upload failed:', tErr.message);
      }
    }

    res.status(201).json({
      image_url: fullUrl,
      url: fullUrl,
      thumbnail_url,
      thumbnail_path,
      bucket,
      path,
    });
  } catch (e) {
    next(e);
  }
};
