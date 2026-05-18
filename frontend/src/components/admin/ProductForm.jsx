import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ImageUploader from '../../features/media/ImageUploader.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import Select from './Select.jsx';
import { useT } from '../../locales/useT.js';
import { useLanguageStore } from '../../stores/languageStore.js';

// Localized helper text shown under the upload dropzone. Keeps wording in
// sync across UZ/RU/EN and explains the auto-thumbnail pipeline so admins
// know it is safe to upload high-quality originals (up to 50 MB).
const UPLOAD_HINT = {
  uz: 'Yuqori sifatli rasm yuklash mumkin (50MB gacha). Tizim menyu kartalari uchun kichik WebP versiyani avtomatik tayyorlaydi.',
  ru: '\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430 (\u0434\u043E 50MB). \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u043D\u0443\u044E WebP-\u0432\u0435\u0440\u0441\u0438\u044E \u0434\u043B\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u043C\u0435\u043D\u044E.',
  en: 'High-quality images up to 50 MB are supported. The system automatically generates a smaller WebP for menu cards.',
};

export default function ProductForm({ initial = {}, categories = [], onSubmit, onCancel, submitting }) {
  const t = useT();
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
    is_available: true, is_active: true,
    ...initial,
  });
  const [touched, setTouched] = useState(false);

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e && e.target ? e.target.value : e }));

  // Legacy ImageUpload (used while the row is still being CREATED \u2014 the
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
  // instead of spreading the full form state. This is the fix for the
  // "Saqlash doesn't save" bug: previously `{ ...f }` carried server-managed
  // (id / updated_at) and media-pipeline columns (image_thumb_url,
  // image_original_url, image_object_path) into the PUT/POST body, which
  // made Supabase reject the request with a schema-cache error and the
  // frontend silently swallowed it. Keep this list in sync with the
  // PRODUCT_WRITABLE set in backend/src/controllers/products.controller.js.
  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!f.category_id) return;

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
      payload.sort_order = Number(f.sort_order);
    }
    onSubmit(payload);
  };

  const isEditing = Boolean(f.id);

  // Hoisted to a local const so the JSX uses single-brace {imageUploaderValue}.
  // Inline  ...  object literals must be avoided in this codebase.
  const imageUploaderValue = {
    image_url: f.image_url,
    image_thumb_url: f.image_thumb_url,
    image_original_url: f.image_original_url,
    image_object_path: f.image_object_path,
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Basic info</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">{t('admin.categories')} *</label>
            {noCategories ? (
              <div className="input !bg-red-500/5 !border-red-500/30 text-red-300 text-sm flex items-center">
                Avval kategoriya yarating
              </div>
            ) : (
              <Select
                value={f.category_id || ''}
                onChange={(v) => set('category_id')(v)}
                options={categoryOptions}
                placeholder="\u2014"
                invalid={categoryInvalid}
              />
            )}
            {categoryInvalid && (
              <div className="mt-1 text-[11px] text-red-400">
                Kategoriya tanlanishi shart
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
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Names</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
          <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
          <div><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Description</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">UZ</label><textarea className="input" rows={3} value={f.description_uz || ''} onChange={set('description_uz')} /></div>
          <div><label className="label">RU</label><textarea className="input" rows={3} value={f.description_ru || ''} onChange={set('description_ru')} /></div>
          <div><label className="label">EN</label><textarea className="input" rows={3} value={f.description_en || ''} onChange={set('description_en')} /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ingredients</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">UZ</label><textarea className="input" rows={2} value={f.ingredients_uz || ''} onChange={set('ingredients_uz')} /></div>
          <div><label className="label">RU</label><textarea className="input" rows={2} value={f.ingredients_ru || ''} onChange={set('ingredients_ru')} /></div>
          <div><label className="label">EN</label><textarea className="input" rows={2} value={f.ingredients_en || ''} onChange={set('ingredients_en')} /></div>
        </div>
      </section>

      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pricing & details</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div><label className="label">{t('admin.price')}</label><input type="number" step="0.01" className="input" value={f.price} onChange={set('price')} required /></div>
          <div><label className="label">{t('admin.discountPrice')}</label><input type="number" step="0.01" className="input" value={f.discount_price == null ? '' : f.discount_price} onChange={set('discount_price')} /></div>
          <div><label className="label">{t('admin.weight')}</label><input className="input" value={f.weight || ''} onChange={set('weight')} /></div>
          <div><label className="label">{t('admin.prepTime')}</label><input className="input" value={f.preparation_time || ''} onChange={set('preparation_time')} /></div>
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
            {submitting ? '\u2026' : t('common.save')}
          </button>
        </div>
      </section>
    </form>
  );
}
