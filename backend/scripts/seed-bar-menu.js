#!/usr/bin/env node
/**
 * Idempotent bar-menu seeder.
 *
 * Run from the /backend directory:
 *   npm run seed:bar
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (loaded via dotenv).
 *
 * What it does:
 *   1. Upserts 20 bar sub-categories using a `bar-*` slug convention.
 *      sort_order is set in the 1000\u20131019 range so the bar block sits at the
 *      bottom of the existing menu without disturbing existing categories.
 *   2. For every product, looks up by (category_id, name_ru). If found it
 *      updates price / secondary_price / availability. Otherwise it inserts a
 *      new row.
 *
 * Re-running the script does NOT create duplicates and does NOT reset prices
 * the admin has changed by hand \u2014 it only updates the canonical fields
 * (price, secondary_price, is_active, sort_order, name_*).
 *
 * IMPORTANT: requires migration 006_add_secondary_price_to_products.sql to be
 * applied first, otherwise inserts that include `secondary_price` will fail.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const BAR_NON_ALC = require('./data/bar-non-alcoholic');
const BAR_ALC = require('./data/bar-alcoholic');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[seed-bar] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function upsertCategory(cat) {
  // Upsert by unique slug. Returns the resulting row.
  const row = {
    slug: cat.slug,
    name_uz: cat.name_uz,
    name_ru: cat.name_ru,
    name_en: cat.name_en,
    sort_order: cat.sort_order,
    is_active: true,
  };
  const { data, error } = await sb
    .from('categories')
    .upsert(row, { onConflict: 'slug' })
    .select()
    .single();
  if (error) {
    throw new Error('upsertCategory(' + cat.slug + '): ' + error.message);
  }
  return data;
}

async function upsertProduct(categoryId, item, sortOrder) {
  // Look up by (category_id, name_ru). Update if found, insert if not.
  // We don't rely on a unique constraint so re-running stays safe across
  // schema variations.
  const lookup = await sb
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('name_ru', item.name_ru)
    .maybeSingle();
  if (lookup.error) {
    throw new Error('lookup ' + item.name_ru + ': ' + lookup.error.message);
  }
  const payload = {
    category_id: categoryId,
    name_uz: item.name_uz || item.name_ru,
    name_ru: item.name_ru,
    name_en: item.name_en || item.name_ru,
    price: item.price || 0,
    secondary_price: typeof item.secondary_price === 'number' ? item.secondary_price : null,
    is_available: item.is_available !== false,
    is_active: true,
    sort_order: sortOrder,
  };
  if (item.description_ru || item.description_uz || item.description_en) {
    payload.description_uz = item.description_uz || item.description_ru || '';
    payload.description_ru = item.description_ru || '';
    payload.description_en = item.description_en || item.description_ru || '';
  }
  if (lookup.data && lookup.data.id) {
    const upd = await sb.from('products').update(payload).eq('id', lookup.data.id);
    if (upd.error) throw new Error('update ' + item.name_ru + ': ' + upd.error.message);
    return { action: 'update', id: lookup.data.id };
  }
  const ins = await sb.from('products').insert(payload).select('id').single();
  if (ins.error) throw new Error('insert ' + item.name_ru + ': ' + ins.error.message);
  return { action: 'insert', id: ins.data.id };
}

async function run() {
  const all = BAR_NON_ALC.concat(BAR_ALC);
  let created = 0;
  let updated = 0;
  for (const cat of all) {
    process.stdout.write('[' + cat.slug + '] ');
    const dbCat = await upsertCategory(cat);
    let i = 0;
    for (const item of cat.items) {
      const r = await upsertProduct(dbCat.id, item, i);
      if (r.action === 'insert') created += 1; else updated += 1;
      i += 1;
    }
    process.stdout.write('\u2713 ' + cat.items.length + ' items\n');
  }
  console.log('\nDone. Inserted ' + created + ', updated ' + updated + '.');
}

run().catch((e) => {
  console.error('[seed-bar] FAILED:', e.message);
  process.exit(1);
});
