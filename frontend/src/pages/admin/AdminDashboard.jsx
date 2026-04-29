import { useEffect, useState } from 'react';
import GlassCard from '../../components/common/GlassCard.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { useT } from '../../locales/useT.js';

// Tables/Stollar stat removed: feature is no longer surfaced in admin UI.

export default function AdminDashboard() {
  const t = useT();
  const [stats, setStats] = useState({
    categories: 0,
    products: 0,
    available: 0,
    unavailable: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, p] = await Promise.all([categoryService.list(), productService.list()]);
        if (cancelled) return;
        const products = p || [];
        setStats({
          categories: (c || []).length,
          products: products.length,
          available: products.filter((x) => x.is_available).length,
          unavailable: products.filter((x) => !x.is_available).length,
        });
      } catch (_) {
        /* keep zeros on failure so the dashboard still renders */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const Card = ({ label, value }) => (
    <GlassCard className="text-center">
      <div className="text-3xl font-display gold-text">{value}</div>
      <div className="text-white/60 text-xs uppercase tracking-wider mt-1">{label}</div>
    </GlassCard>
  );

  return (
    <div className="grid gap-4">
      <h1 className="font-display text-2xl gold-text">{t('admin.dashboard')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label={t('admin.categories')}  value={stats.categories} />
        <Card label={t('admin.products')}    value={stats.products} />
        <Card label={t('admin.isAvailable')} value={stats.available} />
        <Card label={t('common.unavailable')} value={stats.unavailable} />
      </div>
    </div>
  );
}
