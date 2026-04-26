import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import SearchBar from '../../components/menu/SearchBar.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

export default function MenuPage() {
  const lang = useLanguageStore((s) => s.language);
  const settings = useSettingsStore((s) => s.settings);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const t = useT();
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => { setCats(c); setProds(p); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return prods;
    const needle = q.toLowerCase();
    return prods.filter((p) => {
      const n = getLocalizedField(p, 'name', lang).toLowerCase();
      const d = getLocalizedField(p, 'description', lang).toLowerCase();
      return n.includes(needle) || d.includes(needle);
    });
  }, [prods, q, lang]);

  if (loading) return <LoadingLogo fullscreen />;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {settings?.logo_url && <img src={settings.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />}
            <div className="truncate">
              <div className="font-display text-lg gold-text truncate">{settings?.restaurant_name || 'Sharq Gavhari'}</div>
              {tableNumber && <div className="text-[10px] text-white/50 uppercase tracking-wider">{t('common.table')} #{tableNumber}</div>}
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3"><SearchBar value={q} onChange={setQ} /></div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 grid gap-6">
        {!q && cats.length > 0 && (
          <section>
            <h2 className="font-display text-xl mb-3">{t('admin.categories')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cats.map((c) => <CategoryCard key={c.id} category={c} />)}
            </div>
          </section>
        )}
        <section>
          <motion.div initial= opacity: 0  animate= opacity: 1  className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            {filtered.length === 0 && <div className="col-span-full text-center text-white/50 py-10">{t('common.empty')}</div>}
          </motion.div>
        </section>
      </main>
    </div>
  );
}
