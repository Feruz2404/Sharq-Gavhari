import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/common/Icon.jsx';
import CustomerSidebar from '../../components/menu/CustomerSidebar.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import MenuSkeleton from '../../components/common/MenuSkeleton.jsx';
import AdminAccessButton from '../../components/common/AdminAccessButton.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

const gridFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};
const heroFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
};

/**
 * Customer menu page (sidebar + main layout).
 *
 *   Desktop (lg+):  | sidebar (w-72) | main content                 |
 *   Mobile/Tablet:  top bar w/ hamburger \u2192 drawer sidebar; main below.
 *
 * Sidebar contents: brand, language switcher, search, vertical category nav,
 * admin / install / cart shortcuts. Selecting a category filters in-page.
 *
 * Main content:
 *   1. Compact hero (uses settings.background_image_url as the DISTINCT hero
 *      visual; the page background gradient is decoupled \u2014 see
 *      settingsStore + index.css)
 *   2. Either: category cards grid (default home view) OR filtered product
 *      grid (when a category is selected or search is active)
 *
 * The old "Featured" row and duplicate "general menu" grid are removed.
 */
export default function MenuPage() {
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);
  const t = useT();

  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => {
        if (cancelled) return;
        setCats(c.filter((x) => x.is_active !== false));
        setProds(p.filter((x) => x.is_active !== false));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const productCounts = useMemo(() => {
    const m = {};
    for (const p of prods) {
      const k = p.category_id;
      if (!k) continue;
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [prods]);

  const filtered = useMemo(() => {
    let list = prods;
    if (activeCat !== 'all') list = list.filter((p) => p.category_id === activeCat);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((p) => {
        const n = getLocalizedField(p, 'name', lang).toLowerCase();
        const d = getLocalizedField(p, 'description', lang).toLowerCase();
        return n.includes(needle) || d.includes(needle);
      });
    }
    return list;
  }, [prods, q, activeCat, lang]);

  const heroBg = (settings && (settings.background_image_url || settings.background_url)) || '';
  const heroBgStyle = useMemo(
    () => (heroBg ? { backgroundImage: 'url(' + heroBg + ')' } : undefined),
    [heroBg]
  );

  const restaurantName = (settings && settings.restaurant_name) || 'Sharq Gavhari';
  const isFiltering = !!q.trim() || activeCat !== 'all';

  const activeCatObj = activeCat !== 'all'
    ? cats.find((c) => c.id === activeCat) || null
    : null;
  const filteredTitle = q.trim()
    ? t('menu.filteredTitle')
    : (activeCatObj ? getLocalizedField(activeCatObj, 'name', lang) : t('menu.filteredTitle'));

  const handleSelectCategory = (id) => {
    setActiveCat(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Mobile/tablet top bar (hidden on lg+) */}
      <header className="lg:hidden surface-header header-safe">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-icon shrink-0"
            aria-label={t('nav.openMenu')}
          >
            <Icon name="menu" size={18} className="text-white/85" />
          </button>
          <div className="flex-1 text-center font-display text-base gold-text truncate">
            {restaurantName}
          </div>
          <AdminAccessButton />
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto lg:px-6 lg:py-6 lg:flex lg:gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <CustomerSidebar
            variant="fixed"
            categories={cats}
            productCounts={productCounts}
            totalCount={prods.length}
            activeCategoryId={activeCat}
            onSelectCategory={handleSelectCategory}
            query={q}
            onQueryChange={setQ}
          />
        </aside>

        {/* Mobile/tablet drawer */}
        <CustomerSidebar
          variant="drawer"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          categories={cats}
          productCounts={productCounts}
          totalCount={prods.length}
          activeCategoryId={activeCat}
          onSelectCategory={handleSelectCategory}
          query={q}
          onQueryChange={setQ}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 lg:px-0 py-5 lg:py-0 grid gap-7 md:gap-9">
          {loading ? (
            <MenuSkeleton />
          ) : (
            <>
              {/* Compact hero \u2014 shown only on the default home view */}
              {!isFiltering && (
                <motion.section
                  {...heroFade}
                  className="relative overflow-hidden rounded-3xl border border-white/10 shadow-soft"
                >
                  {heroBg ? (
                    <div className="absolute inset-0 bg-cover bg-center scale-105" style={heroBgStyle} aria-hidden="true" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-zinc-950 to-black" aria-hidden="true" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/65 to-black/15" aria-hidden="true" />
                  <div className="relative z-10 p-6 md:p-10 min-h-[220px] md:min-h-[320px] flex flex-col justify-end">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-gold/85">
                      {t('hero.eyebrow')}
                    </div>
                    <h1 className="font-display text-3xl md:text-5xl mt-2 leading-tight gold-text drop-shadow-[0_2px_24px_rgba(0,0,0,0.8)]">
                      {restaurantName}
                    </h1>
                    <p className="text-white/85 mt-3 max-w-xl text-sm md:text-base">
                      {t('hero.description')}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="pill !text-gold !border-gold/40">{t('hero.tagFresh')}</span>
                      <span className="pill !text-gold !border-gold/40">{t('hero.tagCrafted')}</span>
                      <span className="pill !text-gold !border-gold/40">{t('hero.tagPicked')}</span>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-10 -top-10 w-72 h-72 rounded-full bg-gold/10 blur-3xl" />
                </motion.section>
              )}

              {/* Categories grid \u2014 default home view */}
              {!isFiltering && cats.length > 0 && (
                <section>
                  <div className="flex items-end justify-between mb-3 md:mb-4">
                    <h2 className="font-display text-xl md:text-2xl gold-text">
                      {t('menu.categoriesTitle')}
                    </h2>
                    <div className="divider-gold flex-1 ml-4 mb-2" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {cats.map((c) => (
                      <CategoryCard
                        key={c.id}
                        category={c}
                        onClick={() => handleSelectCategory(c.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Filtered products */}
              {isFiltering && (
                <section>
                  <div className="flex items-end justify-between mb-3">
                    <h2 className="font-display text-xl md:text-2xl gold-text truncate">
                      {filteredTitle}
                    </h2>
                    <button
                      type="button"
                      className="text-xs text-white/55 hover:text-white shrink-0"
                      onClick={() => { setQ(''); setActiveCat('all'); }}
                    >
                      {t('common.clear')}
                    </button>
                  </div>
                  {filtered.length > 0 ? (
                    <motion.div
                      {...gridFade}
                      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
                    >
                      {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                    </motion.div>
                  ) : (
                    <EmptyState
                      title={t('common.empty')}
                      description={
                        q.trim()
                          ? t('common.tryDifferent')
                          : t('menu.noProductsInCategory')
                      }
                      icon="search"
                    />
                  )}
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
