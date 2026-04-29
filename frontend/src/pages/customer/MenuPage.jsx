import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CustomerSidebar from '../../components/menu/CustomerSidebar.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import ProductDetailDrawer from '../../components/menu/ProductDetailDrawer.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import MenuSkeleton from '../../components/common/MenuSkeleton.jsx';
import AdminAccessButton from '../../components/common/AdminAccessButton.jsx';
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

const gridFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
};

export default function MenuPage() {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => {
        if (cancelled) return;
        const activeCats = (c || []).filter((x) => x.is_active !== false);
        const activeProds = (p || []).filter((x) => x.is_active !== false);
        setCats(activeCats);
        setProds(activeProds);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const productCounts = useMemo(() => {
    const counts = {};
    for (const p of prods) {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    }
    return counts;
  }, [prods]);

  // Default selected category: first active category with at least one product.
  useEffect(() => {
    if (loading) return;
    if (activeCatId !== null) return;
    const firstWithProducts = cats.find((c) => (productCounts[c.id] || 0) > 0);
    setActiveCatId(firstWithProducts ? firstWithProducts.id : 'all');
  }, [loading, cats, productCounts, activeCatId]);

  const filteredProducts = useMemo(() => {
    let list = prods;
    if (activeCatId && activeCatId !== 'all') {
      list = list.filter((p) => p.category_id === activeCatId);
    }
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((p) => {
        const n = (getLocalizedField(p, 'name', lang) || '').toLowerCase();
        const d = (getLocalizedField(p, 'description', lang) || '').toLowerCase();
        return n.includes(needle) || d.includes(needle);
      });
    }
    return list;
  }, [prods, activeCatId, q, lang]);

  const activeCategory = useMemo(
    () => (activeCatId && activeCatId !== 'all' ? cats.find((c) => c.id === activeCatId) : null),
    [cats, activeCatId]
  );

  const handleSelectCategory = (id) => {
    setActiveCatId(id);
    setMobileNavOpen(false);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('product-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  const restaurantName =
    (settings && (settings.restaurant_name || settings.name)) || 'Sharq Gavhari';
  const isSearching = q.trim().length > 0;
  const sectionEyebrow = isSearching
    ? t('menu.filteredTitle')
    : t('menu.selectedCategory');
  const sectionTitle = activeCategory
    ? getLocalizedField(activeCategory, 'name', lang)
    : t('menu.allProducts');
  const sectionCount = filteredProducts.length;

  return (
    <div className="min-h-screen text-white">
      <CustomerSidebar
        variant="fixed"
        categories={cats}
        productCounts={productCounts}
        totalCount={prods.length}
        activeCategoryId={activeCatId}
        onSelectCategory={handleSelectCategory}
        query={q}
        onQueryChange={setQ}
      />

      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('nav.openMenu')}
        className="lg:hidden fixed top-3 left-3 z-30 w-10 h-10 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white flex items-center justify-center"
      >
        <span aria-hidden className="text-lg leading-none">\u2630</span>
      </button>

      <CustomerSidebar
        variant="drawer"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={cats}
        productCounts={productCounts}
        totalCount={prods.length}
        activeCategoryId={activeCatId}
        onSelectCategory={handleSelectCategory}
        query={q}
        onQueryChange={setQ}
      />

      <main className="lg:ml-[280px] xl:ml-[300px] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <motion.section initial={heroFade.initial} animate={heroFade.animate} transition={heroFade.transition} className="mb-7">
            <div className="text-[11px] uppercase tracking-[0.22em] text-gold/80">
              {t('hero.eyebrow')}
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-4xl lg:text-5xl gold-text">
              {restaurantName}
            </h1>
            <p className="mt-2 text-white/60 text-sm md:text-base max-w-2xl">
              {t('hero.description')}
            </p>
          </motion.section>

          {loading ? (
            <MenuSkeleton />
          ) : (
            <>
              {cats.length > 0 && (
                <section className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-lg md:text-xl text-white/90">
                      {t('menu.categoriesTitle')}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('all')}
                      className={
                        'glass aspect-[5/4] flex flex-col items-center justify-center text-center p-3 rounded-2xl transition ' +
                        (activeCatId === 'all'
                          ? 'ring-2 ring-gold/60 bg-gold/5'
                          : 'hover:bg-white/[0.04]')
                      }
                    >
                      <span className="font-display text-base text-white">
                        {t('menu.allProducts')}
                      </span>
                      <span className="mt-1 text-xs text-white/50">{prods.length}</span>
                    </button>
                    {cats.map((c) => {
                      const active = activeCatId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={active ? 'rounded-2xl ring-2 ring-gold/60' : ''}
                        >
                          <CategoryCard
                            category={c}
                            count={productCounts[c.id] || 0}
                            onClick={() => handleSelectCategory(c.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section id="product-grid" className="scroll-mt-20">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-gold/70 mb-1">
                      {sectionEyebrow}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl gold-text">
                      {sectionTitle}
                    </h2>
                  </div>
                  <span className="text-white/45 text-sm shrink-0">{sectionCount}</span>
                </div>

                {filteredProducts.length === 0 ? (
                  <EmptyState
                    title={t('common.empty')}
                    description={isSearching ? t('common.tryDifferent') : t('menu.noProductsInCategory')}
                    icon="image"
                  />
                ) : (
                  <motion.div
                    initial={gridFade.initial}
                    animate={gridFade.animate}
                    transition={gridFade.transition}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
                  >
                    {filteredProducts.map((p) => (
                      <ProductCard key={p.id} product={p} onOpen={handleOpenProduct} />
                    ))}
                  </motion.div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      <AdminAccessButton />
      <ProductDetailDrawer
        product={selectedProduct}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}
