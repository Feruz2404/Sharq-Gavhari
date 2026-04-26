import { useEffect, useState } from 'react';
import DataTable from '../../components/admin/DataTable.jsx';
import ProductForm from '../../components/admin/ProductForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import ToggleSwitch from '../../components/admin/ToggleSwitch.jsx';
import { productService } from '../../services/productService.js';
import { categoryService } from '../../services/categoryService.js';
import { useT } from '../../locales/useT.js';
import { formatPrice } from '../../utils/formatPrice.js';

export default function AdminProducts() {
  const t = useT();
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = () => Promise.all([productService.list(), categoryService.list()]).then(([p, c]) => { setList(p); setCats(c); });
  useEffect(() => { reload(); }, []);

  const onSave = async (data) => {
    setBusy(true);
    try {
      if (editing) await productService.update(editing.id, data);
      else         await productService.create(data);
      setEditing(null); setCreating(false);
      await reload();
    } finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!confirmDel) return;
    await productService.remove(confirmDel.id);
    setConfirmDel(null);
    reload();
  };

  const cols = [
    { key: 'image', label: '', render: (r) => <ImageWithFallback src={r.image_url} className="w-10 h-10 rounded-md object-cover" /> },
    { key: 'name_uz', label: 'Name (UZ)' },
    { key: 'category', label: t('admin.categories'), render: (r) => cats.find((c) => c.id === r.category_id)?.name_uz || '—' },
    { key: 'price', label: t('admin.price'), render: (r) => formatPrice(r.discount_price ?? r.price) },
    { key: 'is_available', label: t('admin.isAvailable'), render: (r) => (
      <ToggleSwitch checked={r.is_available} onChange={async (v) => { await productService.setAvailability(r.id, v); reload(); }} />
    ) },
    { key: 'is_active', label: t('admin.isActive'), render: (r) => (
      <ToggleSwitch checked={r.is_active} onChange={async (v) => { await productService.setActive(r.id, v); reload(); }} />
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => { setEditing(r); setCreating(false); }} className="btn-ghost !py-1 !px-2 text-xs">{t('common.edit')}</button>
        <button onClick={() => setConfirmDel(r)} className="btn-ghost !py-1 !px-2 text-xs !text-red-400">{t('common.delete')}</button>
      </div>
    ) },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl gold-text">{t('admin.products')}</h1>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-gold">+ {t('common.add')}</button>
      </div>
      {(creating || editing) && (
        <ProductForm
          initial={editing || {}}
          categories={cats}
          submitting={busy}
          onSubmit={onSave}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}
      <DataTable columns={cols} rows={list} empty={t('common.empty')} />
      <ConfirmDialog open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={onDelete} title="Delete product?" />
    </div>
  );
}
