-- =====================================================================
-- Sharq Gavhari \u2014 FULL restaurant menu seed (source of truth: PDF)
-- =====================================================================
-- Run order:
--   1) database/schema.sql
--   2) database/migrations/full-menu-schema-support.sql
--   3) database/seed.sql                (admin user + settings only)
--   4) database/full-menu-seed.sql      (this file)
--
-- Idempotent: re-running performs upserts; no duplicates.
-- Categories are upserted by `slug`. Products are upserted by
-- (name_ru, category_id) thanks to the unique index from migration #2.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CATEGORIES (14 sections, exact slugs requested)
-- ---------------------------------------------------------------------
insert into categories (slug, name_uz, name_ru, name_en, sort_order, is_active) values
  ('salatlar',         'Salatlar',          'Салаты',                'Salads',            1, true),
  ('sovuq-gazaklar',   'Sovuq gazaklar',    'Холодные закуски',      'Сold Appetizers',   2, true),
  ('birinchi-taomlar', 'Birinchi taomlar',  'Первые блюда',          'First Courses',     3, true),
  ('issiq-gazaklar',   'Issiq gazaklar',    'Горячие закуски',       'Hot Appetizers',    4, true),
  ('ikkinchi-taomlar', 'Ikkinchi taomlar',  'Вторые блюда',          'Main Dishes',       5, true),
  ('texas-barbekyu',   'Texas barbekyu',    'Техасское барбекю',     'Texas Barbecue',    6, true),
  ('assorti-taomlar',  'Assorti taomlar',   'Ассорти блюда',         'Assorted Platters', 7, true),
  ('buyurtma-taomlar', 'Buyurtma taomlar',  'Блюда на заказ',        'Dishes by Order',   8, true),
  ('xorazm-oshxonasi', 'Xorazm oshxonasi',  'Хорезмская кухня',      'Khorezm Cuisine',   9, true),
  ('mangal-baliq',     'Mangal baliq',      'Мангал рыба',           'Grilled Fish',     10, true),
  ('shashliklar',      'Shashliklar',       'Шашлыки',               'Shashlik',         11, true),
  ('garnirlar',        'Garnirlar',         'Гарниры',               'Side Dishes',      12, true),
  ('desertlar',        'Desertlar',         'Десерты',               'Desserts',         13, true),
  ('bar',              'Bar',               'Бар',                   'Bar',              14, true)
on conflict (slug) do update set
  name_uz    = excluded.name_uz,
  name_ru    = excluded.name_ru,
  name_en    = excluded.name_en,
  sort_order = excluded.sort_order,
  is_active  = excluded.is_active;

-- Deactivate legacy categories no longer in the menu so they stop showing
-- on the customer-facing /menu, while preserving their historical rows.
update categories set is_active = false
where slug in ('milliy', 'yevropa', 'salat');

-- ---------------------------------------------------------------------
-- 2. PRODUCTS
-- ---------------------------------------------------------------------
-- One INSERT · many VALUES · ON CONFLICT (name_ru, category_id) UPDATE.
-- Each row resolves its category via a sub-select on the slug.
--
-- Russian names + ingredient descriptions are the exact PDF text.
-- UZ + EN are concise translations of the same ingredient list.
-- Where the PDF only shows name + price, descriptions are NULL.
-- ---------------------------------------------------------------------
insert into products
  (category_id, name_uz, name_ru, name_en,
   description_uz, description_ru, description_en,
   price, weight, sort_order, is_available, is_active)
values

-- ===== SALATLAR =====
((select id from categories where slug='salatlar'), 'Salat Sharq Gavhari', 'Салат Шарк Гавхари', 'Sharq Gavhari Salad',
 'Aysberg, rukkola, qalampir, qovurilgan forel va sudak, yong\u02BBoq sousi',
 'Айсберг, руккола, болгарский красный перец, форель и судак обжаренный в кляре, ореховый соус',
 'Iceberg, arugula, bell pepper, battered trout & pike-perch, walnut sauce',
 90000, NULL, 10, true, true),

