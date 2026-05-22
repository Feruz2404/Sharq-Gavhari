import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../components/admin/DataTable.jsx';
import CategoryForm from '../../components/admin/CategoryForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import { categoryService } from '../../services/categoryService.js';
import { useT } from '../../locales/useT.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { getLocalizedField } from '../../lib/localized.js';

// Match AdminProducts glass style so the categories search bar feels native
// to the rest of the admin shell.
const GLASS_FIELD =
  'h-11 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl ' +
  'text-sm text-white shadow-lg shadow-black/15 ' +
  'focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition';

export default function AdminCategories() {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter by the localized name in the currently selected language, with
  // slug as an additional language-agnostic match. The helper falls back
  // through uz/ru/en so partially-translated rows still match.
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const localizedName = getLocalizedField(c, 'name', lang);
      const hay = [localizedName, c.slug].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [list, searchQuery, lang]);

  const isFiltering = searchQuery.trim().length > 0;
  const emptyMessage =
    isFiltering && list.length > 0
      ? t('admin.categoriesPage.emptyFiltered')
      : t('common.empty');

  // ONE localized name column — no more separate UZ/RU columns. The edit
  // modal (CategoryForm) still keeps all 3 language inputs so admins can
  // maintain every language; the list itself follows the active language.
  const cols = [
    {
      key: 'image',
      label: t('admin.categoriesPage.columns.image'),
      render: (r) => (
        <ImageWithFallback
          src={r.image_url}
          thumbnailUrl={r.image_thumb_url || r.thumbnail_url}
          className="w-10 h-10 rounded-md object-cover"
        />
      ),
    },
    {
      key: 'name',
      label: t('admin.categoriesPage.columns.name'),
      render: (r) => getLocalizedField(r, 'name', lang) || '\u2014',
    },
    { key: 'slug', label: t('admin.categoriesPage.columns.slug') },
    { key: 'sort_order', label: t('admin.categoriesPage.columns.order') },
    {
      key: 'is_active',
      label: t('admin.categoriesPage.columns.active'),
      render: (r) => r.is_active ? '\u2713' : '\u2014',
    },
    {
      key: 'actions',
      label: t('admin.categoriesPage.columns.actions'),
      render: (r) => (
        <div className="flex gap-2 justify-end whitespace-nowrap">
          <button onClick={() => { setEditing(r); setCreating(false); }} className="btn-ghost !py-1 !px-2 text-xs">{t('common.edit')}</button>
          <button onClick={() => setConfirmDel(r)} className="btn-ghost !py-1 !px-2 text-xs !text-red-400">{t('common.delete')}</button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4 min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="font-display text-2xl gold-text truncate">{t('admin.categories')}</h1>
          <span className="text-xs text-white/55 tabular-nums shrink-0">
            {isFiltering ? filteredList.length + ' / ' + list.length : list.length}
          </span>
        </div>
        <button
          onClick={() => { setCreating(true); setEditing(null); }}
          className="btn-gold shrink-0"
        >
          + {t('common.add')}
        </button>
      </div>

      {/* Search field — always searches the active language's name + slug. */}
      <div className="relative z-10 min-w-0">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <path d="m20 20-3.5-3.5"/>
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.categoriesPage.searchPlaceholder')}
          aria-label={t('admin.categoriesPage.searchPlaceholder')}
          className={GLASS_FIELD + ' w-full pl-10 pr-10 placeholder-white/40'}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label={t('admin.common.clearAria')}
            className="absolute inset-y-0 right-2 flex items-center justify-center w-8 text-white/55 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        )}
      </div>

      {(creating || editing) && (
        <CategoryForm
          initial={editing || {}}
          submitting={busy}
          onSubmit={onSave}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}
      <div className="min-w-0">
        <DataTable columns={cols} rows={filteredList} empty={emptyMessage} />
      </div>
      <ConfirmDialog
        open={!!confirmDel}
        onCancel={() => setConfirmDel(null)}
        onConfirm={onDelete}
        title={t('admin.categoriesPage.deleteConfirmTitle')}
      />
    </div>
  );
}
