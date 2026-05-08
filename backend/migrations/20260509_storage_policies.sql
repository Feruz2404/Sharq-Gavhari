-- Admin Image Upload Pipeline — Supabase Storage bucket + RLS policies
-- Bucket layout:
--   products/original/{id}/{uuid}.{ext}     PRIVATE — admin only via signed URLs
--   products/optimized/{id}/{uuid}.webp     PUBLIC  — served on customer/tablet menu
--   products/thumb/{id}/{uuid}.webp         PUBLIC  — used in cards/lists
--   (same triplet under categories/)

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', false)
ON CONFLICT (id) DO NOTHING;

-- PUBLIC READ for derivatives only (originals stay private).
DROP POLICY IF EXISTS "media_public_read_derivatives" ON storage.objects;
CREATE POLICY "media_public_read_derivatives"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'media'
  AND (
    name LIKE 'products/optimized/%'
    OR name LIKE 'products/thumb/%'
    OR name LIKE 'categories/optimized/%'
    OR name LIKE 'categories/thumb/%'
  )
);

-- Block all direct writes from anon/auth roles.
-- The backend (service role) and signed upload URLs bypass RLS.
DROP POLICY IF EXISTS "media_no_direct_write"  ON storage.objects;
DROP POLICY IF EXISTS "media_no_direct_update" ON storage.objects;
DROP POLICY IF EXISTS "media_no_direct_delete" ON storage.objects;

CREATE POLICY "media_no_direct_write"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "media_no_direct_update"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (false);

CREATE POLICY "media_no_direct_delete"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (false);
