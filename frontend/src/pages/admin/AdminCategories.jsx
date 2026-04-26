import { useEffect, useState } from 'react';
import DataTable from '../../components/admin/DataTable.jsx';
import CategoryForm from '../../components/admin/CategoryForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import { categoryService } from '../../services/categoryService.js';
import { useT } from '../../locales/useT.js';

export default function AdminCategories() {
  const t = useT();
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = () => categoryService.list().then(setList);
  useEffect(() => { reload(); }, []);

  const onSave = async (data) => {
    setBusy(true);
    try {
      if (editing) await categoryService.update(editing.id, data);
      else         await categoryService.create(data);
      setEditing(null); setCreating(false);
      await reload();
    } finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!confirmDel) return;
    await categoryService.remove(confirmDel.id);
    setConfirmDel(null);
    reload();
  };

  const cols = [
    { key: 'image', label: '', render: (r) => <ImageWithFallback src={r.image_url} className="w-10 h-10 rounded-md object-cover" /> },
    { key: 'name_uz', label: 'Name (UZ)' },
    { key: 'name_ru', label: 'Name (RU)' },
    { key: 'slug', label: 'Slug' },
    { key: 'sort_order', label: t('admin.sortOrder') },
    { key: 'is_active', label: t('admin.isActive'), render: (r) => r.is_active ? '✓' : '—' },
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
        <h1 className="font-display text-2xl gold-text">{t('admin.categories')}</h1>
        <button onClick={() => { setCreating(true); setEditing(null); }} className="btn-gold">+ {t('common.add')}</button>
      </div>
      {(creating || editing) && (
        <CategoryForm
          initial={editing || {}}
          submitting={busy}
          onSubmit={onSave}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}
      <DataTable columns={cols} rows={list} empty={t('common.empty')} />
      <ConfirmDialog open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={onDelete} title={`Delete category?`} />
    </div>
  );
}
