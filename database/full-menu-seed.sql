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
-- Categories upserted by `slug`. Products upserted by
-- (name_ru, category_id) thanks to the unique index from migration #2.
-- =====================================================================

-- ----- 1. CATEGORIES (14 sections, exact slugs requested) ------------
insert into categories (slug, name_uz, name_ru, name_en, sort_order, is_active) values
  ('salatlar',         'Salatlar',          'Салаты',                'Salads',            1, true),
  ('sovuq-gazaklar',   'Sovuq gazaklar',    'Холодные закуски',      'Cold Appetizers',   2, true),
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
  name_uz=excluded.name_uz, name_ru=excluded.name_ru, name_en=excluded.name_en,
  sort_order=excluded.sort_order, is_active=excluded.is_active;

-- Deactivate legacy slugs not in the new menu.
update categories set is_active=false where slug in ('milliy','yevropa','salat');

-- ----- 2. PRODUCTS (all rows from PDF) -------------------------------
insert into products
  (category_id, name_uz, name_ru, name_en, description_uz, description_ru, description_en, price, weight, sort_order, is_available, is_active)
values
-- ===== SALATLAR (32) =====
((select id from categories where slug='salatlar'), 'Salat Sharq Gavhari', 'Салат Шарк Гавхари', 'Sharq Gavhari Salad', 'Aysberg, rukkola, qalampir, qovurilgan forel va sudak, yong\u02BBoq sousi', 'Айсберг, руккола, болгарский красный перец, форель и судак обжаренный в кляре, ореховый соус', 'Iceberg, arugula, bell pepper, battered trout & pike-perch, walnut sauce', 90000, NULL, 10, true, true),
((select id from categories where slug='salatlar'), 'Tovuqli Sezar', 'Цезарь с курицей', 'Caesar with Chicken', 'Aysberg, cherri, tovuq filesi, sukhariki, parmezan, sezar sousi', 'Айсберг, помидор черри, куриная грудка, сухарики, сыр пармезан, соус цезарь', 'Iceberg, cherry tomato, chicken, croutons, parmesan, caesar dressing', 55000, NULL, 20, true, true),
((select id from categories where slug='salatlar'), 'Krevetkali Sezar', 'Цезарь с креветками', 'Caesar with Shrimp', 'Aysberg, cherri, sukhariki, krevetka, parmezan, sezar sousi', 'Айсберг, помидор черри, сухарики, креветки, сыр пармезан, соус цезарь', 'Iceberg, cherry tomato, croutons, shrimp, parmesan, caesar dressing', 75000, NULL, 30, true, true),
((select id from categories where slug='salatlar'), 'Rikotta pishloqli salat', 'Салат с сыром Рикотта', 'Ricotta Salad', 'Miks salat, cherri, quritilgan mol go\u02BBshti, Rikotta, balzamik', 'Микс салат, помидор черри, вяленая говядина, сыр Рикотта, бальзамик', 'Mixed greens, cherry tomato, cured beef, ricotta, balsamic', 85000, NULL, 40, true, true),
((select id from categories where slug='salatlar'), 'Strachatella pishloqli salat', 'Салат с сыром Страчателла', 'Stracciatella Salad', 'Rukkola, cherri, strachatella, kedr yong\u02BBog\u02BBi, balzamik', 'Руккола, помидор черри, сыр страчателла, кедровый орех, бальзамик', 'Arugula, cherry tomato, stracciatella, pine nuts, balsamic', 75000, NULL, 50, true, true),
((select id from categories where slug='salatlar'), 'Yunon salati', 'Греческий', 'Greek Salad', 'Miks salat, qalampir, pomidor, bodring, Fetaksa, oliva, oregano', 'Микс салат, болгарский триколор, розовый томат, огурец, сыр Фетакса, маслины, оливки, орегано', 'Mixed greens, bell pepper, pink tomato, cucumber, feta, olives, oregano', 55000, NULL, 60, true, true),
((select id from categories where slug='salatlar'), 'Qarsildoq baqlajonli salat', 'Салат с хрустящими баклажанами', 'Crispy Eggplant Salad', 'Baqlajon, cherri, rukkola, svit-chili sousi, kunjut', 'Баклажаны, помидор черри, руккола, соус свит-чили, кунжут', 'Eggplant, cherry tomato, arugula, sweet chili, sesame', 60000, NULL, 70, true, true),
((select id from categories where slug='salatlar'), 'Rostbifli salat', 'Салат с ростбифом и ореховым соусом', 'Roast Beef Salad with Walnut Sauce', 'Miks salat, qalampir, kedr yong\u02BBog\u02BBi, rostbif, yong\u02BBoq sousi, balzamik', 'Микс салат, триколор перец, кедровый орех, ростбиф, ореховый соус, бальзамик', 'Mixed greens, bell pepper, pine nuts, roast beef, walnut sauce, balsamic', 80000, NULL, 80, true, true),
((select id from categories where slug='salatlar'), 'Tunets salati', 'Салат с тунцом', 'Tuna Salad', 'Miks salat, konservalangan tunets, oliva, shalot piyoz', 'Микс салат, консервированный тунец, оливки, маслины, лук шалот', 'Mixed greens, canned tuna, olives, shallots', 75000, NULL, 90, true, true),
((select id from categories where slug='salatlar'), 'Olivye', 'Оливье', 'Olivier', 'Kartoshka, sabzi, qaynatilgan mol go\u02BBshti, tuxum, ko\u02BBk no\u02BBxat, mayonez', 'Картофель, морковь, отварная говядина, яйцо, зеленый горошек, майонез', 'Potato, carrot, boiled beef, egg, green peas, mayo', 50000, NULL, 100, true, true),
((select id from categories where slug='salatlar'), 'Fransuz salati', 'Салат Французский', 'French Salad', 'Lavlagi, sabzi, qaynatilgan mol go\u02BBshti, kartoshka, mayonez', 'Свекла, морковь, отварная говядина, картофель, майонез', 'Beetroot, carrot, boiled beef, potato, mayo', 55000, NULL, 110, true, true),
((select id from categories where slug='salatlar'), 'Mo\u02BBynak ostida seld', 'Селёдка под шубой', 'Herring Under a Fur Coat', 'Kartoshka, sabzi, tuxum, lavlagi, seld, mayonez', 'Картофель, морковь, яйцо, свекла, сельдь, майонез', 'Potato, carrot, egg, beetroot, herring, mayo', 40000, NULL, 120, true, true),
((select id from categories where slug='salatlar'), 'Qo\u02BBziqorinli salat', 'Салат Грибной', 'Mushroom Salad', 'Tuzlangan bodring, qo\u02BBziqorin, tovuq filesi, makka, tuxum, mayonez', 'Огурцы маринованные, маринованные грибы, филе куриное, кукуруза, яйцо, майонез', 'Pickled cucumber, mushrooms, chicken, corn, egg, mayo', 50000, NULL, 130, true, true),
((select id from categories where slug='salatlar'), 'Apelsinli rostbif salat', 'Салат Ростбиф с Апельсином', 'Roast Beef with Orange', 'Miks salat, cherri, rostbif, apelsin, kedr yong\u02BBog\u02BBi, parmezan', 'Микс салат, помидор черри, Ростбиф, дольки апельсина, кедровый орех, сыр пармезан', 'Mixed greens, cherry tomato, roast beef, orange, pine nuts, parmesan', 95000, NULL, 140, true, true),
((select id from categories where slug='salatlar'), 'Yapon salati', 'Японский', 'Japanese Salad', 'Mol go\u02BBshti, bodring, pomidor, qalampir, ko\u02BBk piyoz, soya sousi, kunjut', 'Говядина, огурец, помидоры, триколор перец, зеленый лук, соевый соус, кунжут', 'Beef, cucumber, tomato, bell pepper, scallions, soy sauce, sesame', 65000, NULL, 150, true, true),
((select id from categories where slug='salatlar'), 'Tovuq va ananasli salat', 'Салат с Курица с Ананасом', 'Chicken & Pineapple Salad', 'Aysberg, tovuq filesi, dudlangan kurka, ananas, olma, yong\u02BBoq, mayonez', 'Салат айсберг, куриная грудка, копченая индейка, консервированный ананас, яблоко, грецкий орех, майонез', 'Iceberg, chicken, smoked turkey, pineapple, apple, walnut, mayo', 55000, NULL, 160, true, true),
((select id from categories where slug='salatlar'), 'Burata pishloqli rezavorli salat', 'Салат Буратто с ягодами', 'Burrata Salad with Berries', 'Rukkola, malina, brusnika, cherri, Burata pishlog\u02BBi', 'Руккола, малина, брусника, помидор черри, сыр Буратто', 'Arugula, raspberry, lingonberry, cherry tomato, burrata', 120000, NULL, 170, true, true),
((select id from categories where slug='salatlar'), 'Kapreze salati', 'Салат Капрезе', 'Caprese', 'Motsarella, pushti pomidor, kedr yong\u02BBog\u02BBi, pesto sousi, rukkola', 'Сыр моцарелла, томаты розовые, кедровый орех, соус песто, руккола', 'Mozzarella, pink tomato, pine nuts, pesto, arugula', 115000, NULL, 180, true, true),
((select id from categories where slug='salatlar'), 'Tovuq sonli salat', 'Салат с Куриным бедром', 'Chicken Thigh Salad', 'Miks salat, tovuq soni, cherri, kremetto, zaytun moyi, limon', 'Микс салат, бедро куриное, помидоры черри, сыр креметто, оливковое масло, лимонный сок', 'Mixed greens, chicken thigh, cherry tomato, cremetto, olive oil, lemon', 65000, NULL, 190, true, true),
((select id from categories where slug='salatlar'), 'Gauhar salati avakado bilan', 'Салат Гаухар с Авокадо', 'Gauhar Avocado Salad', 'Rukkola, tovuq filesi, dudlangan kurka, xon pishlog\u02BBi, avakado, cherri, mayonez', 'Руккола, куриная грудка, копченая индейка, ханский сыр, авакадо, помидоры черри, майонез', 'Arugula, chicken, smoked turkey, khan cheese, avocado, cherry tomato, mayo', 100000, NULL, 200, true, true),
((select id from categories where slug='salatlar'), 'Mevali miks salat', 'Салат Фруктовый Микс', 'Fruit Mix Salad', 'Miks salat, nok, apelsin, cherri, bebi motsarella', 'Микс салат, груша, апельсин, помидоры черри, сыр бейби моцарелла', 'Mixed greens, pear, orange, cherry tomato, baby mozzarella', 65000, NULL, 210, true, true),
((select id from categories where slug='salatlar'), 'Lavlagi va avakado salati', 'Салат Свекла с Авокадо', 'Beet & Avocado Salad', 'Miks salat, lavlagi, avakado, apelsin, Fetaksa, zaytun moyi, limon', 'Микс салат, свекла, авакадо, апельсин, сыр Фетакса, оливковое масло, лимонный сок', 'Mixed greens, beet, avocado, orange, feta, olive oil, lemon', 80000, NULL, 220, true, true),
((select id from categories where slug='salatlar'), 'Krab salati', 'Салат Крабовый', 'Crab Salad', 'Krab tayoqchalari, guruch, makka, bodring, tuxum, mayonez', 'Крабовые палочки, рис, кукуруза, огурец, яйцо, майонез', 'Crab sticks, rice, corn, cucumber, egg, mayo', 55000, NULL, 230, true, true),
((select id from categories where slug='salatlar'), 'Vodochka ostida salat', 'Салат под Водочку', 'Vodka-Style Salad', 'Miks salat, mol go\u02BBshti, tuzlangan bodring, qo\u02BBziqorin, shalot piyoz, limon, zaytun moyi', 'Микс салат, говядина, маринованные огурцы, маринованные грибы, лук шалот, лимонный сок, оливковое масло', 'Mixed greens, beef, pickled cucumber, mushrooms, shallot, lemon, olive oil', 60000, NULL, 240, true, true),
((select id from categories where slug='salatlar'), 'Erkak Kaprizi', 'Салат Мужской Каприз', 'Man''s Caprice', 'Qazi, qaynatilgan mol go\u02BBshti, dudlangan kurka, Gauda, mayonez', 'Казы, отварная говядина, индейка копченая, сыр гауда, майонез', 'Kazy, boiled beef, smoked turkey, gouda, mayo', 75000, NULL, 250, true, true),
((select id from categories where slug='salatlar'), 'Chirokchi salati', 'Салат Чирокчи', 'Chirokchi Salad', 'Pomidor, bodring, suzma', 'Помидор, огурец, сузьма', 'Tomato, cucumber, suzma', 45000, NULL, 260, true, true),
((select id from categories where slug='salatlar'), 'Smak salati', 'Салат Смак', 'Smak Salad', 'Gauda, pomidor, sukhariki, mayonez', 'Сыр гауда, помидоры, сухарики, майонез', 'Gouda, tomato, croutons, mayo', 40000, NULL, 270, true, true),
((select id from categories where slug='salatlar'), 'Teriyaki salati', 'Салат Терияки', 'Teriyaki Beef Salad', 'Qovurilgan mol go\u02BBshti, bodring, cherri, rukkola, teriyaki sousi', 'Жаренная говядина, огурец, помидор черри, руккола, соус терияки', 'Pan-fried beef, cucumber, cherry tomato, arugula, teriyaki', 90000, NULL, 280, true, true),
((select id from categories where slug='salatlar'), 'Mimoza salati', 'Салат Мимоза', 'Mimosa', 'Kartoshka, sabzi, shproti, tuxum, mayonez', 'Картофель, морковь, шпроты, яйцо, майонез', 'Potato, carrot, sprats, egg, mayo', 55000, NULL, 290, true, true),
((select id from categories where slug='salatlar'), 'Achuchuk', 'Салат Ачучук', 'Achuchuk', 'Pomidor, piyoz, garmdori', 'Помидоры, лук, стручковый перец', 'Tomato, onion, chili pepper', 25000, NULL, 300, true, true),
((select id from categories where slug='salatlar'), '3 kunlik pomidor', 'Помидор 3 дня 1 шт', 'Three-Day Tomato', 'Pomidor va ko\u02BBkat', 'Помидоры и зелень', 'Marinated tomato with herbs', 20000, '1 pc', 310, true, true),
((select id from categories where slug='salatlar'), 'Tuzlangan assorti', 'Маринованное ассорти', 'Pickled Platter', 'Tuzlangan karam, bodring, sarimsoq, tsitsak, cherri, gulkaram', 'Квашеная капуста, маринованные огурцы, чеснок, цицак, черри, цветная капуста', 'Sauerkraut, pickled cucumber, garlic, tsitsak, cherry, cauliflower', 55000, NULL, 320, true, true),

