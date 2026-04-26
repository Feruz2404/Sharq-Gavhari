import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../../components/menu/ProductCard.jsx';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import LoadingLogo from '../../components/common/LoadingLogo.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

export default function CategoryPage() {
  const { slug } = useParams();
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cat = await categoryService.get(slug);
        if (cancelled) return;
        setCategory(cat);
        const list = await productService.byCategory(cat.id);
        if (cancelled) return;
        setProducts(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingLogo fullscreen />;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/30 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/menu" className="btn-ghost !py-1 !px-2 text-sm">{t('nav.back')}</Link>
          <div className="font-display gold-text truncate">{category ? getLocalizedField(category, 'name', lang) : ''}</div>
          <LanguageSwitcher />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
          {products.length === 0 && <div className="col-span-full text-center text-white/50 py-10">{t('common.empty')}</div>}
        </div>
      </main>
    </div>
  );
}
