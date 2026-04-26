const { supabase } = require('../config/supabase');

exports.list = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('products').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.byCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { data, error } = await supabase
      .from('products').select('*').eq('category_id', categoryId).order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Product not found' });
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
