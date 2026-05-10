import { useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../components/admin/DataTable.jsx';
import ProductForm from '../../components/admin/ProductForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import ToggleSwitch from '../../components/admin/ToggleSwitch.jsx';
import { productService } from '../../services/productService.js';
import { categoryService } from '../../services/categoryService.js';
import { useT } from '../../locales/useT.js';
import { formatPrice } from '../../utils/formatPrice.js';

// Shared lighter-glass styles so the search input and the dropdown trigger
// stay visually integrated with the rest of the Sharq Gavhari admin shell.
const GLASS_FIELD =
  'h-11 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl ' +
  'text-sm text-white shadow-lg shadow-black/15 ' +
  'focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition';

// Custom dark-glass dropdown for the category filter. Replaces the native
// <select> (whose popup is an opaque OS-level overlay that breaks the
// dark/gold theme). Closes on outside click and on Escape.
function CategoryDropdown({ value, onChange, categories, allLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = categories.find((c) => c.id === value) || null;
  const buttonText = selected ? selected.name_uz : allLabel;

  return (
    <div ref={ref} className="relative w-full sm:w-56 sm:shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={
          GLASS_FIELD + ' w-full flex items-center justify-between gap-2 px-4 ' +
          (open ? 'border-gold/50 ring-1 ring-gold/25' : '')
        }
      >
        <span className={'truncate ' + (selected ? 'text-white' : 'text-white/65')}>
          {buttonText}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={'shrink-0 text-white/55 transition-transform ' + (open ? 'rotate-180' : '')}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className={
            'absolute z-50 left-0 right-0 mt-2 ' +
            'max-h-[260px] overflow-auto ' +
            'rounded-2xl border border-white/10 bg-[#1b120c]/45 backdrop-blur-2xl ' +
            'shadow-2xl shadow-black/25 ring-1 ring-white/5 py-1.5'
          }
        >
          <DropdownOption
            selected={!value}
            onClick={() => { onChange(''); setOpen(false); }}
            label={allLabel}
          />
          {categories.length > 0 && (
            <li aria-hidden="true" className="my-1 h-px bg-white/5 mx-3" />
          )}
          {categories.map((c) => (
            <DropdownOption
              key={c.id}
              selected={value === c.id}
              onClick={() => { onChange(c.id); setOpen(false); }}
              label={c.name_uz}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DropdownOption({ selected, onClick, label }) {
  // border-l-2 with a transparent default + gold-on-selected keeps text
  // alignment perfectly consistent across rows.
  return (
    <li
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className={
        'px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-2 ' +
        'border-l-2 transition ' +
        (selected
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-transparent text-white/80 hover:bg-white/10 hover:text-white')
      }
    >
      <span className="truncate">{label}</span>
      {selected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      )}
    </li>
  );
}

export default function AdminProducts() {
  const t = useT();
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);

  // Search + filter state (local to this page).
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const reload = () =>
    Promise.all([productService.list(), categoryService.list()]).then(([p, c]) => {
      setList(p);
      setCats(c);
    });
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

  // Quick lookup: category id -> human-readable name (across all locales),
  // so the search matches on whichever language the admin typed.
  const catNameById = useMemo(() => {
    const map = new Map();
    for (const c of cats) {
      const parts = [c.name_uz, c.name_ru, c.name_en].filter(Boolean).join(' ');
      map.set(c.id, parts.toLowerCase());
    }
    return map;
  }, [cats]);

  // Filtered products: category filter + case-insensitive substring search
  // across name_uz / name_ru / name_en / slug / category name.
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return list.filter((p) => {
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        p.name_uz,
        p.name_ru,
        p.name_en,
        p.slug,
        catNameById.get(p.category_id) || '',
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [list, searchQuery, categoryFilter, catNameById]);

  const isFiltering = searchQuery.trim().length > 0 || Boolean(categoryFilter);
  const emptyMessage =
    isFiltering && list.length > 0 ? 'Mahsulot topilmadi' : t('common.empty');

  const cols = [
    {
      key: 'image',
      label: '',
      // Admin row preview prefers the optimized thumbnail (new pipeline)
      // and falls back to the legacy thumbnail_url column.
      render: (r) => (
        <ImageWithFallback
          src={r.image_url}
          thumbnailUrl={r.image_thumb_url || r.thumbnail_url}
          className="w-10 h-10 rounded-md object-cover"
        />
      ),
    },
    { key: 'name_uz', label: 'Name (UZ)' },
    { key: 'category', label: t('admin.categories'), render: (r) => cats.find((c) => c.id === r.category_id)?.name_uz || '\u2014' },
    { key: 'price', label: t('admin.price'), render: (r) => formatPrice(r.discount_price ?? r.price) },
    { key: 'is_available', label: t('admin.isAvailable'), render: (r) => (
      <ToggleSwitch checked={r.is_available} onChange={async (v) => { await productService.setAvailability(r.id, v); reload(); }} />
    ) },
    { key: 'is_active', label: t('admin.isActive'), render: (r) => (
      <ToggleSwitch checked={r.is_active} onChange={async (v) => { await productService.setActive(r.id, v); reload(); }} />
    ) },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-2 justify-end whitespace-nowrap">
        <button onClick={() => { setEditing(r); setCreating(false); }} className="btn-ghost !py-1 !px-2 text-xs">{t('common.edit')}</button>
        <button onClick={() => setConfirmDel(r)} className="btn-ghost !py-1 !px-2 text-xs !text-red-400">{t('common.delete')}</button>
      </div>
    ) },
  ];

  return (
    <div className="grid gap-4 min-w-0">
      {/* Header row: title + count on the left, "+ Qo'shish" on the right.
          min-w-0 on the cluster so it can shrink instead of pushing the
          button outside; shrink-0 on the button so it never gets clipped. */}
      <div className="flex items-center justify-between flex-wrap gap-2 min-w-0">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="font-display text-2xl gold-text truncate">{t('admin.products')}</h1>
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

      {/* Search + category filter row. relative + z-20 so the dropdown menu
          floats above the products table without clipping. min-w-0 on the
          search wrapper so it can shrink inside the flex parent. */}
      <div className="relative z-20 flex flex-col sm:flex-row gap-2.5 min-w-0">
        <div className="relative flex-1 min-w-0">
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
            placeholder="Mahsulotlarni qidirish..."
            aria-label="Mahsulotlarni qidirish"
            className={GLASS_FIELD + ' w-full pl-10 pr-10 placeholder-white/40'}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Tozalash"
              className="absolute inset-y-0 right-2 flex items-center justify-center w-8 text-white/55 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          )}
        </div>

        <CategoryDropdown
          value={categoryFilter}
          onChange={setCategoryFilter}
          categories={cats}
          allLabel="Barcha kategoriyalar"
        />
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

      {/* relative z-0 keeps the table beneath the dropdown menu when open.
          min-w-0 lets the DataTable wrapper enable its horizontal scroll on
          narrow viewports instead of overflowing the page. */}
      <div className="relative z-0 min-w-0">
        <DataTable columns={cols} rows={filteredList} empty={emptyMessage} />
      </div>

      <ConfirmDialog open={!!confirmDel} onCancel={() => setConfirmDel(null)} onConfirm={onDelete} title="Delete product?" />
    </div>
  );
}
