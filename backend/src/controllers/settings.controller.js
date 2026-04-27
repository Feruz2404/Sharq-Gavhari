const { supabase } = require('../config/supabase');

// Whitelist of writable settings columns. Anything else is silently dropped
// so a stale or evolving client cannot corrupt the row or break the save.
const ALLOWED = new Set([
  'restaurant_name',
  'logo_url',
  'background_url',
  'background_image_url',
  'phone',
  'instagram',
  'telegram',
  'default_language',
  'accent_color',
]);

function sanitize(input) {
  const out = {};
  if (!input || typeof input !== 'object') return out;
  for (const [k, v] of Object.entries(input)) {
    // Back-compat aliases used by older client builds.
    if (k === 'contact_phone') { out.phone = v; continue; }
    if (k === 'logoUrl')       { out.logo_url = v; continue; }
    if (k === 'backgroundUrl') {
      out.background_url = v;
      out.background_image_url = v;
      continue;
    }
    if (k === 'background_url' || k === 'background_image_url') {
      out.background_url = v;
      out.background_image_url = v;
      continue;
    }
    if (ALLOWED.has(k)) out[k] = v;
  }
  return out;
}

// Always expose both background fields to the client regardless of whether
// the optional `background_image_url` column has been added to the schema.
function expand(row) {
  if (!row) return row;
  const bg = row.background_image_url || row.background_url || null;
  return {
    ...row,
    background_url: row.background_url || bg,
    background_image_url: row.background_image_url || bg,
  };
}

// Some installations may not yet have the optional `background_image_url`
// column. If Supabase complains about it, retry without that field so the
// rest of the save still succeeds.
async function safeWrite(body, idFilter) {
  const exec = (b) =>
    idFilter
      ? supabase.from('settings').update(b).eq('id', idFilter).select().single()
      : supabase.from('settings').insert(b).select().single();

  let res = await exec(body);
  if (
    res.error &&
    /background_image_url/i.test(String(res.error.message || '')) &&
    'background_image_url' in body
  ) {
    const { background_image_url, ...rest } = body;
    res = await exec(rest);
  }
  if (res.error) throw res.error;
  return res.data;
}

exports.get = async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json(expand(data));
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const { data: existing, error: e1 } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .maybeSingle();
    if (e1) throw e1;

    const row = await safeWrite(body, existing ? existing.id : null);
    res.json(expand(row));
  } catch (e) { next(e); }
};
