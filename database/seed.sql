-- Sharq Gavhari — base seed
-- Run order:
--   1) database/schema.sql
--   2) database/migrations/full-menu-schema-support.sql
--   3) database/seed.sql                (this file)
--   4) database/full-menu-seed.sql      (full restaurant menu, ~140 products)
--
-- Idempotent: re-running will not create duplicates.

-- Admin user ----------------------------------------------------------------
-- Default admin account. Login with either:
--   Login: Admin
--   Login: admin@sharqgavhari.uz
-- Password (default): sharqgavhariadmin
insert into users (name, email, password_hash, role)
values (
  'Admin',
  'admin@sharqgavhari.uz',
  crypt('sharqgavhariadmin', gen_salt('bf', 10)),
  'admin'
)
on conflict (email) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role;

-- Settings (single row) -----------------------------------------------------
insert into settings (restaurant_name, default_language, accent_color)
select 'Sharq Gavhari', 'uz', '#D4AF37'
where not exists (select 1 from settings);

-- NOTE: All categories and products are managed in database/full-menu-seed.sql
--       Run that file AFTER this seed to populate the full restaurant menu.
--       The full-menu seed is idempotent and uses ON CONFLICT upserts.
