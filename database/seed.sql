-- Sharq Gavhari -- seed data
-- Run AFTER schema.sql.

-- Admin user ----------------------------------------------------------------
-- Default admin account. Login with either:
--   Login: Admin
--   Login: admin@sharqgavhari.uz
-- The password_hash is produced at SQL execution time by pgcrypto's crypt()
-- with a bf salt at cost 10. The result is a standard bcrypt hash that
-- Node.js bcrypt.compare() accepts. Only the resulting hash is stored in the
-- database row.
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

-- Initial categories --------------------------------------------------------
insert into categories (slug, name_uz, name_ru, name_en, sort_order, is_active) values
  ('milliy', 'Milliy taomlar', 'Национальная кухня', 'National cuisine', 1, true),
  ('yevropa', 'Yevropa taomlari', 'Европейская кухня', 'European cuisine', 2, true),
  ('salat',  'Salatlar',         'Салаты',             'Salads',           3, true),
  ('bar',    'Bar',              'Бар',                'Bar',              4, true)
on conflict (slug) do nothing;
