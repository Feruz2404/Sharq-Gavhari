const { supabase } = require('../config/supabase');

exports.list = async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('restaurant_tables').select('*').order('table_number', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('restaurant_tables').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Table not found' });
    res.json(data);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.table_number) return res.status(400).json({ error: 'table_number is required' });
    const { data, error } = await supabase.from('restaurant_tables').insert(b).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('restaurant_tables').update(req.body || {}).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.setActive = async (req, res, next) => {
  try {
    const { is_active } = req.body || {};
    const { data, error } = await supabase.from('restaurant_tables').update({ is_active: !!is_active }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase.from('restaurant_tables').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).end();
  } catch (e) { next(e); }
};
