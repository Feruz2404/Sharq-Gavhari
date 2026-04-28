import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CustomerHeader from '../../components/common/CustomerHeader.jsx';
import ProductCard from '../../components/menu/ProductCard.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
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
        setProducts(list.filter((x) => x.is_active !== false));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <LoadingLogo fullscreen />;

  const name = category ? getLocalizedField(category, 'name', lang) : '';

  return (
    <div className="min-h-screen pb-32">
      <CustomerHeader variant="subpage" backTo="/menu" title={name} />
      <main className="max-w-6xl mx-auto px-4 py-5 grid gap-5">
        {category && (
          <section className="glass overflow-hidden relative">
            <div className="relative aspect-[16/6] md:aspect-[16/5]">
              <ImageWithFallback src={category.image_url} alt={name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                <h1 className="font-display text-2xl md:text-4xl gold-text">{name}</h1>
                <div className="mt-2 h-px w-12 bg-gold/70" />
              </div>
            </div>
          </section>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <EmptyState
            title={t('common.empty')}
            description={t('menu.noProductsInCategory')}
            icon="image"
          />
        )}
      </main>
    </div>
  );
}
