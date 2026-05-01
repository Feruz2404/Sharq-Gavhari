// Bar menu data \u2014 alcoholic categories (11\u201320).
//
// Russian names are canonical (per the spec). Brand names (Beluga, Hennessy,
// Martini, Olmeca, etc.) are kept identical across all three locales.
//
// Dual-price items use `price` (shot / glass / 0.5L) and `secondary_price`
// (full bottle / large pitcher). The UI renders both as \"X / Y so'm\" when
// secondary_price is present.
//
// NOTE: Chivas 12 and Ballantine\u2019s prices were not visible from the
// available source. They are seeded with price = 0 and is_available = false
// so they appear in the admin panel for manual confirmation but are hidden
// on the public menu until an admin sets the correct values. See the
// description_ru field for the inline admin reminder.
//
// Sort orders 1010\u20131019 keep alcoholic categories under the
// non-alcoholic block (1000\u20131009).

module.exports = [
  {
    slug: 'bar-vodka',
    sort_order: 1010,
    name_ru: '\u0412\u043E\u0434\u043A\u0430',
    name_uz: 'Aroq',
    name_en: 'Vodka',
    items: [
      { name_ru: 'Gold Uzbekistan', name_uz: 'Gold Uzbekistan', name_en: 'Gold Uzbekistan', price: 33000, secondary_price: 350000 },
      { name_ru: 'New Uzbekistan',  name_uz: 'New Uzbekistan',  name_en: 'New Uzbekistan',  price: 15000, secondary_price: 130000 },
      { name_ru: 'Fortuna',         name_uz: 'Fortuna',         name_en: 'Fortuna',         price: 35000, secondary_price: 320000 },
      { name_ru: 'E-Factor',        name_uz: 'E-Factor',        name_en: 'E-Factor',        price: 15000, secondary_price: 140000 },
      { name_ru: 'Stolichnaya',     name_uz: 'Stolichnaya',     name_en: 'Stolichnaya',     price: 24000, secondary_price: 230000 },
      { name_ru: 'Beluga',          name_uz: 'Beluga',          name_en: 'Beluga',          price: 70000, secondary_price: 650000 },
      { name_ru: 'Steklo',          name_uz: 'Steklo',          name_en: 'Steklo',          price: 14000, secondary_price: 120000 },
      { name_ru: 'Ambarnaya',       name_uz: 'Ambarnaya',       name_en: 'Ambarnaya',       price: 12000, secondary_price: 110000 },
    ],
  },
  {
    slug: 'bar-whiskey',
    sort_order: 1011,
    name_ru: '\u0412\u0438\u0441\u043A\u0438',
    name_uz: 'Viski',
    name_en: 'Whiskey',
    items: [
      {
        name_ru: 'Chivas 12',
        name_uz: 'Chivas 12',
        name_en: 'Chivas 12',
        price: 0,
        secondary_price: null,
        is_available: false,
        description_ru: '\u041D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0446\u0435\u043D\u0443 (\u0440\u044E\u043C\u043A\u0430 / \u0431\u0443\u0442\u044B\u043B\u043A\u0430).',
        description_uz: 'Narxni tasdiqlash kerak (ryumka / shisha).',
        description_en: 'Price needs admin confirmation (shot / bottle).',
      },
      {
        name_ru: 'Ballantine\u2019s',
        name_uz: 'Ballantine\u2019s',
        name_en: 'Ballantine\u2019s',
        price: 0,
        secondary_price: null,
        is_available: false,
        description_ru: '\u041D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u0446\u0435\u043D\u0443 (\u0440\u044E\u043C\u043A\u0430 / \u0431\u0443\u0442\u044B\u043B\u043A\u0430).',
        description_uz: 'Narxni tasdiqlash kerak (ryumka / shisha).',
        description_en: 'Price needs admin confirmation (shot / bottle).',
      },
      { name_ru: 'Jameson',  name_uz: 'Jameson',  name_en: 'Jameson',  price: 70000, secondary_price: 650000 },
    ],
  },
  {
    slug: 'bar-cognac',
    sort_order: 1012,
    name_ru: '\u041A\u043E\u043D\u044C\u044F\u043A',
    name_uz: 'Konyak',
    name_en: 'Cognac',
    items: [
      { name_ru: 'Uzbekistan',       name_uz: 'Uzbekistan',       name_en: 'Uzbekistan',       price: 13000,  secondary_price: 110000 },
      { name_ru: 'Chateau de Louis', name_uz: 'Chateau de Louis', name_en: 'Chateau de Louis', price: 24000,  secondary_price: 230000 },
      { name_ru: 'Tanbour 7',        name_uz: 'Tanbour 7',        name_en: 'Tanbour 7',        price: 28000,  secondary_price: 240000 },
      { name_ru: 'Hennessy V.S.O.P', name_uz: 'Hennessy V.S.O.P', name_en: 'Hennessy V.S.O.P', price: 170000, secondary_price: 1500000 },
    ],
  },
  {
    slug: 'bar-wine',
    sort_order: 1013,
    name_ru: '\u0412\u0438\u043D\u043E',
    name_uz: 'Vino',
    name_en: 'Wine',
    items: [
      { name_ru: 'Bagizagan',  name_uz: 'Bagizagan',  name_en: 'Bagizagan',  price: 120000 },
      { name_ru: 'Peri',       name_uz: 'Peri',       name_en: 'Peri',       price: 160000 },
      { name_ru: 'Lotos',      name_uz: 'Lotos',      name_en: 'Lotos',      price: 360000 },
      { name_ru: 'Old Tbilisi', name_uz: 'Old Tbilisi', name_en: 'Old Tbilisi', price: 380000 },
    ],
  },
  {
    slug: 'bar-sparkling',
    sort_order: 1014,
    name_ru: '\u0418\u0433\u0440\u0438\u0441\u0442\u043E\u0435',
    name_uz: 'Shampan',
    name_en: 'Sparkling',
    items: [
      { name_ru: 'Martini Asti', name_uz: 'Martini Asti', name_en: 'Martini Asti', price: 600000 },
      { name_ru: 'Salute',       name_uz: 'Salute',       name_en: 'Salute',       price: 180000 },
    ],
  },
  {
    slug: 'bar-vermouth',
    sort_order: 1015,
    name_ru: '\u0412\u0435\u0440\u043C\u0443\u0442',
    name_uz: 'Vermut',
    name_en: 'Vermouth',
    items: [
      { name_ru: 'Martini Bianco',    name_uz: 'Martini Bianco',    name_en: 'Martini Bianco',    price: 80000, secondary_price: 750000 },
      { name_ru: 'Martini Extra dry', name_uz: 'Martini Extra dry', name_en: 'Martini Extra Dry', price: 70000, secondary_price: 650000 },
    ],
  },
  {
    slug: 'bar-tequila',
    sort_order: 1016,
    name_ru: '\u0422\u0435\u043A\u0438\u043B\u0430',
    name_uz: 'Tekila',
    name_en: 'Tequila',
    items: [
      { name_ru: 'Olmeca Silver', name_uz: 'Olmeca Silver', name_en: 'Olmeca Silver', price: 50000, secondary_price: 480000 },
      { name_ru: 'Olmeca Gold',   name_uz: 'Olmeca Gold',   name_en: 'Olmeca Gold',   price: 56000, secondary_price: 540000 },
    ],
  },
  {
    slug: 'bar-gin',
    sort_order: 1017,
    name_ru: '\u0414\u0436\u0438\u043D',
    name_uz: 'Jin',
    name_en: 'Gin',
    items: [
      { name_ru: 'Barrister', name_uz: 'Barrister', name_en: 'Barrister', price: 55000, secondary_price: 520000 },
    ],
  },
  {
    slug: 'bar-rum',
    sort_order: 1018,
    name_ru: '\u0420\u043E\u043C',
    name_uz: 'Rom',
    name_en: 'Rum',
    items: [
      { name_ru: 'Captain Morgan', name_uz: 'Captain Morgan', name_en: 'Captain Morgan', price: 50000, secondary_price: 650000 },
    ],
  },
  {
    slug: 'bar-alcoholic-cocktails',
    sort_order: 1019,
    name_ru: '\u0410\u043B\u043A\u043E\u0433\u043E\u043B\u044C\u043D\u044B\u0435 \u043A\u043E\u043A\u0442\u0435\u0439\u043B\u0438',
    name_uz: 'Alkogolli kokteyllar',
    name_en: 'Alcoholic Cocktails',
    items: [
      { name_ru: '\u0414\u0436\u0438\u043D \u0442\u043E\u043D\u0438\u043A',           name_uz: 'Jin-tonik',       name_en: 'Gin & Tonic',     price: 65000 },
      { name_ru: '\u0422\u0435\u043A\u0438\u043B\u0430 \u0421\u0430\u043D\u0440\u0430\u0439\u0437', name_uz: 'Tekila Sanrayz', name_en: 'Tequila Sunrise', price: 75000 },
      { name_ru: '\u041A\u043E\u0441\u043C\u043E\u043F\u043E\u043B\u0438\u0442\u0435\u043D',     name_uz: 'Kosmopoliten',     name_en: 'Cosmopolitan',    price: 85000 },
      { name_ru: '\u041C\u043E\u0445\u0438\u0442\u043E',                                       name_uz: 'Mohito',           name_en: 'Mojito',          price: 70000 },
      { name_ru: '\u042F\u0433\u043E\u0434\u043D\u044B\u0439 \u0424\u0438\u0437\u0437',         name_uz: 'Rezavor Fizz',     name_en: 'Berry Fizz',      price: 80000 },
      { name_ru: '\u041C\u0430\u0440\u0433\u0430\u0440\u0438\u0442\u0430',                       name_uz: 'Margarita',        name_en: 'Margarita',       price: 90000 },
    ],
  },
];
