-- Sharq Gavhari — seed data
-- Run AFTER schema.sql.
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

-- Categories ----------------------------------------------------------------
insert into categories (slug, name_uz, name_ru, name_en, image_url, sort_order, is_active) values
  ('milliy',  'Milliy taomlar',   'Национальная кухня', 'National cuisine', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=70', 1, true),
  ('yevropa', 'Yevropa taomlari', 'Европейская кухня',  'European cuisine', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=70', 2, true),
  ('salat',   'Salatlar',         'Салаты',             'Salads',           'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=70', 3, true),
  ('bar',     'Bar',              'Бар',                'Bar',              'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1000&q=70', 4, true)
on conflict (slug) do update set
  name_uz   = excluded.name_uz,
  name_ru   = excluded.name_ru,
  name_en   = excluded.name_en,
  image_url = coalesce(categories.image_url, excluded.image_url),
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Products ------------------------------------------------------------------
-- Inserted only if a product with the same name_en doesn't already exist,
-- so re-running this seed is safe.

-- === Milliy taomlar ===
insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='milliy'),
  'Osh', 'Плов', 'Uzbek Plov',
  'Klassik o''zbek oshi: guruch, sabzi, qoʻy goʻshti.',
  'Классический узбекский плов: рис, морковь, баранина.',
  'Classic Uzbek pilaf with rice, carrots and lamb.',
  'https://images.unsplash.com/photo-1604908554007-9b3f64a0eed6?auto=format&fit=crop&w=900&q=70',
  55000, '350 g', '15 min', true, true
where not exists (select 1 from products where name_en='Uzbek Plov');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='milliy'),
  'Manti', 'Манты', 'Manti',
  'Bugʻda pishirilgan, qoʻy goʻshti bilan.',
  'Приготовлены на пару, с бараниной.',
  'Steamed dumplings filled with seasoned lamb.',
  'https://images.unsplash.com/photo-1625944525200-2c4b95dee9ab?auto=format&fit=crop&w=900&q=70',
  45000, '280 g', '20 min', true, true
where not exists (select 1 from products where name_en='Manti');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='milliy'),
  'Lagʻmon', 'Лагман', 'Lagman',
  'Tortilgan tugʻralgan ugra, sabzavot va goʻsht qoʻshilgan.',
  'Тянутая лапша с овощами и мясом.',
  'Hand-pulled noodles with beef and vegetables.',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=70',
  48000, '400 g', '15 min', true, true
where not exists (select 1 from products where name_en='Lagman');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='milliy'),
  'Shashlik', 'Шашлык', 'Shashlik',
  'Qoʻy goʻshti shashligi, koʻmirda dimlangan.',
  'Шашлык из баранины, на углях.',
  'Charcoal-grilled lamb skewers.',
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=70',
  60000, '250 g', '12 min', true, true
where not exists (select 1 from products where name_en='Shashlik');

-- === Yevropa taomlari ===
insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='yevropa'),
  'Mol goʻshti steyki', 'Стейк из говядины', 'Beef Steak',
  'Premium mol goʻshti steyki, rozmarin va sariyogʻ bilan.',
  'Стейк из мраморной говядины с розмарином.',
  'Prime beef steak with rosemary butter.',
  'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=70',
  120000, '250 g', '18 min', true, true
where not exists (select 1 from products where name_en='Beef Steak');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='yevropa'),
  'Karbonara', 'Карбонара', 'Pasta Carbonara',
  'Klassik italyan pastasi, pancetta va parmezan bilan.',
  'Классическая итальянская паста с панчеттой и пармезаном.',
  'Classic Italian pasta with pancetta and parmesan.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=900&q=70',
  65000, '320 g', '15 min', true, true
where not exists (select 1 from products where name_en='Pasta Carbonara');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='yevropa'),
  'Margarita pitsa', 'Пицца Маргарита', 'Margherita Pizza',
  'Pomidor sousi, motsarella va rayhon.',
  'Томатный соус, моцарелла, базилик.',
  'Tomato sauce, mozzarella, fresh basil.',
  'https://images.unsplash.com/photo-1548365328-9f547fb0953b?auto=format&fit=crop&w=900&q=70',
  72000, '480 g', '14 min', true, true