((select id from categories where slug='salatlar'), 'Tovuqli Sezar', 'Цезарь с курицей', 'Caesar with Chicken',
 'Aysberg, cherri, tovuq filesi, sukhariki, parmezan, sezar sousi',
 'Айсберг, помидор черри, куриная грудка, сухарики, сыр пармезан, соус цезарь',
 'Iceberg, cherry tomato, chicken, croutons, parmesan, caesar dressing',
 55000, NULL, 20, true, true),

((select id from categories where slug='salatlar'), 'Krevetkali Sezar', 'Цезарь с креветками', 'Caesar with Shrimp',
 'Aysberg, cherri, sukhariki, krevetka, parmezan, sezar sousi',
 'Айсберг, помидор черри, сухарики, креветки, сыр пармезан, соус цезарь',
 'Iceberg, cherry tomato, croutons, shrimp, parmesan, caesar dressing',
 75000, NULL, 30, true, true),

((select id from categories where slug='salatlar'), 'Rikotta pishloqli salat', 'Салат с сыром Рикотта', 'Ricotta Salad',
 'Miks salat, cherri, quritilgan mol go\u02BBshti, Rikotta pishlog\u02BBi, balzamik',
 'Микс салат, помидор черри, вяленая говядина, сыр Рикотта, бальзамик',
 'Mixed greens, cherry tomato, cured beef, ricotta, balsamic',
 85000, NULL, 40, true, true),

((select id from categories where slug='salatlar'), 'Strachatella pishloqli salat', 'Салат с сыром Страчателла', 'Stracciatella Salad',
 'Rukkola, cherri, strachatella, kedr yong\u02BBog\u02BBi, balzamik',
 'Руккола, помидор черри, сыр страчателла, кедровый орех, бальзамик',
 'Arugula, cherry tomato, stracciatella, pine nuts, balsamic',
 75000, NULL, 50, true, true),

((select id from categories where slug='salatlar'), 'Yunon salati', 'Греческий', 'Greek Salad',
 'Miks salat, qalampir, pomidor, bodring, Fetaksa, oliva, oregano',
 'Микс салат, болгарский триколор, розовый томат, огурец, сыр Фетакса, маслины, оливки, орегано',
 'Mixed greens, bell pepper, pink tomato, cucumber, feta, olives, oregano',
 55000, NULL, 60, true, true),

((select id from categories where slug='salatlar'), 'Qarsildoq baqlajonli salat', 'Салат с хрустящими баклажанами', 'Crispy Eggplant Salad',
 'Baqlajon, cherri, rukkola, svit-chili sousi, kunjut',
 'Баклажаны, помидор черри, руккола, соус свит-чили, кунжут',
 'Eggplant, cherry tomato, arugula, sweet chili, sesame',
 60000, NULL, 70, true, true),

((select id from categories where slug='salatlar'), 'Rostbifli salat', 'Салат с ростбифом и ореховым соусом', 'Roast Beef Salad with Walnut Sauce',
 'Miks salat, qalampir, kedr yong\u02BBog\u02BBi, rostbif, yong\u02BBoq sousi, balzamik',
 'Микс салат, триколор перец, кедровый орех, ростбиф, ореховый соус, бальзамик',
 'Mixed greens, bell pepper, pine nuts, roast beef, walnut sauce, balsamic',
 80000, NULL, 80, true, true),

((select id from categories where slug='salatlar'), 'Tunets salati', 'Салат с тунцом', 'Tuna Salad',
 'Miks salat, konservalangan tunets, oliva, shalot piyoz',
 'Микс салат, консервированный тунец, оливки, маслины, лук шалот',
 'Mixed greens, canned tuna, olives, shallots',
 75000, NULL, 90, true, true),

