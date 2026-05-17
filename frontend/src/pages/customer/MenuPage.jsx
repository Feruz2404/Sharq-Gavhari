import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CustomerSidebar from '../../components/menu/CustomerSidebar.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import ProductDetailDrawer from '../../components/menu/ProductDetailDrawer.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import MenuSkeleton from '../../components/common/MenuSkeleton.jsx';
import Icon from '../../components/common/Icon.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

const BAR_PARENT_SLUG = 'bar';

// Module-level menu cache. Survives across MenuPage mounts within the same
// tab session so navigating Menu → Cart → Back-to-Menu reuses the previously
// loaded categories + products *instantly* (no spinner, no refetch flash).
// A background refresh runs in the background after TTL elapses so the page
// silently updates when something changed admin-side.
//   * Reset only happens on hard reload — we never clear it from cart, QR
//     entry, or language switch.
//   * Settings are not cached here; useSettingsStore handles that.
let _menuCache = null;            // { cats, prods, ts }
const MENU_CACHE_TTL_MS = 5 * 60 * 1000;

// Product grid (mobile-first). Two big design decisions:
//   1. auto-fill (not auto-fit) keeps empty tracks reserved, so a category
//      with 1 product never has the single card stretch to fill the row.
//   2. justify-center centres the row of tracks within the main column when
//      there is leftover space (e.g. tracks at their max), avoiding the
//      huge empty right-side gap we had with justify-start.
// Tier bounds (paired with sidebar-from-lg):
//   <390px   : 1 col
//   390-639  : 2 cols (1fr each, phones / small tablets)
//   sm 640+  : auto-fill minmax(230px, 280px)   (iPad portrait, no sidebar)
//   lg 1024+ : auto-fill minmax(240px, 310px)   (iPad landscape, sidebar 280)
//                The lower 240 min ensures 3 tracks still fit at 1180px iPad
//                Air landscape after subtracting the 280 sidebar; at 1024
//                iPad landscape the grid degrades to 2 premium 310px cards.
//   xl 1280+ : auto-fill minmax(280px, 340px)   (desktop, sidebar 300)
const PRODUCT_GRID_CLS =
  'grid gap-5 sm:gap-6 justify-center ' +
  'grid-cols-1 min-[390px]:grid-cols-2 ' +
  'sm:grid-cols-[repeat(auto-fill,minmax(230px,280px))] ' +
  'lg:grid-cols-[repeat(auto-fill,minmax(240px,310px))] ' +
  'xl:grid-cols-[repeat(auto-fill,minmax(280px,340px))]';

// Category overview grid — same balanced pattern but tuned to smaller square
// category tiles. 2 cols on phone, 3-ish on tablet, 3-4 on desktop.
const CATEGORY_GRID_CLS =
  'grid gap-4 sm:gap-5 xl:gap-6 justify-center ' +
  'grid-cols-2 ' +
  'sm:grid-cols-[repeat(auto-fill,minmax(190px,240px))] ' +
  'lg:grid-cols-[repeat(auto-fill,minmax(200px,260px))] ' +
  'xl:grid-cols-[repeat(auto-fill,minmax(220px,290px))]';

// Safe-area-aware vertical offsets (Tailwind arbitrary values, underscores
// stand in for spaces inside calc() / max()).
const HAMBURGER_TOP_CLS =
  'top-[max(12px,_calc(env(safe-area-inset-top,_0px)_+_8px))]';
const MAIN_PAD_TOP_CLS =
  'pt-[max(4rem,_calc(env(safe-area-inset-top,_0px)_+_4rem))]';

const heroFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: 'easeOut' },
};
const sectionsFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

function normalizeMenu(rawCats, rawProds) {
  const activeCats = (rawCats || []).filter((x) => x.is_active !== false);
  const activeProds = (rawProds || []).filter((x) => x.is_active !== false);
  const sortedCats = [...activeCats].sort((a, b) => {
    const ao = typeof a.sort_order === 'number' ? a.sort_order : 999;
    const bo = typeof b.sort_order === 'number' ? b.sort_order : 999;
    return ao - bo;
  });
  return { cats: sortedCats, prods: activeProds };
}

