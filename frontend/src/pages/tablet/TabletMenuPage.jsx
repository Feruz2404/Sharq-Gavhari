import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../../components/menu/ProductCard.jsx';
import SearchBar from '../../components/menu/SearchBar.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

export default function TabletMenuPage() {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [q, setQ] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([categoryService.list(), productService.list()])
      .then(([c, p]) => { setCats(c); setProds(p); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = prods;
    if (activeCat !== 'all') list = list.filter((p) => p.category_id === activeCat);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((p) => getLocalizedField(p, 'name', lang).toLowerCase().includes(needle));
    }
    return list;
  }, [prods, q, activeCat, lang]);

  if (loading) return <LoadingLogo fullscreen />;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/tablet" className="btn-ghost !py-1 !px-2 text-sm">{t('nav.back')}</Link>
          <div className="font-display gold-text">{t('nav.menu')}</div>
          <LanguageSwitcher />
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3"><SearchBar value={q} onChange={setQ} /></div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveCat('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border ${activeCat === 'all' ? 'bg-gold text-black border-gold' : 'border-white/10 text-white/70 hover:text-white'}`}>
            {t('admin.categories')}
          </button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border ${activeCat === c.id ? 'bg-gold text-black border-gold' : 'border-white/10 text-white/70 hover:text-white'}`}>
              {getLocalizedField(c, 'name', lang)}
            </button>
          ))}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((p) => <ProductCard key={p.id} product={p} basePath="/product" />)}
          {filtered.length === 0 && <div className="col-span-full text-center text-white/50 py-10">{t('common.empty')}</div>}
        </div>
      </main>
    </div>
  );
}