((select id from categories where slug='salatlar'), 'Olivye', 'Оливье', 'Olivier',
 'Kartoshka, sabzi, qaynatilgan mol go\u02BBshti, tuxum, ko\u02BBk no\u02BBxat, mayonez',
 'Картофель, морковь, отварная говядина, яйцо, зеленый горошек, майонез',
 'Potato, carrot, boiled beef, egg, green peas, mayo',
 50000, NULL, 100, true, true),

((select id from categories where slug='salatlar'), 'Fransuz salati', 'Салат Французский', 'French Salad',
 'Lavlagi, sabzi, qaynatilgan mol go\u02BBshti, kartoshka, mayonez',
 'Свекла, морковь, отварная говядина, картофель, майонез',
 'Beetroot, carrot, boiled beef, potato, mayo',
 55000, NULL, 110, true, true),

((select id from categories where slug='salatlar'), 'Mo\u02BBynak ostida seld', 'Селёдка под шубо\u0439', 'Herring Under a Fur Coat',
 'Kartoshka, sabzi, tuxum, lavlagi, seld, mayonez',
 'Картофель, морковь, яйцо, свекла, сельдь, майонез',
 'Potato, carrot, egg, beetroot, herring, mayo',
 40000, NULL, 120, true, true),

((select id from categories where slug='salatlar'), 'Qo\u02BBziqorinli salat', 'Салат Грибной', 'Mushroom Salad',
 'Tuzlangan bodring, tuzlangan qo\u02BBziqorin, tovuq filesi, makka, tuxum, mayonez',
 'Огурцы маринованные, маринованные грибы, филе куриное, кукуруза, яйцо, майонез',
 'Pickled cucumber, pickled mushrooms, chicken, corn, egg, mayo',
 50000, NULL, 130, true, true),

((select id from categories where slug='salatlar'), 'Apelsinli rostbif salat', 'Салат Ростбиф с Апельсином', 'Roast Beef with Orange',
 'Miks salat, cherri, rostbif, apelsin bo\u02BBlaklari, kedr yong\u02BBog\u02BBi, parmezan',
 'Микс салат, помидор черри, Ростбиф, дольки апельсина, кедровый орех, сыр пармезан',
 'Mixed greens, cherry tomato, roast beef, orange wedges, pine nuts, parmesan',
 95000, NULL, 140, true, true),

((select id from categories where slug='salatlar'), 'Yapon salati', 'Японский', 'Japanese Salad',
 'Mol go\u02BBshti, bodring, pomidor, qalampir, ko\u02BBk piyoz, soya sousi, kunjut',
 'Говядина, огурец, помидоры, триколор перец, зеленый лук, соевый соус, кунжут',
 'Beef, cucumber, tomato, bell pepper, scallions, soy sauce, sesame',
 65000, NULL, 150, true, true),

((select id from categories where slug='salatlar'), 'Tovuq va ananasli salat', 'Салат с Курица с Ананасом', 'Chicken & Pineapple Salad',
 'Aysberg, tovuq filesi, dudlangan kurka, ananas, olma, yong\u02BBoq, mayonez',
 'Салат айсберг, куриная грудка, копченая индейка, консервированный ананас, яблоко, грецкий орех, майонез',
 'Iceberg, chicken, smoked turkey, canned pineapple, apple, walnut, mayo',
 55000, NULL, 160, true, true),

((select id from categories where slug='salatlar'), 'Burata pishloqli rezavorli salat', 'Салат Буратто с ягодами', 'Burrata Salad with Berries',
 'Rukkola, malina, brusnika, cherri, Burata pishlog\u02BBi',
 'Руккола, малина, брус\u043dика, помидор черри, сыр Буратто',
 'Arugula, raspberry, lingonberry, cherry tomato, burrata',
 120000, NULL, 170, true, true),

((select id from categories where slug='salatlar'), 'Kapreze salati', 'Салат Капрезе', 'Caprese',
 'Motsarella, pushti pomidor, kedr yong\u02BBog\u02BBi, pesto sousi, rukkola',
 'Сыр моцарелла, томаты розовые, кедровый орех, соус песто, руккола',
 'Mozzarella, pink tomato, pine nuts, pesto, arugula',
 115000, NULL, 180, true, true),

