import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CustomerSidebar from '../../components/menu/CustomerSidebar.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import ProductDetailDrawer from '../../components/menu/ProductDetailDrawer.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import MenuSkeleton from '../../components/common/MenuSkeleton.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

const heroFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};
const sectionsFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

export default function MenuPage() {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);

  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 'overview' = category cards only.
  // 'products' = continuous product sections starting at startIdx.
  const [mode, setMode] = useState('overview');
  const [activeCatId, setActiveCatId] = useState(null);
  const [startIdx, setStartIdx] = useState(0);

  const sectionRefs = useRef({});
  const programmaticScrollUntilRef = useRef(0);

  // Initial data load.
  useEffect(() => {
    let cancelled = false;
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => {
        if (cancelled) return;
        const activeCats = (c || []).filter((x) => x.is_active !== false);
        const activeProds = (p || []).filter((x) => x.is_active !== false);
        const sortedCats = [...activeCats].sort((a, b) => {
          const ao = typeof a.sort_order === 'number' ? a.sort_order : 999;
          const bo = typeof b.sort_order === 'number' ? b.sort_order : 999;
          return ao - bo;
        });
        setCats(sortedCats);
        setProds(activeProds);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Group products by category id.
  const productsByCat = useMemo(() => {
    const map = {};
    for (const p of prods) {
      if (!map[p.category_id]) map[p.category_id] = [];
      map[p.category_id].push(p);
    }
    return map;
  }, [prods]);

  const productCounts = useMemo(() => {
    const counts = {};
    for (const id of Object.keys(productsByCat)) {
      counts[id] = productsByCat[id].length;
    }
    return counts;
  }, [productsByCat]);

  // Visible categories slice when in products mode.
  const visibleCats = useMemo(() => {
    if (mode !== 'products') return [];
    return cats.slice(startIdx);
  }, [cats, startIdx, mode]);

  // Apply search filter to products inside each visible category section.
  const visibleSections = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return visibleCats
      .map((c) => {
        const all = productsByCat[c.id] || [];
        const filtered = needle
          ? all.filter((p) => {
              const n = (getLocalizedField(p, 'name', lang) || '').toLowerCase();
              const d = (getLocalizedField(p, 'description', lang) || '').toLowerCase();
              return n.includes(needle) || d.includes(needle);
            })
          : all;
        return { category: c, products: filtered };
      })
      .filter((s) => s.products.length > 0);
  }, [visibleCats, productsByCat, q, lang]);

  // Filter category cards in overview by search.
  const overviewCats = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return cats;
    return cats.filter((c) => {
      const n = (getLocalizedField(c, 'name', lang) || '').toLowerCase();
      return n.includes(needle);
    });
  }, [cats, q, lang]);

  // Scrollspy in products mode.
  useEffect(() => {
    if (mode !== 'products' || visibleSections.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticScrollUntilRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('data-cat-id');
          if (id) setActiveCatId(id);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    for (const s of visibleSections) {
      const el = sectionRefs.current[s.category.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [mode, visibleSections]);

  const enterProductsMode = (catId) => {
    const idx = cats.findIndex((c) => c.id === catId);
    if (idx < 0) return;
    setStartIdx(idx);
    setActiveCatId(catId);
    setMode('products');
    setMobileNavOpen(false);
    programmaticScrollUntilRef.current = Date.now() + 900;
    requestAnimationFrame(() => {
      const el = document.getElementById('cat-' + catId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSelectCategory = (catId) => {
    if (mode === 'overview') {
      enterProductsMode(catId);
      return;
    }
    const idxInCats = cats.findIndex((c) => c.id === catId);
    if (idxInCats < startIdx) {
      enterProductsMode(catId);
      return;
    }
    setActiveCatId(catId);
    setMobileNavOpen(false);
    programmaticScrollUntilRef.current = Date.now() + 900;
    requestAnimationFrame(() => {
      const el = document.getElementById('cat-' + catId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleBackToOverview = () => {
    setMode('overview');
    setActiveCatId(null);
    setStartIdx(0);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  const restaurantName =
    (settings && (settings.restaurant_name || settings.name)) || 'Sharq Gavhari';

  const selectedProductCategoryName = useMemo(() => {
    if (!selectedProduct) return '';
    const cat = cats.find((c) => c.id === selectedProduct.category_id);
    return cat ? getLocalizedField(cat, 'name', lang) : '';
  }, [selectedProduct, cats, lang]);

  return (
    <div className="min-h-screen text-white">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('nav.openMenu')}
        className="lg:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white flex items-center justify-center"
      >
        <span aria-hidden className="text-lg leading-none">☰</span>
      </button>

      <CustomerSidebar
        variant="drawer"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={cats}
        productCounts={productCounts}
        activeCategoryId={activeCatId}
        onSelectCategory={handleSelectCategory}
        query={q}
        onQueryChange={setQ}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-16 lg:pt-8 pb-12 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <aside className="hidden lg:block min-w-0">
          <CustomerSidebar
            variant="fixed"
            categories={cats}
            productCounts={productCounts}
            activeCategoryId={activeCatId}
            onSelectCategory={handleSelectCategory}
            query={q}
            onQueryChange={setQ}
          />
        </aside>

        <main className="min-w-0">
          <motion.section
            initial={heroFade.initial}
            animate={heroFade.animate}
            transition={heroFade.transition}
            className="mb-6"
          >
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/80">
              {t('hero.eyebrow')}
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl gold-text">
              {restaurantName}
            </h1>
            <p className="mt-2 text-white/60 text-sm md:text-base max-w-2xl">
              {mode === 'overview' ? t('menu.chooseCategory') : t('hero.description')}
            </p>
          </motion.section>

          {loading ? (
            <MenuSkeleton />
          ) : mode === 'overview' ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg md:text-xl text-white/90">
                  {t('menu.categoriesTitle')}
                </h2>
                <span className="text-white/45 text-sm">{overviewCats.length}</span>
              </div>
              {overviewCats.length === 0 ? (
                <EmptyState
                  title={t('common.empty')}
                  description={t('common.tryDifferent')}
                  icon="image"
                />
              ) : (
                <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                  {overviewCats.map((c) => (
                    <CategoryCard
                      key={c.id}
                      category={c}
                      count={productCounts[c.id] || 0}
                      onClick={() => enterProductsMode(c.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="btn-ghost !py-1.5 !px-3 text-sm"
                >
                  <span aria-hidden className="leading-none">←</span>
                  <span>{t('menu.backToCategories')}</span>
                </button>
              </div>

              {visibleSections.length === 0 ? (
                <EmptyState
                  title={t('common.empty')}
                  description={t('common.tryDifferent')}
                  icon="image"
                />
              ) : (
                <motion.div
                  initial={sectionsFade.initial}
                  animate={sectionsFade.animate}
                  transition={sectionsFade.transition}
                  className="space-y-10"
                >
                  {visibleSections.map((s) => (
                    <section
                      key={s.category.id}
                      id={'cat-' + s.category.id}
                      data-cat-id={s.category.id}
                      ref={(el) => { sectionRefs.current[s.category.id] = el; }}
                      className="scroll-mt-24"
                    >
                      <div className="flex items-end justify-between gap-3 mb-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70 mb-1">
                            {t('menu.categoriesTitle')}
                          </div>
                          <h2 className="font-display text-2xl md:text-3xl gold-text">
                            {getLocalizedField(s.category, 'name', lang)}
                          </h2>
                        </div>
                        <span className="text-white/45 text-sm shrink-0">{s.products.length}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {s.products.map((p) => (
                          <ProductCard key={p.id} product={p} onOpen={handleOpenProduct} />
                        ))}
                      </div>
                    </section>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>

      <ProductDetailDrawer
        product={selectedProduct}
        categoryName={selectedProductCategoryName}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
