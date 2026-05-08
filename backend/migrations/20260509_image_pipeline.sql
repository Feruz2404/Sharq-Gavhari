-- Admin Image Upload Pipeline — schema additions
-- Adds new columns to products and categories for the originals + derivatives flow.
-- Existing image_url values keep working until images are re-uploaded.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_original_url text,
  ADD COLUMN IF NOT EXISTS image_thumb_url    text,
  ADD COLUMN IF NOT EXISTS image_object_path  text,
  ADD COLUMN IF NOT EXISTS image_updated_at   timestamptz;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_original_url text,
  ADD COLUMN IF NOT EXISTS image_thumb_url    text,
  ADD COLUMN IF NOT EXISTS image_object_path  text,
  ADD COLUMN IF NOT EXISTS image_updated_at   timestamptz;

CREATE INDEX IF NOT EXISTS idx_products_image_updated_at
  ON public.products (image_updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_image_updated_at
  ON public.categories (image_updated_at DESC);
