import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import Select from './Select.jsx';
import { useT } from '../../locales/useT.js';

export default function ProductForm({ initial = {}, categories = [], onSubmit, onCancel, submitting }) {
  const t = useT();
  const [f, setF] = useState({
    category_id: '',
    name_uz: '', name_ru: '', name_en: '',
    description_uz: '', description_ru: '', description_en: '',
    ingredients_uz: '', ingredients_ru: '', ingredients_en: '',
    image_url: '', price: 0, discount_price: null,
    weight: '', preparation_time: '',
    is_available: true, is_active: true,
    ...initial,
  });
  const [touched, setTouched] = useState(false);

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e && e.target ? e.target.value : e }));

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name_uz || c.name_en || c.slug || '\u2014',
    sublabel: c.slug || '',
    image_url: c.image_url,
  }));
  const noCategories = categories.length === 0;
  const categoryInvalid = touched && !f.category_id;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!f.category_id) return;
    onSubmit({
      ...f,
      price: Number(f.price || 0),
      discount_price:
        f.discount_price === '' || f.discount_price == null
          ? null
          : Number(f.discount_price),
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      {/* Basic info */}
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
            <ImageUpload
              value={f.image_url}
              onChange={(v) => set('image_url')(v)}
              bucket="product-images"
              label=""
            />
          </div>
        </div>
      </section>

      {/* Names */}
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Names</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
          <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
          <div><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
        </div>
      </section>

      {/* Descriptions */}
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Description</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">UZ</label><textarea className="input" rows={3} value={f.description_uz || ''} onChange={set('description_uz')} /></div>
          <div><label className="label">RU</label><textarea className="input" rows={3} value={f.description_ru || ''} onChange={set('description_ru')} /></div>
          <div><label className="label">EN</label><textarea className="input" rows={3} value={f.description_en || ''} onChange={set('description_en')} /></div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ingredients</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="label">UZ</label><textarea className="input" rows={2} value={f.ingredients_uz || ''} onChange={set('ingredients_uz')} /></div>
          <div><label className="label">RU</label><textarea className="input" rows={2} value={f.ingredients_ru || ''} onChange={set('ingredients_ru')} /></div>
          <div><label className="label">EN</label><textarea className="input" rows={2} value={f.ingredients_en || ''} onChange={set('ingredients_en')} /></div>
        </div>
      </section>

      {/* Pricing */}
      <section className="card grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Pricing & details</div>
        <div className="grid md:grid-cols-4 gap-3">
          <div><label className="label">{t('admin.price')}</label><input type="number" step="0.01" className="input" value={f.price} onChange={set('price')} required /></div>
          <div><label className="label">{t('admin.discountPrice')}</label><input type="number" step="0.01" className="input" value={f.discount_price == null ? '' : f.discount_price} onChange={set('discount_price')} /></div>
          <div><label className="label">{t('admin.weight')}</label><input className="input" value={f.weight || ''} onChange={set('weight')} /></div>
          <div><label className="label">{t('admin.prepTime')}</label><input className="input" value={f.preparation_time || ''} onChange={set('preparation_time')} /></div>
        </div>
      </section>

      {/* Status & actions */}
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
