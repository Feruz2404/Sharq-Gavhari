const { supabase } = require('../config/supabase');

exports.list = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('categories').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    let q = supabase.from('categories').select('*');
    q = id.match(/^[0-9a-f-]{36}$/i) ? q.eq('id', id) : q.eq('slug', id);
    const { data, error } = await q.maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Category not found' });
    res.json(data);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.name_uz || !body.name_ru || !body.name_en) {
      return res.status(400).json({ error: 'name_uz, name_ru, name_en are required' });
    }
    const { data, error } = await supabase.from('categories').insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('categories').update(req.body || {}).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
};
