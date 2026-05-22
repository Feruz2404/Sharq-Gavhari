-- 009_add_products_sort_order.sql
--
-- Per-category product ordering.
--
-- products.sort_order is referenced by the admin product form, the public
-- product list endpoint, and the customer menu. Some deployments already
-- have this column from earlier ad-hoc migrations; this file is fully
-- idempotent so it can be applied to any environment safely.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Composite index lets `WHERE category_id = ? ORDER BY sort_order, created_at`
-- (the customer-menu and admin-list query) use a single index scan.
CREATE INDEX IF NOT EXISTS products_category_sort_idx
  ON products (category_id, sort_order, created_at);
