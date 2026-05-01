-- 006_add_secondary_price_to_products.sql
--
-- Adds dual-price support to the products table for bar items that come in
-- two sizes (e.g. vodka shot vs. bottle, 0.5 L lemonade vs. 1.5 L pitcher).
--
-- When secondary_price IS NOT NULL the menu UI renders both values, e.g.
--   33,000 / 350,000 so'm
-- When NULL only `price` is displayed, so this column is fully backwards
-- compatible with all existing food products.
--
-- Apply once via the Supabase Dashboard SQL editor or `supabase db push`.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS secondary_price NUMERIC(12, 2);

COMMENT ON COLUMN products.secondary_price IS
  'Optional larger / bottle price. NULL means only `price` is shown.';
