-- database/migrations/add-settings-branding-fields.sql
-- Adds optional branding columns to the settings table.
-- Idempotent: safe to re-run. Apply via Supabase Studio -> SQL Editor.

alter table settings add column if not exists logo_url text;
alter table settings add column if not exists background_url text;
alter table settings add column if not exists background_image_url text;
alter table settings add column if not exists phone text;

-- Backfill: keep both background fields in sync so older and newer clients
-- both render the right image without an extra round-trip.
update settings
   set background_image_url = background_url
 where background_image_url is null
   and background_url is not null;

update settings
   set background_url = background_image_url
 where background_url is null
   and background_image_url is not null;
