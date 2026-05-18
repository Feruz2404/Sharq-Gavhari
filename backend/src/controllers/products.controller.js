const { supabase } = require('../config/supabase');

// Public read endpoints set short, conservative cache headers so Vercel /
// browser caches can absorb repeat requests during a session without
// stale data getting stuck for long. Admin write endpoints stay uncached,
// and authenticated reads ALSO bypass the public cache (see
// `applyReadCache` below) so an admin never gets a stale snapshot of
// their own just-written product back from the edge.
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';
const PRIVATE_NO_CACHE = 'private, no-store, max-age=0';

// Public-safe column projection. Keeps payload small and prevents future
// internal columns from leaking through `select("*")`.
const PUBLIC_COLUMNS = [
  'id', 'category_id',
  'name_uz', 'name_ru', 'name_en',
  'description_uz', 'description_ru', 'description_en',
  'ingredients_uz', 'ingredients_ru', 'ingredients_en',
  'price', 'secondary_price', 'discount_price',
  'image_url', 'thumbnail_url',
  'weight', 'preparation_time',
  'is_active', 'is_available', 'sort_order',
  'updated_at',
].join(', ');

// Whitelist of product columns that the admin product form may set on
// create / update. Anything outside this set is silently dropped before
// the Supabase call so a stale or evolved form state can never trigger a
// "column does not exist" error and abort the save.
//
// Deliberately EXCLUDED:
//   * id / created_at / updated_at
//       Server-managed (updated_at is set by a trigger).
//   * image_thumb_url / image_original_url / image_object_path /
//     image_updated_at
//       Owned exclusively by the /api/media/finalize pipeline. Letting the
//       product form overwrite them with empty strings would wipe out the
//       optimized thumbnails the customer menu relies on.
const PRODUCT_WRITABLE = new Set([
  'category_id',
  'name_uz', 'name_ru', 'name_en',
  'description_uz', 'description_ru', 'description_en',
  'ingredients_uz', 'ingredients_ru', 'ingredients_en',
  'price', 'discount_price', 'secondary_price',
  'image_url', 'thumbnail_url',
  'weight', 'preparation_time',
  'is_available', 'is_active', 'sort_order',
]);

function pickWritable(body) {
  const out = {};
  if (!body || typeof body !== 'object') return out;
  for (const key of Object.keys(body)) {
    if (PRODUCT_WRITABLE.has(key)) out[key] = body[key];
  }
  return out;
}

// Cache policy for read endpoints:
//   - Authenticated callers (any request bearing an Authorization header)
//     get `private, no-store` so the admin panel ALWAYS sees the freshest
//     row right after their own PUT / PATCH / DELETE. This is the fix for
//     "Saqlash bosgandan keyin o'zgarish ko'rinmayapti" symptoms that
//     turned out to be the 60-second public cache returning the pre-save
//     snapshot.
//   - Anonymous callers (public /menu) keep the 60s SWR cache so the
//     customer menu remains snappy.
function applyReadCache(req, res) {
  const hasAuth = !!(req && req.headers && req.headers.authorization);
  res.set('Cache-Control', hasAuth ? PRIVATE_NO_CACHE : PUBLIC_CACHE);
}

const isDev = process.env.NODE_ENV !== 'production';
function devLog(...args) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

