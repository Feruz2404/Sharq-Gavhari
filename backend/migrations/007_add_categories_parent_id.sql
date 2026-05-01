-- 007_add_categories_parent_id.sql
--
-- Adds optional parent/child support to the categories table so that bar
-- sub-categories (vodka, whiskey, milkshakes, ...) can be nested under a
-- single top-level "Bar" entry instead of polluting the customer-facing
-- top-level category list.
--
-- Rules:
--   * Top-level categories have parent_id = NULL.
--   * Bar sub-categories have parent_id = id of the row whose slug = 'bar'.
--   * The public menu shows only categories with parent_id IS NULL by
--     default; the Bar view drills into rows where parent_id = <bar.id>.
--
-- The column is nullable and indexed; food categories keep parent_id = NULL
-- and behave exactly as before. ON DELETE SET NULL means deleting the parent
-- never cascades into the children.
--
-- Apply once via the Supabase Dashboard SQL editor or `supabase db push`.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

COMMENT ON COLUMN categories.parent_id IS
  'Optional parent category. NULL means top-level. Bar sub-categories point at the row whose slug = ''bar''.';

-- One-shot cleanup for databases that were seeded before this column existed:
-- attach every bar-* sub-category to the Bar parent and make sure Bar itself
-- stays at the top level. Safe to re-run.
UPDATE categories
   SET parent_id = (SELECT id FROM categories WHERE slug = 'bar' LIMIT 1)
 WHERE slug LIKE 'bar-%'
   AND (parent_id IS NULL OR parent_id <> (SELECT id FROM categories WHERE slug = 'bar' LIMIT 1));

UPDATE categories
   SET parent_id = NULL
 WHERE slug = 'bar';
