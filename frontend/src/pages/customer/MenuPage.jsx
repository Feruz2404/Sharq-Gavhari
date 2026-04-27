import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CustomerHeader from '../../components/common/CustomerHeader.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import CategoryStrip from '../../components/menu/CategoryStrip.jsx';
import SearchBar from '../../components/menu/SearchBar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

const grid = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };

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
      .finally(() => !cancelled && setLoading(false));
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

  if (loading) return <LoadingLogo fullscreen />;

  const showHero = !q && activeCat === 'all';

  return (
    <div className="min-h-screen pb-32">
      <CustomerHeader variant="home" />

      <main className="max-w-6xl mx-auto px-4 pt-5 pb-6 grid gap-7">
        {showHero && (
          <section className="glass-strong p-6 md:p-8 relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <div className="text-[11px] uppercase tracking-[0.32em] text-gold/80">{t('admin.restaurantName')}</div>
              <h1 className="font-display text-3xl md:text-4xl mt-2 leading-tight">
                {settings?.restaurant_name || 'Sharq Gavhari'}
              </h1>
              <p className="text-white/65 mt-3 text-sm md:text-base">
                Discover a curated selection of premium dishes — crafted with care, served with elegance.
              </p>
              <div className="mt-5 flex items-center gap-3 text-xs text-white/55">
                <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gold" /> Fresh ingredients</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gold" /> Crafted recipes</span>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-24 w-72 h-72 rounded-full bg-gold/[0.06] blur-3xl" />
          </section>
        )}

        <div><SearchBar value={q} onChange={setQ} /></div>

        {showHero && cats.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-display text-xl gold-text">{t('admin.categories')}</h2>
              <div className="divider-gold flex-1 ml-4 mb-2" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cats.map((c) => <CategoryCard key={c.id} category={c} />)}
            </div>
          </section>
        )}

        {!showHero && cats.length > 0 && (
          <CategoryStrip categories={cats} active={activeCat} onChange={setActiveCat} />
        )}

        <section>
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-xl gold-text">{t('nav.menu')}</h2>
            {!showHero && (
              <button
                className="text-xs text-white/55 hover:text-white"
                onClick={() => { setQ(''); setActiveCat('all'); }}
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          <motion.div {...grid} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </motion.div>
          {filtered.length === 0 && (
            <div className="mt-3">
              <EmptyState title={t('common.empty')} description="Try a different search or category." icon="search" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