export default function MenuPage() {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  // Seed from cache on first render so the page paints instantly when
  // returning from /cart or /product/:id.
  const [cats, setCats] = useState(() => (_menuCache ? _menuCache.cats : []));
  const [prods, setProds] = useState(() => (_menuCache ? _menuCache.prods : []));
  const [loading, setLoading] = useState(() => !_menuCache);
  const [q, setQ] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [mode, setMode] = useState('overview');
  const [activeCatId, setActiveCatId] = useState(null);
  const [startIdx, setStartIdx] = useState(0);

  const sectionRefs = useRef({});
  const programmaticScrollUntilRef = useRef(0);

  // Stale-while-revalidate: if cache is fresh, skip the network. Otherwise
  // refetch in the background — the UI is already rendering cached data so
  // there is no spinner-flash. On a fully cold tab we fall through to the
  // initial fetch + loading state.
  useEffect(() => {
    let cancelled = false;
    const cached = _menuCache;
    const isFresh = cached && Date.now() - cached.ts < MENU_CACHE_TTL_MS;
    if (isFresh) return undefined;

    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => {
        if (cancelled) return;
        const { cats: nextCats, prods: nextProds } = normalizeMenu(c, p);
        _menuCache = { cats: nextCats, prods: nextProds, ts: Date.now() };
        setCats(nextCats);
        setProds(nextProds);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!settings) fetchSettings();
  }, [settings, fetchSettings]);

  const barCat = useMemo(
    () => cats.find((c) => c.slug === BAR_PARENT_SLUG) || null,
    [cats]
  );
  const barChildren = useMemo(() => {
    if (!barCat) return [];
    return cats.filter((c) => {
      if (c.id === barCat.id) return false;
      if (c.parent_id) return c.parent_id === barCat.id;
      return typeof c.slug === 'string' && c.slug.startsWith('bar-');
    });
  }, [cats, barCat]);

  const topLevelCats = useMemo(() => {
    const childIds = new Set(barChildren.map((c) => c.id));
    return cats.filter((c) => !childIds.has(c.id) && !c.parent_id);
  }, [cats, barChildren]);

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
    if (barCat) {
      let total = counts[barCat.id] || 0;
      for (const child of barChildren) total += productsByCat[child.id] ? productsByCat[child.id].length : 0;
      counts[barCat.id] = total;
    }
    return counts;
  }, [productsByCat, barCat, barChildren]);

  const visibleCats = useMemo(() => {
    if (mode === 'bar') return barChildren;
    if (mode === 'products') {
      const barId = barCat ? barCat.id : null;
      return topLevelCats.slice(startIdx).filter((c) => c.id !== barId);
    }
    return [];
  }, [mode, barChildren, topLevelCats, startIdx, barCat]);

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

  const overviewCats = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return topLevelCats;
    return topLevelCats.filter((c) => {
      const n = (getLocalizedField(c, 'name', lang) || '').toLowerCase();
      return n.includes(needle);
    });
  }, [topLevelCats, q, lang]);

  useEffect(() => {
    if ((mode !== 'products' && mode !== 'bar') || visibleSections.length === 0) return undefined;
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

  const enterBarMode = () => {
    setMode('bar');
    setMobileNavOpen(false);
    setActiveCatId(barCat ? barCat.id : null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const enterProductsMode = (catId) => {
    if (barCat && catId === barCat.id) {
      enterBarMode();
      return;
    }
    const idx = topLevelCats.findIndex((c) => c.id === catId);
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
    if (barCat && catId === barCat.id) {
      enterBarMode();
      return;
    }
    const idxInTopLevel = topLevelCats.findIndex((c) => c.id === catId);
    if (idxInTopLevel < 0) return;
    if (mode === 'bar' || idxInTopLevel < startIdx) {
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

  const handleSelectBarChild = (childId) => {
    setActiveCatId(childId);
    programmaticScrollUntilRef.current = Date.now() + 900;
    requestAnimationFrame(() => {
      const el = document.getElementById('cat-' + childId);
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

  const sidebarActiveId = mode === 'bar' && barCat ? barCat.id : activeCatId;

  const heroBg = settings && settings.background_image_url;
  const heroStyle = useMemo(
    () => (heroBg
      ? {
          backgroundImage:
            'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.92) 100%), url(' + heroBg + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : undefined),
    [heroBg]
  );
  const heroClass = heroBg
    ? 'mb-7 relative overflow-hidden rounded-3xl border border-white/10 px-6 py-9 lg:px-9 lg:py-12 shadow-soft'
    : 'mb-7';

  const heroSubtitle =
    mode === 'overview'
      ? t('menu.chooseCategory')
      : mode === 'bar'
        ? (getLocalizedField(barCat, 'name', lang) || 'Bar')
        : t('hero.description');

  return (
    <div className="min-h-screen text-white">
      {/* Hamburger — fixed, safe-area-aware top offset, never overlaps the
          notch on iPhone. Shown below lg so phones and iPad portrait open the
          sidebar as an overlay; iPad landscape (1024+) gets the fixed sidebar
          inside the grid below. */}
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('nav.openMenu')}
        className={`lg:hidden fixed left-3 z-30 w-11 h-11 rounded-full bg-black/65 backdrop-blur-md border border-white/10 text-white/90 hover:text-gold hover:border-gold/30 transition flex items-center justify-center shadow-soft ${HAMBURGER_TOP_CLS}`}
      >
        <Icon name="menu" size={18} />
      </button>

      <CustomerSidebar
        variant="drawer"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        categories={topLevelCats}
        productCounts={productCounts}
        activeCategoryId={sidebarActiveId}
        onSelectCategory={handleSelectCategory}
        query={q}
        onQueryChange={setQ}
      />

      {/* Page container.
          • max-w-[1380px] is wide enough for desktop premium cards.
          • px-4 / lg:px-6 (no xl bump) leaves ≥900px main column at 1280.
          • Grid switches on at lg (1024+) so iPad landscape sees the sidebar.
          • lg uses a slimmer 280px sidebar so the main column has enough room
            for premium product cards; xl bumps back to the standard 300px. */}
      <div
        className={`max-w-[1380px] mx-auto px-4 lg:px-6 ${MAIN_PAD_TOP_CLS} lg:pt-8 pb-12 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8`}
      >
        <aside className="hidden lg:block min-w-0">
          <CustomerSidebar
            variant="fixed"
            categories={topLevelCats}
            productCounts={productCounts}
            activeCategoryId={sidebarActiveId}
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
            className={heroClass}
            style={heroStyle}
          >
            <div className="text-[11px] uppercase tracking-[0.32em] text-gold/85 font-medium">
              {t('hero.eyebrow')}
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl lg:text-5xl gold-text leading-[1.05] text-balance">
              {restaurantName}
            </h1>
            <div className="mt-3.5 h-px w-16 bg-gradient-to-r from-gold/85 via-gold/45 to-transparent" />
            <p className="mt-4 text-white/72 text-sm md:text-base max-w-2xl leading-relaxed text-pretty">
              {heroSubtitle}
            </p>
          </motion.section>

          {loading ? (
            <MenuSkeleton />
          ) : mode === 'overview' ? (
            <section>
              <div className="flex items-end justify-between gap-3 mb-4 min-w-0">
                <div className="min-w-0">
                  <div className="text-[10.5px] uppercase tracking-[0.28em] text-gold/70 mb-1">
                    {t('menu.categoriesTitle')}
                  </div>
                  <h2 className="font-display text-xl md:text-2xl text-white/95 leading-tight truncate">
                    {t('menu.chooseCategory')}
                  </h2>
                </div>
                <span className="text-white/45 text-sm tabular-nums shrink-0">{overviewCats.length}</span>
              </div>
              {overviewCats.length === 0 ? (
                <EmptyState
                  title={t('common.empty')}
                  description={t('common.tryDifferent')}
                  icon="image"
                />
              ) : (
                <div className={CATEGORY_GRID_CLS}>
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
          ) : mode === 'bar' ? (
            <BarView
              barCat={barCat}
              barChildren={barChildren}
              visibleSections={visibleSections}
              activeCatId={activeCatId}
              productCounts={productCounts}
              onSelectChild={handleSelectBarChild}
              onBack={handleBackToOverview}
              onOpenProduct={handleOpenProduct}
              sectionRefs={sectionRefs}
              t={t}
              lang={lang}
            />
          ) : (
            <>
              <div className="mb-5 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border border-white/10 bg-white/[0.04] text-white/80 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition shrink-0"
                >
                  <Icon name="back" size={14} className="transition group-hover:-translate-x-0.5" />
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
                  className="space-y-12"
                >
                  {visibleSections.map((s) => (
                    <section
                      key={s.category.id}
                      id={'cat-' + s.category.id}
                      data-cat-id={s.category.id}
                      ref={(el) => { sectionRefs.current[s.category.id] = el; }}
                      className="scroll-mt-24"
                    >
                      <div className="flex items-end justify-between gap-3 mb-5 min-w-0">
                        <div className="min-w-0">
                          <div className="text-[10.5px] uppercase tracking-[0.28em] text-gold/70 mb-1">
                            {t('menu.categoriesTitle')}
                          </div>
                          <h2 className="font-display text-2xl md:text-3xl gold-text leading-[1.1] truncate">
                            {getLocalizedField(s.category, 'name', lang)}
                          </h2>
                          <div className="mt-2 h-px w-10 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent" />
                        </div>
                        <span className="text-white/45 text-sm tabular-nums shrink-0 mb-1">{s.products.length}</span>
                      </div>
                      <div className={PRODUCT_GRID_CLS}>
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

/* -------------------------------------------------------------------------- */
/* Bar nested view: chip rail + grouped product sections                       */
/* -------------------------------------------------------------------------- */
function BarView({
  barCat,
  barChildren,
  visibleSections,
  activeCatId,
  productCounts,
  onSelectChild,
  onBack,
  onOpenProduct,
  sectionRefs,
  t,
  lang,
}) {
  const barName = getLocalizedField(barCat, 'name', lang) || 'Bar';

  const visibleChildIds = new Set(visibleSections.map((s) => s.category.id));
  const chipChildren = barChildren.filter((c) => visibleChildIds.has(c.id));

  return (
    <>
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border border-white/10 bg-white/[0.04] text-white/80 hover:text-gold hover:border-gold/30 hover:bg-gold/5 transition shrink-0"
        >
          <Icon name="back" size={14} className="transition group-hover:-translate-x-0.5" />
          <span>{t('menu.backToCategories')}</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="text-[10.5px] uppercase tracking-[0.28em] text-gold/70 mb-1">
          {t('menu.categoriesTitle')}
        </div>
        <h2 className="font-display text-3xl md:text-4xl gold-text leading-[1.05]">{barName}</h2>
        <div className="mt-2.5 h-px w-12 bg-gradient-to-r from-gold/85 via-gold/45 to-transparent" />
      </div>

      {chipChildren.length > 0 && (
        <div className="mb-7 -mx-4 lg:mx-0 px-4 lg:px-0 overflow-x-auto no-scrollbar">
          <div className="flex lg:flex-wrap gap-2 lg:gap-2.5 min-w-min">
            {chipChildren.map((c) => {
              const name = getLocalizedField(c, 'name', lang);
              const active = activeCatId === c.id;
              const count = productCounts[c.id] || 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectChild(c.id)}
                  aria-pressed={active}
                  className={
                    'shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] border transition ' +
                    (active
                      ? 'bg-gold/[0.12] border-gold/40 text-gold shadow-[0_4px_18px_-8px_rgba(212,175,55,0.55)]'
                      : 'bg-white/[0.04] border-white/10 text-white/80 hover:text-white hover:border-white/20')
                  }
                >
                  <span className="truncate max-w-[180px]">{name}</span>
                  <span
                    className={
                      'text-[11px] tabular-nums px-1.5 py-0.5 rounded-md ring-1 transition ' +
                      (active
                        ? 'text-gold/90 bg-gold/10 ring-gold/30'
                        : 'text-white/55 bg-white/[0.04] ring-white/10')
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          className="space-y-12"
        >
          {visibleSections.map((s) => (
            <section
              key={s.category.id}
              id={'cat-' + s.category.id}
              data-cat-id={s.category.id}
              ref={(el) => { sectionRefs.current[s.category.id] = el; }}
              className="scroll-mt-24"
            >
              <div className="flex items-end justify-between gap-3 mb-5 min-w-0">
                <div className="min-w-0">
                  <div className="text-[10.5px] uppercase tracking-[0.28em] text-gold/70 mb-1">
                    {barName}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl gold-text leading-[1.1] truncate">
                    {getLocalizedField(s.category, 'name', lang)}
                  </h3>
                  <div className="mt-2 h-px w-10 bg-gradient-to-r from-gold/80 via-gold/40 to-transparent" />
                </div>
                <span className="text-white/45 text-sm tabular-nums shrink-0 mb-1">{s.products.length}</span>
              </div>
              <div className={PRODUCT_GRID_CLS}>
                {s.products.map((p) => (
                  <ProductCard key={p.id} product={p} onOpen={onOpenProduct} />
                ))}
              </div>
            </section>
          ))}
        </motion.div>
      )}
    </>
  );
}
