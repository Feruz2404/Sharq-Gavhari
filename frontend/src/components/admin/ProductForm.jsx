import { useEffect, useRef, useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ImageUploader from '../../features/media/ImageUploader.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import Select from './Select.jsx';
import { useT } from '../../locales/useT.js';
import { useToast } from '../common/Toast.jsx';
import { useLanguageStore } from '../../stores/languageStore.js';

// Localized helper text shown under the upload dropzone. Keeps wording in
// sync across UZ/RU/EN and explains the auto-thumbnail pipeline so admins
// know it is safe to upload high-quality originals (up to 50 MB).
const UPLOAD_HINT = {
  uz: 'Yuqori sifatli rasm yuklash mumkin (50MB gacha). Tizim menyu kartalari uchun kichik WebP versiyani avtomatik tayyorlaydi.',
  ru: '\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430 (\u0434\u043E 50MB). \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u043D\u0443\u044E WebP-\u0432\u0435\u0440\u0441\u0438\u044E \u0434\u043B\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u043C\u0435\u043D\u044E.',
  en: 'High-quality images up to 50 MB are supported. The system automatically generates a smaller WebP for menu cards.',
};

const IS_DEV = !!(import.meta && import.meta.env && import.meta.env.DEV);

export default function ProductForm({
  initial = {},
  categories = [],
  onSubmit,
  onCancel,
  submitting,
  getNextSortOrder, // (categoryId) => number; supplied by AdminProducts
}) {
  const t = useT();
  const toast = useToast();
  const lang = useLanguageStore((s) => s.language);
  const [f, setF] = useState({
    category_id: '',
    name_uz: '', name_ru: '', name_en: '',
    description_uz: '', description_ru: '', description_en: '',
    ingredients_uz: '', ingredients_ru: '', ingredients_en: '',
    image_url: '', thumbnail_url: '',
    image_thumb_url: '', image_original_url: '', image_object_path: '',
    price: 0, discount_price: null, secondary_price: null,
    weight: '', preparation_time: '',
    sort_order: '',
    is_available: true, is_active: true,
    ...initial,
  });
  const [touched, setTouched] = useState(false);

  // Whether the admin has manually typed into the sort_order field. Once
  // true, the auto-default-on-category-change effect stops touching the
  // value so the admin's number is never silently overwritten.
  const manuallyEditedSortOrderRef = useRef(
    !!(initial && initial.sort_order != null && initial.sort_order !== '')
  );

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e && e.target ? e.target.value : e }));

  // Dedicated handler for sort_order so we can record that the admin
  // typed into it (suppresses further auto-defaulting).
  const setSortOrder = (e) => {
    manuallyEditedSortOrderRef.current = true;
    setF((prev) => ({ ...prev, sort_order: e.target.value }));
  };

  const isEditing = Boolean(f.id);

  // Auto-suggest next-in-category sort_order while CREATING a new product.
  //   - On first render with an initially-selected category and no
  //     sort_order, populate the suggestion.
  //   - When the admin changes category (still creating, still hasn't
  //     typed a custom value), re-suggest.
  //   - For EDIT mode we never auto-overwrite; the admin's existing value
  //     is preserved verbatim.
  useEffect(() => {
    if (isEditing) return undefined;
    if (manuallyEditedSortOrderRef.current) return undefined;
    if (!f.category_id) return undefined;
    if (typeof getNextSortOrder !== 'function') return undefined;
    const next = getNextSortOrder(f.category_id);
    if (typeof next !== 'number' || !Number.isFinite(next)) return undefined;
    setF((prev) => ({ ...prev, sort_order: next }));
    return undefined;
  }, [f.category_id, isEditing, getNextSortOrder]);

  // Legacy ImageUpload (used while the row is still being CREATED — the
  // new /api/media pipeline keys files by entity id, which doesn't exist
  // yet). Persists the legacy { image_url, thumbnail_url } shape.
  const handleLegacyUpload = (res) => {
    setF((prev) => ({
      ...prev,
      image_url: res.image_url || res.url || '',
      thumbnail_url:
        res.thumbnail_url || res.image_url || res.url || '',
    }));
  };

  // New ImageUploader (used while EDITING an existing product). Merges all
  // four pipeline fields into form state and mirrors legacy thumbnail_url
  // so existing menu rendering continues to work without a redeploy.
  const handleNewUpload = (res) => {
    setF((prev) => ({
      ...prev,
      image_url: res.image_url || prev.image_url || '',
      image_thumb_url: res.image_thumb_url || prev.image_thumb_url || '',
      image_original_url: res.image_original_url || prev.image_original_url || '',
      image_object_path: res.image_object_path || prev.image_object_path || '',
      thumbnail_url:
        res.image_thumb_url || res.image_url || prev.thumbnail_url || '',
    }));
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name_uz || c.name_en || c.slug || '\u2014',
    sublabel: c.slug || '',
    image_url: c.image_url,
  }));
  const noCategories = categories.length === 0;
  const categoryInvalid = touched && !f.category_id;

  // Coerce a form value to a numeric column value or null for nullable
  // numeric columns (discount_price, secondary_price).
  const numOrNull = (v) =>
    v === '' || v == null ? null : Number(v);

  // Build the submit payload from an EXPLICIT whitelist of product columns
  // instead of spreading the full form state. This avoids carrying
  // server-managed (id / updated_at) and media-pipeline columns into the
  // PUT/POST body — Supabase would otherwise reject the whole request
  // with a schema-cache error and the previous silent catch made it look
  // like Save had no effect.
  const submit = (e) => {
    e.preventDefault();
    setTouched(true);

    // Explicit, NON-silent category guard.
    if (!f.category_id) {
      toast.error(t('admin.productForm.categoryRequired'));
      return;
    }

    const payload = {
      category_id: f.category_id,
      name_uz: f.name_uz || '',
      name_ru: f.name_ru || '',
      name_en: f.name_en || '',
      description_uz: f.description_uz || '',
      description_ru: f.description_ru || '',
      description_en: f.description_en || '',
      ingredients_uz: f.ingredients_uz || '',
      ingredients_ru: f.ingredients_ru || '',
      ingredients_en: f.ingredients_en || '',
      price: Number(f.price || 0),
      discount_price: numOrNull(f.discount_price),
      secondary_price: numOrNull(f.secondary_price),
      image_url: f.image_url || '',
      thumbnail_url:
        f.thumbnail_url || f.image_thumb_url || f.image_url || '',
      weight: f.weight || '',
      preparation_time: f.preparation_time || '',
      is_available: !!f.is_available,
      is_active: !!f.is_active,
    };
    if (f.sort_order != null && f.sort_order !== '') {
      const n = parseInt(f.sort_order, 10);
      if (Number.isFinite(n) && n >= 0) payload.sort_order = n;
    }

    if (IS_DEV) {
      // eslint-disable-next-line no-console
      console.log('[ProductForm] submit', {
        editing_id: f.id,
        category_id: payload.category_id,
        payload,
      });
    }

    onSubmit(payload);
  };

  // Hoisted to a local const so the JSX uses single-brace {imageUploaderValue}.
  const imageUploaderValue = {
    image_url: f.image_url,
    image_thumb_url: f.image_thumb_url,
    image_original_url: f.image_original_url,
    image_object_path: f.image_object_path,
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t('admin.productForm.sectionBasic')}</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('admin.categories')} *</label>
            {noCategories ? (
              <div className="input !bg-red-500/5 !border-red-500/30 text-red-300 text-sm flex items-center">
                {t('admin.productForm.createCategoryFirst')}
              </div>
            ) : (
              <Select
                value={f.category_id || ''}
                onChange={(v) => set('category_id')(v)}
                options={categoryOptions}
                placeholder={t('admin.productForm.selectPlaceholder')}
                invalid={categoryInvalid}
              />
            )}
            {categoryInvalid && (
              <div className="mt-1 text-[11px] text-red-400">
                {t('admin.productForm.categoryRequired')}
              </div>
            )}
          </div>
          <div>
            <label className="label">{t('admin.image')}</label>
            {isEditing ? (
              <ImageUploader
                entityType="product"
                entityId={f.id}
                value={imageUploaderValue}
                onChange={handleNewUpload}
                helperText={UPLOAD_HINT[lang] || UPLOAD_HINT.en}
              />
            ) : (
              <ImageUpload
                value={f.image_url}
                thumbnailUrl={f.thumbnail_url}
                onChange={(v) => set('image_url')(v)}
                onUpload={handleLegacyUpload}
                bucket="product-images"
                label=""
                helperText={UPLOAD_HINT[lang] || UPLOAD_HINT.en}
              />
            )}
          </div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t('admin.productForm.sectionNames')}</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">{t('admin.productForm.nameUz')}</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
          <div><label className="label">{t('admin.productForm.nameRu')}</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
          <div><label className="label">{t('admin.productForm.nameEn')}</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t('admin.productForm.sectionDescription')}</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">{t('admin.productForm.descriptionUz')}</label><textarea className="input" rows={3} value={f.description_uz || ''} onChange={set('description_uz')} /></div>
          <div><label className="label">{t('admin.productForm.descriptionRu')}</label><textarea className="input" rows={3} value={f.description_ru || ''} onChange={set('description_ru')} /></div>
          <div><label className="label">{t('admin.productForm.descriptionEn')}</label><textarea className="input" rows={3} value={f.description_en || ''} onChange={set('description_en')} /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t('admin.productForm.sectionIngredients')}</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">{t('admin.productForm.ingredientsUz')}</label><textarea className="input" rows={2} value={f.ingredients_uz || ''} onChange={set('ingredients_uz')} /></div>
          <div><label className="label">{t('admin.productForm.ingredientsRu')}</label><textarea className="input" rows={2} value={f.ingredients_ru || ''} onChange={set('ingredients_ru')} /></div>
          <div><label className="label">{t('admin.productForm.ingredientsEn')}</label><textarea className="input" rows={2} value={f.ingredients_en || ''} onChange={set('ingredients_en')} /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{t('admin.productForm.sectionPricing')}</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div><label className="label">{t('admin.price')}</label><input type="number" step="0.01" className="input" value={f.price} onChange={set('price')} required /></div>
          <div><label className="label">{t('admin.discountPrice')}</label><input type="number" step="0.01" className="input" value={f.discount_price == null ? '' : f.discount_price} onChange={set('discount_price')} /></div>
          <div><label className="label">{t('admin.weight')}</label><input className="input" value={f.weight || ''} onChange={set('weight')} /></div>
          <div><label className="label">{t('admin.prepTime')}</label><input className="input" value={f.preparation_time || ''} onChange={set('preparation_time')} /></div>
        </div>
        {/* Order number (sort_order) — own row so it doesn't crowd the
            4-up pricing grid on tablet widths. */}
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="label">{t('admin.productForm.orderNumber')}</label>
            <input
              type="number"
              min={0}
              step={1}
              className="input"
              value={f.sort_order == null ? '' : f.sort_order}
              onChange={setSortOrder}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <ToggleSwitch label={t('admin.isAvailable')} checked={f.is_available} onChange={(v) => set('is_available')(v)} />
          <ToggleSwitch label={t('admin.isActive')}    checked={f.is_active}    onChange={(v) => set('is_active')(v)} />
        </div>
        <div className="flex gap-2 ml-auto">
          <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
          <button type="submit" disabled={submitting || noCategories} className="btn-gold">
            {submitting ? '\u2026' : t('admin.productForm.saveProduct')}
          </button>
        </div>
      </section>
    </form>
  );
}
