// Server-only Supabase admin client (service role).
// Never import this module from any code that ships to the browser.
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // We don't throw at require-time so the API can still boot for routes that
  // don't depend on Supabase, but media routes will return 500s until set.
  console.warn('[supabaseAdmin] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
}

const supabaseAdmin = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

module.exports = { supabaseAdmin };