// Surface Supabase / Postgres errors as structured JSON the admin UI can
// parse + toast. 23505 (unique_violation) is mapped to a friendly Uzbek
// message because the only product unique index is
// (name_ru, category_id) and the admin needs to understand they typed a
// duplicate name within the same category.
function dbError(res, e, fallback) {
  const code = e && e.code ? e.code : undefined;
  const isUniqueViolation = code === '23505';
  const isFkViolation = code === '23503';
  const msg = (e && e.message) || fallback || 'Database error';
  const details = isUniqueViolation
    ? 'Bunday nomli mahsulot bu kategoriyada allaqachon mavjud'
    : isFkViolation
      ? 'Tanlangan kategoriya mavjud emas yoki o\u2018chirilgan'
      : (e && e.details ? e.details : msg);
  const hint = e && e.hint ? e.hint : undefined;
  console.error('[products] db error', { msg, details, hint, code });
  const status = isUniqueViolation ? 409 : (isFkViolation ? 400 : 500);
  const userError = isUniqueViolation
    ? 'Duplicate product'
    : isFkViolation
      ? 'Invalid category reference'
      : (fallback || msg);
  return res.status(status).json({
    error: userError,
    details,
    code,
    hint,
  });
}

exports.list = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products').select(PUBLIC_COLUMNS).order('updated_at', { ascending: false });
    if (error) throw error;
    applyReadCache(req, res);
    res.json(data);
  } catch (e) { next(e); }
};

exports.byCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { data, error } = await supabase
      .from('products').select(PUBLIC_COLUMNS).eq('category_id', categoryId).order('updated_at', { ascending: false });
    if (error) throw error;
    applyReadCache(req, res);
    res.json(data);
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    applyReadCache(req, res);
    res.json(data);
  } catch (e) { next(e); }
};

exports.create = async (req, res) => {
  try {
    const body = pickWritable(req.body || {});
    devLog('[products] POST', { body });
    if (!body.name_uz || !body.name_ru || !body.name_en) {
      return res.status(400).json({
        error: 'name_uz, name_ru, name_en are required',
        details: 'Missing required multilingual name fields.',
      });
    }
    if (!body.category_id) {
      return res.status(400).json({
        error: 'category_id is required',
        details: 'A category must be selected before creating a product.',
      });
    }
    const { data, error } = await supabase
      .from('products').insert(body).select().single();
    if (error) return dbError(res, error, 'Failed to create product');
    res.status(201).json(data);
  } catch (e) {
    return dbError(res, e, 'Failed to create product');
  }
};

exports.update = async (req, res) => {
  try {
    const body = pickWritable(req.body || {});
    devLog('[products] PUT', { id: req.params.id, body });
    if (Object.keys(body).length === 0) {
      return res.status(400).json({
        error: 'No editable fields provided',
        details: 'Request body contains no recognized product columns.',
      });
    }
    const { data, error } = await supabase
      .from('products').update(body).eq('id', req.params.id).select().maybeSingle();
    if (error) return dbError(res, error, 'Failed to update product');
    if (!data) {
      return res.status(404).json({
        error: 'Product not found or not updated',
        details: 'No product matched id ' + req.params.id + '.',
      });
    }
    res.json(data);
  } catch (e) {
    return dbError(res, e, 'Failed to update product');
  }
};

exports.setAvailability = async (req, res) => {
  try {
    const { is_available } = req.body || {};
    const { data, error } = await supabase.from('products').update({ is_available: !!is_available }).eq('id', req.params.id).select().maybeSingle();
    if (error) return dbError(res, error, 'Failed to update availability');
    if (!data) return res.status(404).json({ error: 'Product not found', details: 'No product matched id ' + req.params.id + '.' });
    res.json(data);
  } catch (e) { return dbError(res, e, 'Failed to update availability'); }
};

exports.setActive = async (req, res) => {
  try {
    const { is_active } = req.body || {};
    const { data, error } = await supabase.from('products').update({ is_active: !!is_active }).eq('id', req.params.id).select().maybeSingle();
    if (error) return dbError(res, error, 'Failed to update active flag');
    if (!data) return res.status(404).json({ error: 'Product not found', details: 'No product matched id ' + req.params.id + '.' });
    res.json(data);
  } catch (e) { return dbError(res, e, 'Failed to update active flag'); }
};

exports.remove = async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return dbError(res, error, 'Failed to delete product');
    res.status(204).end();
  } catch (e) { return dbError(res, e, 'Failed to delete product'); }
};
