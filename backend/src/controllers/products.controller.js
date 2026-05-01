const { supabase } = require('../config/supabase');

// Public read endpoints set short, conservative cache headers so Vercel /
// browser caches can absorb repeat requests during a session without
// stale data getting stuck for long. Admin write endpoints stay uncached.
const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

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

exports.list = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products').select(PUBLIC_COLUMNS).order('updated_at', { ascending: false });
    if (error) throw error;
    res.set('Cache-Control', PUBLIC_CACHE);
    res.json(data);
  } catch (e) { next(e); }
};

exports.byCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { data, error } = await supabase
      .from('products').select(PUBLIC_COLUMNS).eq('category_id', categoryId).order('updated_at', { ascending: false });
    if (error) throw error;
    res.set('Cache-Control', PUBLIC_CACHE);
    res.json(data);
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
    res.set('Cache-Control', PUBLIC_CACHE);
    res.json(data);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name_uz || !b.name_ru || !b.name_en) {
      return res.status(400).json({ error: 'name_uz, name_ru, name_en are required' });
    }
    const { data, error } = await supabase.from('products').insert(b).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products').update(req.body || {}).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.setAvailability = async (req, res, next) => {
  try {
    const { is_available } = req.body || {};
    const { data, error } = await supabase.from('products').update({ is_available: !!is_available }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.setActive = async (req, res, next) => {
  try {
    const { is_active } = req.body || {};
    const { data, error } = await supabase.from('products').update({ is_active: !!is_active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
};
