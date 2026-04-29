import { useEffect, useMemo, useRef, useState } from 'react';
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

const heroFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
};
const sectionFade = {
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.35 },
};

/**
 * Customer menu page \u2014 continuous restaurant menu flow.
 *
 *   Desktop (lg+):  | sticky sidebar (w-72) | scrollable main content    |
 *   Mobile/Tablet:  top bar w/ hamburger \u2192 drawer sidebar; main below.
 *
 * Behavior:
 *   - Loads categories + products once.
 *   - Renders ALL active categories that have products as stacked sections.
 *   - Each section has id `category-${slug}` so it can be linked / deep-linked.
 *   - An IntersectionObserver scroll-spies the visible section and sets the
 *     active sidebar item.
 *   - Clicking a sidebar item or a top category card smooth-scrolls to that
 *     section without unmounting other sections, so the menu reads as one
 *     continuous document.
 *   - Search filters products inside each section; categories with no match
 *     are hidden. Empty state shows only when nothing matches.
 */
export default function MenuPage() {
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);
  const t = useT();

  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [q, setQ] = useState('');
  const [activeCatId, setActiveCatId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // refs to each <section> so we can scroll to / observe them.
  const sectionRefs = useRef({});
  // While a programmatic smooth-scroll is in flight, ignore scroll-spy updates
  // so the active item doesn't ping-pong.
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => {
        if (cancelled) return;
        setCats((c || []).filter((x) => x.is_active !== false));
        setProds((p || []).filter((x) => x.is_active !== false));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Group products by category id, preserving category order.
  const byCategory = useMemo(() => {
    const m = new Map();
    for (const c of cats) m.set(c.id, []);
    for (const p of prods) {
      if (m.has(p.category_id)) m.get(p.category_id).push(p);
    }
    return m;
  }, [cats, prods]);

  const productCounts = useMemo(() => {
    const out = {};
    for (const [id, list] of byCategory) out[id] = list.length;
    return out;
  }, [byCategory]);

  // Apply search filter. Empty query keeps the full grouping.
  const filteredByCategory = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return byCategory;
    const m = new Map();
    for (const c of cats) {
      const list = (byCategory.get(c.id) || []).filter((p) => {
        const n = getLocalizedField(p, 'name', lang).toLowerCase();
        const d = getLocalizedField(p, 'description', lang).toLowerCase();
        return n.includes(needle) || d.includes(needle);
      });
      if (list.length) m.set(c.id, list);
    }
    return m;
  }, [byCategory, cats, q, lang]);

  // Categories that should actually be rendered (have at least one product
  // after filtering).
  const visibleCats = useMemo(
    () => cats.filter((c) => (filteredByCategory.get(c.id) || []).length > 0),
    [cats, filteredByCategory]
  );

  const totalFilteredCount = useMemo(() => {
    let n = 0;
    for (const list of filteredByCategory.values()) n += list.length;
    return n;
  }, [filteredByCategory]);

  // Scrollspy: observe each rendered category section and pick the topmost
  // one currently inside a horizontal band in the middle of the viewport.
  useEffect(() => {
    if (loading) return;
    const elements = visibleCats
      .map((c) => sectionRefs.current[c.id])
      .filter(Boolean);
    if (elements.length === 0) {
      setActiveCatId('all');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollRef.current) return;
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length === 0) return;
        visibleEntries.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        );
        const id = visibleEntries[0].target.getAttribute('data-cat-id');
        if (id) setActiveCatId(id);
      },
      {
        // Detection band: middle ~15% of the viewport. Sections crossing this
        // band become the active section.
        rootMargin: '-30% 0px -55% 0px',
        threshold: [0, 0.1, 0.5, 1],
      }
    );
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [loading, visibleCats]);

  const handleSelectCategory = (id) => {
    setDrawerOpen(false);
    if (id === 'all') {
      setActiveCatId('all');
      programmaticScrollRef.current = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.setTimeout(() => { programmaticScrollRef.current = false; }, 800);
      return;
    }
    const el = sectionRefs.current[id];
    if (!el) return;
    programmaticScrollRef.current = true;
    setActiveCatId(id);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => { programmaticScrollRef.current = false; }, 800);
  };

  const heroBg = (settings && (settings.background_image_url || settings.background_url)) || '';
  const heroBgStyle = useMemo(
    () => (heroBg ? { backgroundImage: 'url(' + heroBg + ')' } : undefined),
    [heroBg]
  );

  const restaurantName = (settings && settings.restaurant_name) || 'Sharq Gavhari';
  const isSearching = !!q.trim();
  const hasAnyResults = visibleCats.length > 0;

  const setSectionRef = (id) => (el) => {
    if (el) sectionRefs.current[id] = el;
    else delete sectionRefs.current[id];
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
            activeCategoryId={activeCatId}
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
          activeCategoryId={activeCatId}
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
              {/* Hero \u2014 hidden while searching to keep results immediate */}
              {!isSearching && (
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

              {/* Top category cards \u2014 jump links to sections */}
              {!isSearching && cats.length > 0 && (
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

              {/* Continuous category sections */}
              {hasAnyResults ? (
                visibleCats.map((c) => {
                  const list = filteredByCategory.get(c.id) || [];
                  const name = getLocalizedField(c, 'name', lang);
                  const desc = getLocalizedField(c, 'description', lang);
                  const slug = c.slug || c.id;
                  return (
                    <motion.section
                      key={c.id}
                      ref={setSectionRef(c.id)}
                      data-cat-id={c.id}
                      data-cat-slug={slug}
                      id={'category-' + slug}
                      className="scroll-mt-24 lg:scroll-mt-10"
                      {...sectionFade}
                    >
                      <header className="flex items-end justify-between mb-3 md:mb-4 gap-4">
                        <div className="min-w-0">
                          <h2 className="font-display text-xl md:text-2xl gold-text truncate">
                            {name}
                          </h2>
                          {desc && (
                            <p className="text-white/55 text-xs md:text-sm mt-1 line-clamp-2 max-w-2xl">
                              {desc}
                            </p>
                          )}
                        </div>
                        <div className="hidden md:flex items-center gap-3 shrink-0 mb-1">
                          <span className="text-[11px] tabular-nums text-white/40 uppercase tracking-[0.2em]">
                            {list.length}
                          </span>
                          <div className="divider-gold w-24 mb-1" />
                        </div>
                      </header>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                        {list.map((p) => <ProductCard key={p.id} product={p} />)}
                      </div>
                    </motion.section>
                  );
                })
              ) : (
                <EmptyState
                  title={t('common.empty')}
                  description={isSearching ? t('common.tryDifferent') : t('menu.noProductsInCategory')}
                  icon="search"
                />
              )}

              {/* Clear search shortcut */}
              {isSearching && hasAnyResults && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setQ('')}
                    className="btn-ghost text-xs"
                  >
                    {t('common.clear')} ({totalFilteredCount})
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
