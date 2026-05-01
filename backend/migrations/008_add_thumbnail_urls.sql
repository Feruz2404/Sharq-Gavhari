-- 008_add_thumbnail_urls.sql
--
-- Adds optimized-thumbnail URLs to products and categories so the public
-- /menu page can load small (~600px wide WebP) thumbnails on cards while
-- keeping the full-quality `image_url` reserved for the product detail
-- drawer and admin previews. The frontend gracefully falls back to
-- `image_url` when `thumbnail_url` is NULL, so this migration is fully
-- backwards-compatible \u2014 existing rows keep working until the admin
-- re-uploads or the upload pipeline re-generates a thumbnail.
--
-- Apply once via Supabase Dashboard SQL editor or `supabase db push`.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN products.thumbnail_url IS
  'Optimized small thumbnail (~600px webp) for menu cards. Falls back to image_url when NULL.';
COMMENT ON COLUMN categories.thumbnail_url IS
  'Optimized small thumbnail (~600px webp) for menu cards. Falls back to image_url when NULL.';