where not exists (select 1 from products where name_en='Margherita Pizza');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='yevropa'),
  'Tovuq Cordon Bleu', 'Куриный кордон-блю', 'Chicken Cordon Bleu',
  'Tovuq filesi, ichida vetchina va pishloq.',
  'Куриная грудка с ветчиной и сыром внутри.',
  'Chicken breast stuffed with ham and cheese.',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=70',
  78000, '300 g', '20 min', true, true
where not exists (select 1 from products where name_en='Chicken Cordon Bleu');

-- === Salatlar ===
insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='salat'),
  'Sezar salat', 'Салат Цезарь', 'Caesar Salad',
  'Tovuq, romen, parmezan, krutonlar.',
  'Курица, романо, пармезан, гренки.',
  'Chicken, romaine, parmesan, croutons.',
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=900&q=70',
  42000, '260 g', '8 min', true, true
where not exists (select 1 from products where name_en='Caesar Salad');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='salat'),
  'Yunon salati', 'Греческий салат', 'Greek Salad',
  'Pomidor, bodring, feta, zaytun.',
  'Помидоры, огурцы, фета, оливки.',
  'Tomato, cucumber, feta, kalamata olives.',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=70',
  38000, '240 g', '6 min', true, true
where not exists (select 1 from products where name_en='Greek Salad');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='salat'),
  'Achchiq-chuchuk', 'Аччик-чучук', 'Achchik-Chuchuk',
  'Pomidor, piyoz va kashnich salati.',
  'Салат из помидоров, лука и кинзы.',
  'Tomato, onion and cilantro salad.',
  'https://images.unsplash.com/photo-1604908176997-431f31a3c0c7?auto=format&fit=crop&w=900&q=70',
  22000, '200 g', '5 min', true, true
where not exists (select 1 from products where name_en='Achchik-Chuchuk');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='salat'),
  'Burchak salat', 'Овощной микс', 'Garden Mix',
  'Mavsumiy yashil salat, zaytun moyi bilan.',
  'Сезонная зелень с оливковым маслом.',
  'Seasonal greens with olive oil dressing.',
  'https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=900&q=70',
  28000, '220 g', '5 min', true, true
where not exists (select 1 from products where name_en='Garden Mix');

-- === Bar ===
insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='bar'),
  'Yangi siqilgan apelsin sharbati', 'Свежий апельсиновый сок', 'Fresh Orange Juice',
  'Yangi siqilgan apelsindan.',
  'Только что отжатый апельсин.',
  'Freshly squeezed oranges.',
  'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=900&q=70',
  18000, '300 ml', '3 min', true, true
where not exists (select 1 from products where name_en='Fresh Orange Juice');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='bar'),
  'Limonad', 'Домашний лимонад', 'House Lemonade',
  'Limon, na''na, asal va muz.',
  'Лимон, мята, мёд и лёд.',
  'Lemon, mint, honey and ice.',
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=70',
  16000, '350 ml', '3 min', true, true
where not exists (select 1 from products where name_en='House Lemonade');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='bar'),
  'Espresso', 'Эспрессо', 'Espresso',
  'Italyan uslubidagi espresso.',
  'Эспрессо в итальянском стиле.',
  'Italian-style single shot espresso.',
  'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=900&q=70',
  12000, '40 ml', '2 min', true, true
where not exists (select 1 from products where name_en='Espresso');

insert into products (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, image_url, price, weight, preparation_time, is_available, is_active)
select (select id from categories where slug='bar'),
  'Mineral suv', 'Минеральная вода', 'Mineral Water',
  'Toza tabiiy mineral suv.',
  'Чистая природная минеральная вода.',
  'Pure natural mineral water.',
  'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=70',
  8000, '500 ml', '1 min', true, true
where not exists (select 1 from products where name_en='Mineral Water');
