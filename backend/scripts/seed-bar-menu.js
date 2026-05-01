#!/usr/bin/env node
/**
 * Idempotent bar-menu seeder.
 *
 * Run from the /backend directory:
 *   npm run seed:bar
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (loaded via dotenv).
 *
 * What it does (in order):
 *   1. Upserts a top-level Bar parent category (slug = 'bar', parent_id = NULL).
 *   2. Cleans up any previously-seeded bar-* rows so they all point at the
 *      Bar parent (no-ops on a fresh DB, fixes legacy rows in place).
 *   3. Upserts the 20 bar sub-categories with parent_id = <bar parent id>
 *      using bar-* slugs and 1000-1019 sort orders.
 *   4. Upserts every product into its sub-category (lookup by
 *      (category_id, name_ru); update if found, insert if not).
 *
 * Re-running the script never duplicates rows and never resets prices the
 * admin has changed by hand for products NOT in the canonical list.
 *
 * IMPORTANT: requires migrations 006_add_secondary_price_to_products.sql AND
 * 007_add_categories_parent_id.sql to have been applied first.
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

async function ensureBarParent() {
  // Top-level Bar entry. sort_order 999 puts it after the existing food
  // categories (which use 0\u2013100ish) but before the bar-* children
  // (1000\u20131019) \u2014 although children no longer appear at the top
  // level once parent_id is set, sort_order remains correct everywhere.
  const row = {
    slug: 'bar',
    name_uz: 'Bar',
    name_ru: '\u0411\u0430\u0440',
    name_en: 'Bar',
    sort_order: 999,
    is_active: true,
    parent_id: null,
  };
  const { data, error } = await sb
    .from('categories')
    .upsert(row, { onConflict: 'slug' })
    .select()
    .single();
  if (error) throw new Error('ensureBarParent: ' + error.message);
  return data;
}

async function cleanupLegacyBarRows(barParentId) {
  // Re-attach any bar-* row that was previously seeded without parent_id
  // (or with the wrong parent) to the Bar parent. Idempotent: a no-op on a
  // freshly-seeded DB.
  const { error } = await sb
    .from('categories')
    .update({ parent_id: barParentId })
    .like('slug', 'bar-%');
  if (error) throw new Error('cleanupLegacyBarRows: ' + error.message);
  // The Bar parent itself must always have parent_id = NULL.
  const { error: e2 } = await sb
    .from('categories')
    .update({ parent_id: null })
    .eq('slug', 'bar');
  if (e2) throw new Error('cleanupLegacyBarRows(bar): ' + e2.message);
}

async function upsertCategory(cat, barParentId) {
  const row = {
    slug: cat.slug,
    name_uz: cat.name_uz,
    name_ru: cat.name_ru,
    name_en: cat.name_en,
    sort_order: cat.sort_order,
    is_active: true,
    parent_id: barParentId,
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
  process.stdout.write('[bar-parent] ');
  const barParent = await ensureBarParent();
  process.stdout.write('\u2713 ' + barParent.id + '\n');

  process.stdout.write('[cleanup] ');
  await cleanupLegacyBarRows(barParent.id);
  process.stdout.write('\u2713 legacy bar-* rows attached to parent\n');

  const all = BAR_NON_ALC.concat(BAR_ALC);
  let created = 0;
  let updated = 0;
  for (const cat of all) {
    process.stdout.write('[' + cat.slug + '] ');
    const dbCat = await upsertCategory(cat, barParent.id);
    let i = 0;
    for (const item of cat.items) {
      const r = await upsertProduct(dbCat.id, item, i);
      if (r.action === 'insert') created += 1; else updated += 1;
      i += 1;
    }
    process.stdout.write('\u2713 ' + cat.items.length + ' items\n');
  }
  console.log('\nDone. Inserted ' + created + ', updated ' + updated + '.');
  console.log('Bar parent id: ' + barParent.id);
}

run().catch((e) => {
  console.error('[seed-bar] FAILED:', e.message);
  process.exit(1);
});