((select id from categories where slug='salatlar'), 'Tovuq sonli salat', 'Салат с Куриным бедром', 'Chicken Thigh Salad',
 'Miks salat, tovuq soni, cherri, kremetto, zaytun moyi, limon sharbati',
 'Микс салат, бедро куриное, помидоры черри, сыр креметто, оливковое масло, лимонный сок',
 'Mixed greens, chicken thigh, cherry tomato, cremetto, olive oil, lemon',
 65000, NULL, 190, true, true),

((select id from categories where slug='salatlar'), 'Gauhar salati avakado bilan', 'Салат Гаухар с Авокадо', 'Gauhar Salad with Avocado',
 'Rukkola, tovuq filesi, dudlangan kurka, xon pishlog\u02BBi, avakado, cherri, mayonez',
 'Руккола, куриная грудка, копченая индейка, ханский сыр, авакадо, помидоры черри, майонез',
 'Arugula, chicken, smoked turkey, khan cheese, avocado, cherry tomato, mayo',
 100000, NULL, 200, true, true),

((select id from categories where slug='salatlar'), 'Mevali miks salat', 'Салат Фруктовый Микс', 'Fruit Mix Salad',
 'Miks salat, nok, apelsin, cherri, bebi motsarella',
 'Микс салат, груша, апельсин, помидоры черри, сыр бейби моцарелла',
 'Mixed greens, pear, orange, cherry tomato, baby mozzarella',
 65000, NULL, 210, true, true),

((select id from categories where slug='salatlar'), 'Lavlagi va avakado salati', 'Салат Свекла с Авокадо', 'Beet & Avocado Salad',
 'Miks salat, lavlagi, avakado, apelsin, Fetaksa, zaytun moyi, limon sharbati',
 'Микс салат, свекла, авакадо, апельсин, сыр Фетакса, масло оливковое, лимонный сок',
 'Mixed greens, beetroot, avocado, orange, feta, olive oil, lemon',
 80000, NULL, 220, true, true),

((select id from categories where slug='salatlar'), 'Krab salati', 'Салат Крабовый', 'Crab Salad',
 'Krab tayoqchalari, guruch, makka, bodring, tuxum, mayonez',
 'Крабовые палочки, рис, кукуруза, огурец, яйцо, майонез',
 'Crab sticks, rice, corn, cucumber, egg, mayo',
 55000, NULL, 230, true, true),

((select id from categories where slug='salatlar'), 'Salat \u201cVodochka\u201d ostida', 'Салат под Водочку', 'Vodka-Style Salad',
 'Miks salat, mol go\u02BBshti, tuzlangan bodring, tuzlangan qo\u02BBziqorin, shalot piyoz, limon sharbati, zaytun moyi',
 'Микс салат, говядина, маринованные огурцы, маринованные грибы, лук шалот, лимонный сок, оливковое масло',
 'Mixed greens, beef, pickled cucumber, pickled mushrooms, shallot, lemon, olive oil',
 60000, NULL, 240, true, true),

((select id from categories where slug='salatlar'), 'Erkak Kaprizi', 'Салат Мужской Каприз', 'Man''s Caprice',
 'Qazi, qaynatilgan mol go\u02BBshti, dudlangan kurka, Gauda, mayonez',
 'Казы, отварная говядина, индейка копченая, сыр гауда, майонез',
 'Kazy, boiled beef, smoked turkey, gouda, mayo',
 75000, NULL, 250, true, true),

((select id from categories where slug='salatlar'), 'Chirokchi salati', 'Салат Чирокчи', 'Chirokchi Salad',
 'Pomidor, bodring, suzma',
 'Помидор, огурец, сузьма',
 'Tomato, cucumber, suzma',
 45000, NULL, 260, true, true),

