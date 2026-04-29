-- Add the global app background image URL column to the settings table.
-- Idempotent: safe to run multiple times.
--
-- This column powers the customer-app full-page background. The admin UI
-- (/admin/settings) lets the operator upload a high-quality image (up to
-- 15MB) and persist its public URL here. The customer layout reads this
-- value via `--bg-image` in index.css and renders the image fixed behind
-- the entire customer experience, beneath a dark gradient overlay.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS global_background_image_url TEXT;