-- ===== SOVUQ GAZAKLAR (8) =====
((select id from categories where slug='sovuq-gazaklar'), 'Go\u02BBshtli assorti', 'Мясное ассорти', 'Meat Platter', 'Qazi, mol go\u02BBshti rulet, tovuq rulet, til, basturma', 'Казы, рулет говядина, куриный рулет, язык, бастурма', 'Kazy, beef roll, chicken roll, tongue, basturma', 250000, NULL, 10, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Brynza ko\u02BBkat bilan', 'Брынза с зеленью', 'Brynza with Herbs', 'Brynza, ukrop, kashnich, ko\u02BBk piyoz', 'Брынза, укроп, кинза, зеленый лук', 'Brynza, dill, cilantro, scallions', 75000, NULL, 20, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Pishloq taxlamasi', 'Сырная нарезка', 'Cheese Plate', 'Parmezan, gauda, bri, dor-blu, bebi motsarella', 'Пармезан, гауда, бри, дор-блю, бейби моцарелла', 'Parmesan, gouda, brie, blue cheese, baby mozzarella', 180000, NULL, 30, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Baliq assortisi', 'Рыбное ассорти', 'Fish Platter', 'Dudlangan forel, skumbriya, moyli baliq, dudlangan som', 'Форель копченая, скумбрия, масляная рыба, копченый сом', 'Smoked trout, mackerel, butterfish, smoked catfish', 290000, NULL, 40, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Sabzavotli assorti', 'Овощное ассорти', 'Vegetable Platter', 'Pomidor, bodring, qalampir, ko\u02BBkatlar, suzma', 'Помидор, огурец, болгарский триколор, укроп, кинза, лук зелёный, перец стручковый, редиска, сузьма', 'Tomato, cucumber, bell pepper, dill, cilantro, scallions, chili, radish, suzma', 70000, NULL, 50, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Ruscha seld', 'Селёдка по русски', 'Russian Herring', 'Qaynatilgan kartoshka, seld, shalot piyoz', 'Отварной картофель, сельдь, лук шалот', 'Boiled potato, herring, shallot', 60000, NULL, 60, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Suzma', 'Сузьма', 'Suzma', NULL, NULL, NULL, 20000, NULL, 70, true, true),
((select id from categories where slug='sovuq-gazaklar'), 'Bon file soya sousida', 'Бон филе в соевом соусе', 'Bon Filet in Soy Sauce', 'Mol go\u02BBshti bon file, soya sousi', 'Говяжье бон филе, соевый соус', 'Beef bon filet in soy sauce', 160000, NULL, 80, true, true),

