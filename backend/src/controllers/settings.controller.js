const { supabase } = require('../config/supabase');

exports.get = async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { data: existing, error: e1 } = await supabase.from('settings').select('id').limit(1).maybeSingle();
    if (e1) throw e1;
    if (!existing) {
      const { data, error } = await supabase.from('settings').insert(req.body || {}).select().single();
      if (error) throw error;
      return res.json(data);
    }
    const { data, error } = await supabase.from('settings').update(req.body || {}).eq('id', existing.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
};