((select id from categories where slug='salatlar'), 'Smak salati', 'Салат Смак', 'Smak Salad',
 'Gauda, pomidor, sukhariki, mayonez',
 'Сыр гауда, помидоры, сухарики, майонез',
 'Gouda, tomato, croutons, mayo',
 40000, NULL, 270, true, true),

((select id from categories where slug='salatlar'), 'Teriyaki salati', 'Салат Терияки', 'Teriyaki Beef Salad',
 'Qovurilgan mol go\u02BBshti, bodring, cherri, rukkola, teriyaki sousi',
 'Жаренная говядина, огурец, помидор черри, руккола, соус терияки',
 'Pan-fried beef, cucumber, cherry tomato, arugula, teriyaki',
 90000, NULL, 280, true, true),

((select id from categories where slug='salatlar'), 'Mimoza salati', 'Салат Мимоза', 'Mimosa',
 'Kartoshka, sabzi, shproti, tuxum, mayonez',
 'Картофель, морковь, шпроты, яйцо, майонез',
 'Potato, carrot, sprats, egg, mayo',
 55000, NULL, 290, true, true),

((select id from categories where slug='salatlar'), 'Achuchuk', 'Салат Ачучук', 'Achuchuk',
 'Pomidor, piyoz, garmdori',
 'Помидоры, лук, стручковый перец',
 'Tomato, onion, chili pepper',
 25000, NULL, 300, true, true),

((select id from categories where slug='salatlar'), '3 kunlik pomidor (1 dona)', 'Помидор 3 дня 1 шт', 'Three-Day Tomato (1 pc)',
 'Pomidor va ko\u02BBkat',
 'Помидоры и зелень',
 'Marinated tomato with herbs',
 20000, '1 pc', 310, true, true),

((select id from categories where slug='salatlar'), 'Tuzlangan assorti', 'Маринованное ассорти', 'Pickled Platter',
 'Tuzlangan karam, arman karami, bodring, sarimsoq, tsitsak, cherri, gulkaram',
 'Квашеная капуста, армянская капуста, маринованные огурцы, маринованный чеснок, маринованный цицак, маринованные черри, маринованная цветная капуста',
 'Sauerkraut, Armenian cabbage, pickled cucumber, garlic, tsitsak, cherry, cauliflower',
 55000, NULL, 320, true, true),

-- ===== SOVUQ GAZAKLAR =====
((select id from categories where slug='sovuq-gazaklar'), 'Go\u02BBshtli assorti', 'Мясное ассорти', 'Meat Platter',
 'Qazi, mol go\u02BBshti rulet, tovuq rulet, til, basturma',
 'Казы, рулет говядина, куриный рулет, язык, бастурма',
 'Kazy, beef roll, chicken roll, tongue, basturma',
 250000, NULL, 10, true, true),

((select id from categories where slug='sovuq-gazaklar'), 'Brynza ko\u02BBkat bilan', 'Брынза с зеленью', 'Brynza with Herbs',
 'Brynza, ukrop, kashnich, ko\u02BBk piyoz',
 'Брынза, укроп, кинза, зеленый лук',
 'Brynza, dill, cilantro, scallions',
 75000, NULL, 20, true, true),

((select id from categories where slug='sovuq-gazaklar'), 'Pishloq taxlamasi', 'Сырная нарезка', 'Cheese Plate',
 'Parmezan, gauda, bri, dor-blu, bebi motsarella',
 'Пармезан, гауда, бри, дор-блю, бейби моцарелла',
 'Parmesan, gouda, brie, blue cheese, baby mozzarella',
 180000, NULL, 30, true, true),

((select id from categories where slug='sovuq-gazaklar'), 'Baliq assortisi', 'Рыбное ассорти', 'Fish Platter',
 'Dudlangan forel, skumbriya, moyli baliq, dudlangan som',
 'Форель копченая, скумбрия, масляная рыба, копченый сом',
 'Smoked trout, mackerel, butterfish, smoked catfish',
 290000, NULL, 40, true, true),

((select id from categories where slug='sovuq-gazaklar'), 'Sabzavotli assorti', 'Овощное ас