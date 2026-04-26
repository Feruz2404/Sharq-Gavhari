import { useEffect, useState } from 'react';
import GlassCard from '../../components/common/GlassCard.jsx';
import { categoryService } from '../../services/categoryService.js';
import { productService } from '../../services/productService.js';
import { tableService } from '../../services/tableService.js';
import { useT } from '../../locales/useT.js';

export default function AdminDashboard() {
  const t = useT();
  const [stats, setStats] = useState({ categories: 0, products: 0, available: 0, tables: 0 });

  useEffect(() => {
    (async () => {
      const [c, p, ta] = await Promise.all([categoryService.list(), productService.list(), tableService.list()]);
      setStats({
        categories: c.length,
        products: p.length,
        available: p.filter((x) => x.is_available).length,
        tables: ta.length,
      });
    })();
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
        <Card label={t('admin.categories')} value={stats.categories} />
        <Card label={t('admin.products')}   value={stats.products} />
        <Card label={t('admin.isAvailable')} value={stats.available} />
        <Card label={t('admin.tables')}     value={stats.tables} />
      </div>
    </div>
  );
}
