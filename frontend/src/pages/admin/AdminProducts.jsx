import { useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../components/admin/DataTable.jsx';
import ProductForm from '../../components/admin/ProductForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ImageWithFallback from '../../components/common/ImageWithFallback.jsx';
import ToggleSwitch from '../../components/admin/ToggleSwitch.jsx';
import { useToast } from '../../components/common/Toast.jsx';
import { productService } from '../../services/productService.js';
import { categoryService } from '../../services/categoryService.js';
import { useT } from '../../locales/useT.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { getLocalizedField } from '../../lib/localized.js';
import { formatPrice } from '../../utils/formatPrice.js';

// Shared lighter-glass styles so the search input and the dropdown trigger
// stay visually integrated with the rest of the Sharq Gavhari admin shell.
const GLASS_FIELD =
  'h-11 rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur-2xl ' +
  'text-sm text-white shadow-lg shadow-black/15 ' +
  'focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/25 transition';

const IS_DEV = !!(import.meta && import.meta.env && import.meta.env.DEV);

// Extract a user-facing message from an axios/HTTP error. Prefers the
// backend `details` field (set by products.controller.dbError), then
// `error`, then the axios message, then a localized fallback. Logging the
// raw exception is gated to dev so the production console stays clean.
function apiErrorMessage(err, fallback) {
  const data = err && err.response && err.response.data;
  const apiMsg =
    (data && (data.details || data.error)) ||
    (err && err.message) ||
    fallback ||
    '';
  if (IS_DEV) {
    // eslint-disable-next-line no-console
    console.error('[admin/products]', fallback || 'API error', err);
  }
  return apiMsg;
}

// Custom dark-glass dropdown for the category filter. Replaces the native
// <select> (whose popup is an opaque OS-level overlay that breaks the
// dark/gold theme). Closes on outside click and on Escape. The labels it
// renders follow the active admin language via getLocalizedField.
function CategoryDropdown({ value, onChange, categories, allLabel, lang }) {
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
  const buttonText = selected
    ? (getLocalizedField(selected, 'name', lang) || '\u2014')
    : allLabel;

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
              label={getLocalizedField(c, 'name', lang) || '\u2014'}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function DropdownOption({ selected, onClick, label }) {
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
  const lang = useLanguageStore((s) => s.language);
  const toast = useToast();
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

  // onSave now ALWAYS surfaces the outcome to the admin via a localized
  // toast AND does an optimistic local state splice from the API response.
  const onSave = async (data) => {
    const wasEditing = Boolean(editing);
    const editingId = editing && editing.id;
    if (IS_DEV) {
      // eslint-disable-next-line no-console
      console.log('[admin/products] save', {
        mode: wasEditing ? 'PUT' : 'POST',
        id: editingId,
        category_id: data && data.category_id,
        payload: data,
      });
    }
    setBusy(true);
    try {
      const saved = wasEditing
        ? await productService.update(editingId, data)
        : await productService.create(data);

      if (saved && saved.id) {
        setList((prev) => {
          if (wasEditing) {
            return prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p));
          }
          return [saved, ...prev];
        });
      }

      setEditing(null); setCreating(false);
      reload().catch(() => { /* non-blocking */ });
      toast.success(
        wasEditing ? t('admin.productsPage.saveSuccess') : t('admin.productsPage.addSuccess')
      );
    } catch (err) {
      const msg = apiErrorMessage(err, t('admin.productsPage.saveError'));
      toast.error(t('admin.productsPage.saveError') + ': ' + msg);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirmDel) return;
    const removedId = confirmDel.id;
    try {
      await productService.remove(removedId);
      setConfirmDel(null);
      setList((prev) => prev.filter((p) => p.id !== removedId));
      reload().catch(() => { /* non-blocking */ });
      toast.success(t('admin.productsPage.deleteSuccess'));
    } catch (err) {
      const msg = apiErrorMessage(err, t('admin.productsPage.deleteError'));
      toast.error(msg);
    }
  };

  // Quick lookup: category id -> the localized name in the active admin
  // language. We use this for both the product table cell AND the search
  // hay so an admin searching in Russian matches Russian category names.
  const localizedCategoryNameById = useMemo(() => {
    const map = new Map();
    for (const c of cats) {
      map.set(c.id, getLocalizedField(c, 'name', lang));
    }
    return map;
  }, [cats, lang]);

  // Filtered products: category filter + case-insensitive substring search
  // across the localized name / description / ingredients / category name /
  // slug fields. Slug stays language-agnostic.
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return list.filter((p) => {
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        getLocalizedField(p, 'name', lang),
        getLocalizedField(p, 'description', lang),
        getLocalizedField(p, 'ingredients', lang),
        localizedCategoryNameById.get(p.category_id) || '',
        p.slug,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [list, searchQuery, categoryFilter, localizedCategoryNameById, lang]);

  const isFiltering = searchQuery.trim().length > 0 || Boolean(categoryFilter);
  const emptyMessage =
    isFiltering && list.length > 0 ? t('admin.productsPage.emptyFiltered') : t('common.empty');

  // Inline toggle handlers (availability + active).
  const handleToggleAvailable = async (row, v) => {
    try {
      const saved = await productService.setAvailability(row.id, v);
      if (saved && saved.id) {
        setList((prev) => prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)));
      }
      reload().catch(() => { /* non-blocking */ });
    } catch (err) {
      const msg = apiErrorMessage(err, t('admin.productsPage.toggleError'));
      toast.error(msg);
      await reload();
    }
  };

  const handleToggleActive = async (row, v) => {
    try {
      const saved = await productService.setActive(row.id, v);
      if (saved && saved.id) {
        setList((prev) => prev.map((p) => (p.