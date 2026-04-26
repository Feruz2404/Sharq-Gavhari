const { supabase } = require('../config/supabase');
const crypto = require('crypto');

const ALLOWED_BUCKETS = new Set(['restaurant-assets', 'category-images', 'product-images']);

function extFromMime(mime) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required (multipart field "file")' });
    const bucket = (req.body && req.body.bucket) || 'restaurant-assets';
    if (!ALLOWED_BUCKETS.has(bucket)) return res.status(400).json({ error: 'Invalid bucket' });

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${extFromMime(req.file.mimetype)}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    res.status(201).json({ image_url: data.publicUrl, bucket, path: filename });
  } catch (e) { next(e); }
};