-- ===== BIRINCHI TAOMLAR (5) =====
((select id from categories where slug='birinchi-taomlar'), 'Yasmiqli sho\u02BBrva', 'Суп Чечевичный', 'Lentil Soup', NULL, NULL, NULL, 40000, NULL, 10, true, true),
((select id from categories where slug='birinchi-taomlar'), 'Sho\u02BBrva', 'Шурпа', 'Shurpa', NULL, NULL, NULL, 40000, NULL, 20, true, true),
((select id from categories where slug='birinchi-taomlar'), 'Bulonli pelmeni', 'Пельмени с бульоном', 'Pelmeni in Broth', NULL, NULL, NULL, 38000, NULL, 30, true, true),
((select id from categories where slug='birinchi-taomlar'), 'Mastava', 'Мастава', 'Mastava', NULL, NULL, NULL, 42000, NULL, 40, true, true),
((select id from categories where slug='birinchi-taomlar'), 'Okroshka', 'Окрошка', 'Okroshka', NULL, NULL, NULL, 35000, NULL, 50, true, true),

-- ===== ISSIQ GAZAKLAR (13) =====
((select id from categories where slug='issiq-gazaklar'), 'Til qaymoqli sousda', 'Язык в сливочном соусе', 'Tongue in Cream Sauce', 'Til, shampiniyon qo\u02BBziqorin, qaymoq', 'Язык, грибы шампиньоны, сливки', 'Tongue, mushrooms, cream', 75000, NULL, 10, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Suyak iligi', 'Костный мозг', 'Bone Marrow', NULL, NULL, NULL, 50000, NULL, 20, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Mol go\u02BBshti kolbasalari', 'Колбаски говядина', 'Beef Sausages', NULL, NULL, NULL, 65000, NULL, 30, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Qo\u02BBy go\u02BBshti kolbasalari', 'Колбаски баранина', 'Lamb Sausages', NULL, NULL, NULL, 70000, NULL, 40, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Tovuq kolbasalari', 'Колбаски куриные', 'Chicken Sausages', NULL, NULL, NULL, 65000, NULL, 50, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Kolbasa miks', 'Колбасный Микс', 'Sausage Mix', NULL, NULL, NULL, 165000, NULL, 60, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Pivo seti', 'Пивной сет', 'Beer Set', NULL, NULL, NULL, 99000, NULL, 70, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Uy uslubidagi kartoshka', 'Картофель по домашнему', 'Home-Style Potatoes', NULL, NULL, NULL, 90000, NULL, 80, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Dungan qalampiri', 'Дунганский перец', 'Dungan Pepper', NULL, NULL, NULL, 50000, NULL, 90, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Pishloqli lavash', 'Лаваш с сыром', 'Cheese Lavash', NULL, NULL, NULL, 60000, NULL, 100, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Baqlajon ruleti', 'Рулет из баклажанов', 'Eggplant Roll', NULL, NULL, NULL, 60000, NULL, 110, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Buffalo qanotlari', 'Крылья Баффоло', 'Buffalo Wings', NULL, NULL, NULL, 70000, NULL, 120, true, true),
((select id from categories where slug='issiq-gazaklar'), 'Naggetslar', 'Наггетсы', 'Nuggets', NULL, NULL, NULL, 75000, NULL, 130, true, true),

-- ===== IKKINCHI TAOMLAR (23) =====
((select id from categories where slug='ikkinchi-taomlar'), 'Sabzavotli medalonlar', 'Медальоны с овощами гриль', 'Beef Medallions with Grilled Vegetables', NULL, NULL, NULL, 149000, NULL, 10, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Asal-xantalli forel', 'Форель в м\u0451дово горчичном соусе', 'Trout in Honey-Mustard Sauce', 'Shampiniyon, asparagus, cherri, forel, asal, don xantali, miks salat', 'Грибы шампиньоны, спаржа, помидоры черри, форель, мёд, горчица зернистая, микс салат', 'Mushrooms, asparagus, cherry tomato, trout, honey, grain mustard, mixed greens', 130000, NULL, 20, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Sho\u02BBr kabob', 'Шор кабоб', 'Shor Kabob', NULL, NULL, NULL, 99000, NULL, 30, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Qaymoq kabob', 'Каймок кабоб', 'Kaymok Kabob', NULL, NULL, NULL, 99000, NULL, 40, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Stejk Ribay', 'Стейк Рибай', 'Ribeye Steak', NULL, NULL, NULL, 5500, '10 g', 50, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Stejk Tibon', 'Стейк Тибон', 'T-Bone Steak', NULL, NULL, NULL, 5500, '10 g', 60, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Tay uslubidagi go\u02BBsht', 'Мясо по Тайски', 'Thai-Style Beef', NULL, NULL, NULL, 80000, NULL, 70, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Buxorocha vaguri', 'Вагури по Бухарски', 'Bukhara-Style Vaguri', NULL, NULL, NULL, 390000, '1 kg', 80, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Beshbarmoq (0.5 chel)', 'Бешбармак 0.5 человек', 'Beshbarmak (half portion)', NULL, NULL, NULL, 70000, NULL, 90, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Beshbarmoq (1 chel)', 'Бешбармак 1 человек', 'Beshbarmak (1 person)', NULL, NULL, NULL, 100000, NULL, 91, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Beshbarmoq (8 chel)', 'Бешбармак 8 человек', 'Beshbarmak (8 people)', NULL, NULL, NULL, 480000, NULL, 92, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Dumg\u02BBaza', 'Думгаза', 'Dumgaza', NULL, NULL, NULL, 140000, NULL, 100, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Qozon kabob', 'Казан кабоб', 'Kazan Kabob', NULL, NULL, NULL, 120000, NULL, 110, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Sabzavotli Dorado', 'Дорадо с овощами', 'Dorado with Vegetables', NULL, NULL, NULL, 190000, NULL, 120, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Sibas miks salat bilan', 'Сибас с микс салатом', 'Sea Bass with Mixed Salad', NULL, NULL, NULL, 160000, NULL, 130, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Sabzavotli forel', 'Форель с овощами', 'Trout with Vegetables', NULL, NULL, NULL, 160000, NULL, 140, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Qo\u02BBy soni', 'Баранья рулька', 'Lamb Shank', NULL, NULL, NULL, 150000, NULL, 150, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Tushonka', 'Тушонка', 'Tushonka', NULL, NULL, NULL, 90000, NULL, 160, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Pishloqli tovuq ruleti', 'Куриный рулет с сыром', 'Chicken Roll with Cheese', NULL, NULL, NULL, 95000, NULL, 170, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Dolma', 'Долма', 'Dolma', NULL, NULL, NULL, 85000, NULL, 180, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Bedana', 'Бедана', 'Quail', NULL, NULL, NULL, 130000, NULL, 190, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Qo\u02BBy yelka go\u02BBshti', 'Баранья лопатка', 'Lamb Shoulder', NULL, NULL, NULL, 230000, '1 kg', 200, true, true),
((select id from categories where slug='ikkinchi-taomlar'), 'Tovuq filesi ko\u02BBk no\u02BBxat bilan', 'Куриное филе с зелёным горошком', 'Chicken Fillet with Green Peas', NULL, NULL, NULL, 75000, NULL, 210, true, true),

-- ===== TEXAS BARBEKYU (4) =====
((select id from categories where slug='texas-barbekyu'), 'Texas brisket', 'Брискет по техасски', 'Texas Brisket', NULL, NULL, NULL, 6000, '10 g', 10, true, true),
((select id from categories where slug='texas-barbekyu'), 'Mol go\u02BBshti qovurg\u02BBalari', 'Ребра говядина', 'Beef Ribs', NULL, NULL, NULL, 6000, '10 g', 20, true, true),
((select id from categories where slug='texas-barbekyu'), 'Qo\u02BBy yelka go\u02BBshti BBQ', 'Баранья лопатка BBQ', 'Lamb Shoulder BBQ', NULL, NULL, NULL, 6000, '10 g', 30, true, true),
((select id from categories where slug='texas-barbekyu'), 'Big Smoker', 'Биг смокер', 'Big Smoker', NULL, NULL, NULL, 670000, NULL, 40, true, true),

-- ===== ASSORTI TAOMLAR (3) =====
((select id from categories where slug='assorti-taomlar'), '4 kishilik assorti', 'Ассорти на 4 человека', 'Platter for 4', 'Tibon+Ribay 600g, Qozon kabob, Bedana 3 dona, Dumg\u02BBaza, Kartoshka fri, Sous', 'Тибон+Рибай 600г, Казан кабоб, Бедана 3шт, Думгаза, Картофель фри, Свежий соус, Соус тар-тар', 'T-Bone+Ribeye 600g, Kazan Kabob, 3x Quail, Dumgaza, French fries, sauces', 595000, NULL, 10, true, true),
((select id from categories where slug='assorti-taomlar'), '8 kishilik assorti', 'Ассорти на 8 человек', 'Platter for 8', 'Qozon kabob, Dumg\u02BBaza, Qo\u02BBy soni, Tushonka, Bedana, Buffalo, sabzavotlar', 'Казан кабоб, Думгаза, Баранья рулька, Тушонка, Бедана, Крылья Баффоло, Овощи гриль, Картофельные дольки, Картофель фри', 'Kazan Kabob, Dumgaza, Lamb Shank, Tushonka, Quail, Buffalo wings, grilled vegetables, potato wedges, fries', 1650000, NULL, 20, true, true),
((select id from categories where slug='assorti-taomlar'), 'Big Smoker assorti', 'Биг смокер ассорти', 'Big Smoker Platter', 'Brisket 300g, qovurg\u02BBa 300g, qo\u02BBy yelka 300g, Buffalo, sabzavot gril', 'Брискет 300г, Говяжьи рёбра 300г, Баранья лопатка 300г, Крылья Баффоло, Овощи гриль', 'Brisket 300g, beef ribs 300g, lamb shoulder 300g, Buffalo wings, grilled vegetables', 670000, NULL, 30, true, true),

-- ===== BUYURTMA TAOMLAR (1) =====
((select id from categories where slug='buyurtma-taomlar'), 'Sixda butun qo\u02BBy', 'Целый баран на вертеле', 'Whole Lamb on Spit', 'Buyurtma asosida tayyorlanadi', 'Готовится по предварительному заказу', 'Prepared by advance order', 190000, '1 kg', 10, true, true),

-- ===== XORAZM OSHXONASI (13) =====
((select id from categories where slug='xorazm-oshxonasi'), 'Un oshi', 'Ун оши', 'Un Oshi', NULL, NULL, NULL, 35000, NULL, 10, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Tuxum barak', 'Тухум барак', 'Tuxum Barak', NULL, NULL, NULL, 45000, NULL, 20, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Kotir barak', 'Котир барак', 'Kotir Barak', NULL, NULL, NULL, 45000, NULL, 30, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Kovok barak', 'Ковок барак', 'Kovok Barak', NULL, NULL, NULL, 45000, NULL, 40, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Kuk barak', 'Кук барак', 'Kuk Barak', NULL, NULL, NULL, 45000, NULL, 50, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Shivit oshi', 'Шивит оши', 'Shivit Oshi', NULL, NULL, NULL, 50000, NULL, 60, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Xiva ijon', 'Хива иджон', 'Khiva Ijon', NULL, NULL, NULL, 30000, NULL, 70, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Xon miks', 'Ханский микс', 'Khan Mix', NULL, NULL, NULL, 300000, NULL, 80, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Qovurilgan pelmeni', 'Жареные пельмени', 'Fried Pelmeni', NULL, NULL, NULL, 35000, NULL, 90, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Mangal kapshirma', 'Капширма на мангале', 'Grilled Kapshirma', NULL, NULL, NULL, 30000, NULL, 100, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Kapshirma', 'Капширма', 'Kapshirma', NULL, NULL, NULL, 18000, NULL, 110, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Cheburek', 'Чебуреки', 'Cheburek', NULL, NULL, NULL, 17000, NULL, 120, true, true),
((select id from categories where slug='xorazm-oshxonasi'), 'Sariyog\u02BBli tovuq', 'Курица в сливочном масле', 'Chicken in Cream Butter', NULL, NULL, NULL, 170000, NULL, 130, true, true),

-- ===== MANGAL BALIQ (9) =====
((select id from categories where slug='mangal-baliq'), 'Qovurilgan sazan', 'Сазан жареный', 'Fried Sazan', NULL, NULL, NULL, 170000, '1 kg', 10, true, true),
((select id from categories where slug='mangal-baliq'), 'Mangalda dudlangan sazan', 'Копчёный сазан на мангале', 'Smoked Sazan on Grill', NULL, NULL, NULL, 190000, '1 kg', 20, true, true),
((select id from categories where slug='mangal-baliq'), 'Mangalda sazan', 'Сазан на мангале', 'Sazan on Grill', NULL, NULL, NULL, 190000, '1 kg', 30, true, true),
((select id from categories where slug='mangal-baliq'), 'Sousli sazan', 'Сазан в соусе', 'Sazan in Sauce', NULL, NULL, NULL, 190000, '1 kg', 40, true, true),
((select id from categories where slug='mangal-baliq'), 'Mangalda forel', 'Форель на мангале', 'Trout on Grill', NULL, NULL, NULL, 230000, '1 kg', 50, true, true),
((select id from categories where slug='mangal-baliq'), 'Qovurilgan som', 'Сом жаренный', 'Fried Catfish', NULL, NULL, NULL, 320000, '1 kg', 60, true, true),
((select id from categories where slug='mangal-baliq'), 'Qovurilgan sudak', 'Судак жаренный', 'Fried Pike-Perch', NULL, NULL, NULL, 200000, '1 kg', 70, true, true),
((select id from categories where slug='mangal-baliq'), 'Folgada mangalda sazan', 'Сазан в фольге на мангале', 'Sazan in Foil on Grill', NULL, NULL, NULL, 200000, '1 kg', 80, true, true),
((select id from categories where slug='mangal-baliq'), 'Sabzavotli pishirilgan sazan', 'Запечёный сазан с овощами', 'Baked Sazan with Vegetables', NULL, NULL, NULL, 200000, '1 kg', 90, true, true),

-- ===== SHASHLIKLAR (15) =====
((select id from categories where slug='shashliklar'), 'Mol go\u02BBshti (Kavkaz)', 'Говядина кусковой (Кавказский)', 'Beef Cubes (Caucasian)', NULL, NULL, NULL, 120000, NULL, 10, true, true),
((select id from categories where slug='shashliklar'), 'Qo\u02BBy go\u02BBshti (Kavkaz)', 'Баранина кусковой (Кавказский)', 'Lamb Cubes (Caucasian)', NULL, NULL, NULL, 120000, NULL, 20, true, true),
((select id from categories where slug='shashliklar'), 'Lyulya kebab', 'Люля кебаб', 'Lyulya Kebab', NULL, NULL, NULL, 90000, NULL, 30, true, true),
((select id from categories where slug='shashliklar'), 'Qo\u02BBy korejkasi', 'Баранина корейка', 'Lamb Loin', NULL, NULL, NULL, 120000, NULL, 40, true, true),
((select id from categories where slug='shashliklar'), 'Mangal assorti 4 kishi', 'Мангал ассорти на 4 чел', 'Grill Platter for 4', NULL, NULL, NULL, 480000, NULL, 50, true, true),
((select id from categories where slug='shashliklar'), 'Mol go\u02BBshti shpajka', 'Говядина кусковой на шпажке', 'Beef Cubes (Skewer)', NULL, NULL, NULL, 28000, NULL, 60, true, true),
((select id from categories where slug='shashliklar'), 'Mol go\u02BBshti qiyma shpajka', 'Говяжий молотый на шпажках', 'Ground Beef (Skewer)', NULL, NULL, NULL, 25000, NULL, 70, true, true),
((select id from categories where slug='shashliklar'), 'Qo\u02BBy go\u02BBshti shpajka', 'Баранина кусковой на шпажке', 'Lamb Cubes (Skewer)', NULL, NULL, NULL, 28000, NULL, 80, true, true),
((select id from categories where slug='shashliklar'), 'Tovuq soni shashlik', 'Куриные бедра', 'Chicken Thighs', NULL, NULL, NULL, 22000, NULL, 90, true, true),
((select id from categories where slug='shashliklar'), 'Tovuq qanotlari shashlik', 'Куриные крылышки', 'Chicken Wings', NULL, NULL, NULL, 24000, NULL, 100, true, true),
((select id from categories where slug='shashliklar'), 'Napoleon shashlik', 'Наполеон', 'Napoleon Skewer', NULL, NULL, NULL, 27000, NULL, 110, true, true),
((select id from categories where slug='shashliklar'), 'Mangalda sabzavot', 'Овощи на мангале', 'Grilled Vegetables', NULL, NULL, NULL, 45000, NULL, 120, true, true),
((select id from categories where slug='shashliklar'), 'Mangalda makka', 'Кукуруза на мангале', 'Grilled Corn', NULL, NULL, NULL, 25000, NULL, 130, true, true),
((select id from categories where slug='shashliklar'), 'Mangalda qo\u02BBziqorin', 'Грибы на мангале', 'Grilled Mushrooms', NULL, NULL, NULL, 20000, NULL, 140, true, true),
((select id from categories where slug='shashliklar'), 'Mangalda yosh kartoshka', 'Молодой картофель на мангале', 'Grilled New Potatoes', NULL, NULL, NULL, 15000, NULL, 150, true, true),

-- ===== GARNIRLAR (4) =====
((select id from categories where slug='garnirlar'), 'Kartoshka fri', 'Картофель фри', 'French Fries', NULL, NULL, NULL, 30000, NULL, 10, true, true),
((select id from categories where slug='garnirlar'), 'Kartoshka bo\u02BBlaklari', 'Картофельные дольки', 'Potato Wedges', NULL, NULL, NULL, 25000, NULL, 20, true, true),
((select id from categories where slug='garnirlar'), 'Piyoz halqalari', 'Луковые кольца', 'Onion Rings', NULL, NULL, NULL, 25000, NULL, 30, true, true),
((select id from categories where slug='garnirlar'), 'Sabzavotli guruch', 'Рис с овощами', 'Rice with Vegetables', NULL, NULL, NULL, 30000, NULL, 40, true, true),

-- ===== DESERTLAR (7) =====
((select id from categories where slug='desertlar'), 'Klassik chizkeyk', 'Чизкейк классический', 'Classic Cheesecake', NULL, NULL, NULL, 45000, NULL, 10, true, true),
((select id from categories where slug='desertlar'), 'San-Sebastian chizkeyk', 'Чизкейк Сан-Себастьян', 'San Sebastian Cheesecake', NULL, NULL, NULL, 50000, NULL, 20, true, true),
((select id from categories where slug='desertlar'), 'Medovik', 'Медовик', 'Honey Cake', NULL, NULL, NULL, 40000, NULL, 30, true, true),
((select id from categories where slug='desertlar'), 'Tiramisu', 'Тирамису', 'Tiramisu', NULL, NULL, NULL, 50000, NULL, 40, true, true),
((select id from categories where slug='desertlar'), 'Shtrudel', 'Штрудель', 'Strudel', NULL, NULL, NULL, 60000, NULL, 50, true, true),
((select id from categories where slug='desertlar'), 'Muzqaymoq assorti', 'Мороженое в ассортименте', 'Ice Cream Assortment', NULL, NULL, NULL, 18000, NULL, 60, true, true),
((select id from categories where slug='desertlar'), 'Mevali assorti', 'Фруктовое ассорти', 'Fruit Platter', NULL, NULL, NULL, 195000, NULL, 70, true, true)

on conflict (name_ru, category_id) do update set
  name_uz=excluded.name_uz, name_en=excluded.name_en,
  description_uz=excluded.description_uz, description_ru=excluded.description_ru, description_en=excluded.description_en,
  price=excluded.price, weight=excluded.weight, sort_order=excluded.sort_order,
  is_available=excluded.is_available, is_active=excluded.is_active;
