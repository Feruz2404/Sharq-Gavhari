-- Sharq Gavhari — seed data
-- Run AFTER schema.sql.

-- Admin user ----------------------------------------------------------------
-- Replace the bcrypt hash below with a real one. Generate with:
--   node -e "console.log(require('bcrypt').hashSync('YourStrongPassword', 10))"
insert into users (name, email, password_hash, role)
values (
  'Admin',
  'admin@sharqgavhari.uz',
  '$2b$10$REPLACE_WITH_REAL_BCRYPT_HASH_OF_YOUR_PASSWORD',
  'admin'
)
on conflict (email) do nothing;

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
