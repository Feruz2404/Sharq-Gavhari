import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
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
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, price: Number(f.price || 0), discount_price: f.discount_price === '' || f.discount_price == null ? null : Number(f.discount_price) }); }} className="card grid md:grid-cols-2 gap-3">
      <div className="md:col-span-2">
        <label className="label">{t('admin.categories')}</label>
        <select className="input" value={f.category_id || ''} onChange={set('category_id')}>
          <option value="">—</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_uz}</option>)}
        </select>
      </div>
      <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
      <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
      <div className="md:col-span-2"><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
      <div><label className="label">Description (UZ)</label><textarea className="input" rows={2} value={f.description_uz || ''} onChange={set('description_uz')} /></div>
      <div><label className="label">Description (RU)</label><textarea className="input" rows={2} value={f.description_ru || ''} onChange={set('description_ru')} /></div>
      <div className="md:col-span-2"><label className="label">Description (EN)</label><textarea className="input" rows={2} value={f.description_en || ''} onChange={set('description_en')} /></div>
      <div><label className="label">Ingredients (UZ)</label><textarea className="input" rows={2} value={f.ingredients_uz || ''} onChange={set('ingredients_uz')} /></div>
      <div><label className="label">Ingredients (RU)</label><textarea className="input" rows={2} value={f.ingredients_ru || ''} onChange={set('ingredients_ru')} /></div>
      <div className="md:col-span-2"><label className="label">Ingredients (EN)</label><textarea className="input" rows={2} value={f.ingredients_en || ''} onChange={set('ingredients_en')} /></div>
      <div><label className="label">{t('admin.price')}</label><input type="number" step="0.01" className="input" value={f.price} onChange={set('price')} required /></div>
      <div><label className="label">{t('admin.discountPrice')}</label><input type="number" step="0.01" className="input" value={f.discount_price ?? ''} onChange={set('discount_price')} /></div>
      <div><label className="label">{t('admin.weight')}</label><input className="input" value={f.weight || ''} onChange={set('weight')} /></div>
      <div><label className="label">{t('admin.prepTime')}</label><input className="input" value={f.preparation_time || ''} onChange={set('preparation_time')} /></div>
      <div className="md:col-span-2">
        <ImageUpload value={f.image_url} onChange={(v) => set('image_url')(v)} bucket="product-images" label={t('admin.image')} />
      </div>
      <div className="md:col-span-2 flex items-center justify-between">
        <div className="flex gap-4">
          <ToggleSwitch label={t('admin.isAvailable')} checked={f.is_available} onChange={(v) => set('is_available')(v)} />
          <ToggleSwitch label={t('admin.isActive')}    checked={f.is_active}    onChange={(v) => set('is_active')(v)} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
          <button type="submit" disabled={submitting} className="btn-gold">{t('common.save')}</button>
        </div>
      </div>
    </form>
  );
}
