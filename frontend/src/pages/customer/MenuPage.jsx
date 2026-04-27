import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CustomerHeader from '../../components/common/CustomerHeader.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import CategoryStrip from '../../components/menu/CategoryStrip.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import MenuSkeleton from '../../components/common/MenuSkeleton.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

const grid     = { initial: { opacity: 0, y: 8 },  animate: { opacity: 1, y: 0 }, transition: { duration: 0.30 } };
const heroFade = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 } };

/**
 * Customer menu page.
 *
 * Structure (post-cleanup):
 *   1. Sticky header (with embedded search)
 *   2. Hero / welcome banner   —  shown only when not searching/filtering
 *   3. Categories grid         —  shown only when not searching/filtering
 *   4. Filtered results grid   —  shown only when searching/filtering
 *      (with category-strip chip filter on top)
 *
 * Removed: old Featured row and the duplicate "general menu" grid.
 * Loading is now a premium skeleton instead of a fullscreen logo.
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

  // Hero uses the uploaded "background" image as its DISTINCT visual identity.
  // The page background is now a static cinematic gradient (see index.css /
  // settingsStore) so the two visuals are never the same image.
  const heroBg = (settings && (settings.background_image_url || settings.background_url)) || '';
  const heroBgStyle = useMemo(
    () => (heroBg ? { backgroundImage: 'url(' + heroBg + ')' } : undefined),
    [heroBg]
  );

  const restaurantName = (settings && settings.restaurant_name) || 'Sharq Gavhari';
  const isFiltering = !!q.trim() || activeCat !== 'all';

  return (
    <div className="min-h-screen pb-32">
      <CustomerHeader variant="home" search= value: q, onChange: setQ  />

      <main className="max-w-6xl mx-auto px-4 pt-5 md:pt-7 pb-6 grid gap-7 md:gap-9">
        {loading ? (
          <MenuSkeleton />
        ) : (
          <>
            {!isFiltering && (
              <motion.section
                {...heroFade}
                className="relative overflow-hidden rounded-3xl border border-white/10 shadow-soft"
              >
                {/* Background layer: uploaded image OR elegant dark gradient fallback. */}
                {heroBg ? (
                  <div className="absolute inset-0 bg-cover bg-center scale-105" style={heroBgStyle} aria-hidden="true" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-900/40 via-zinc-950 to-black" aria-hidden="true" />
                )}
                {/* Single readable graded overlay so text stays legible without flattening the photo. */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/65 to-black/15" aria-hidden="true" />
                <div className="relative z-10 p-6 md:p-12 min-h-[280px] md:min-h-[400px] flex flex-col justify-end">
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

            {!isFiltering && cats.length > 0 && (
              <section>
                <div className="flex items-end justify-between mb-3 md:mb-4">
                  <h2 className="font-display text-xl md:text-2xl gold-text">
                    {t('menu.categoriesTitle')}
                  </h2>
                  <div className="divider-gold flex-1 ml-4 mb-2" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {cats.map((c) => <CategoryCard key={c.id} category={c} />)}
                </div>
              </section>
            )}

            {isFiltering && (
              <>
                {cats.length > 0 && (
                  <CategoryStrip categories={cats} active={activeCat} onChange={setActiveCat} />
                )}
                <section>
                  <div className="flex items-end justify-between mb-3">
                    <h2 className="font-display text-xl md:text-2xl gold-text">
                      {t('menu.filteredTitle')}
                    </h2>
                    <button
                      type="button"
                      className="text-xs text-white/55 hover:text-white"
                      onClick={() => { setQ(''); setActiveCat('all'); }}
                    >
                      {t('common.clear')}
                    </button>
                  </div>
                  <motion.div {...grid} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                  </motion.div>
                  {filtered.length === 0 && (
                    <div className="mt-3">
                      <EmptyState
                        title={t('common.empty')}
                        description={t('common.tryDifferent')}
                        icon="search"
                      />
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
