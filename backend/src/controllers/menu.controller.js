const { supabase } = require('../config/supabase');

// GET /api/menu/version
//
// Returns a single ISO-8601 timestamp computed from the most recent
// updated_at across products, categories, and settings. The customer
// menu polls this every ~30s (and on visibilitychange) and only refetches
// the full menu when this string changes, so we get "live" updates with
// no websockets and one tiny query.
//
// Cached for a few seconds at the edge: the customer menu polls every
// 30 s and we'd rather absorb bursts of polls behind a short CDN cache.
const SHORT_CACHE = 'public, max-age=5, stale-while-revalidate=15';

async function latestUpdatedAt(table) {
  const { data, error } = await supabase
    .from(table)
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('[menu.version] failed to read ' + table, error);
    return null;
  }
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0].updated_at || null;
}

exports.version = async (_req, res, next) => {
  try {
    const [p, c, s] = await Promise.all([
      latestUpdatedAt('products'),
      latestUpdatedAt('categories'),
      latestUpdatedAt('settings'),
    ]);
    const candidates = [p, c, s]
      .filter((x) => typeof x === 'string' && x.length > 0)
      .map((x) => new Date(x).getTime())
      .filter((n) => Number.isFinite(n));
    const maxMs = candidates.length > 0 ? Math.max(...candidates) : 0;
    const version = maxMs > 0 ? new Date(maxMs).toISOString() : '1970-01-01T00:00:00.000Z';
    res.set('Cache-Control', SHORT_CACHE);
    res.json({ version });
  } catch (e) { next(e); }
};
