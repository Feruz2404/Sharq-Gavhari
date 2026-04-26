import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import { useT } from '../../locales/useT.js';

export default function CategoryForm({ initial = {}, onSubmit, onCancel, submitting }) {
  const t = useT();
  const [f, setF] = useState({
    slug: '', name_uz: '', name_ru: '', name_en: '',
    image_url: '', sort_order: 0, is_active: true, ...initial,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="card grid md:grid-cols-2 gap-3">
      <div><label className="label">Slug</label><input className="input" value={f.slug || ''} onChange={set('slug')} placeholder="e.g. milliy" /></div>
      <div><label className="label">{t('admin.sortOrder')}</label><input className="input" type="number" value={f.sort_order || 0} onChange={(e) => set('sort_order')(Number(e.target.value))} /></div>
      <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
      <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
      <div className="md:col-span-2"><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
      <div className="md:col-span-2">
        <ImageUpload value={f.image_url} onChange={(v) => set('image_url')(v)} bucket="category-images" label={t('admin.image')} />
      </div>
      <div className="md:col-span-2 flex items-center justify-between">
        <ToggleSwitch label={t('admin.isActive')} checked={f.is_active} onChange={(v) => set('is_active')(v)} />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">{t('common.cancel')}</button>
          <button type="submit" disabled={submitting} className="btn-gold">{t('common.save')}</button>
        </div>
      </div>
    </form>
  );
}
