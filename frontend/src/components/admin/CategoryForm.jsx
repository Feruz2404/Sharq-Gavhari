import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import { useT } from '../../locales/useT.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const UPLOAD_HINT = {
  uz: 'Yuqori sifatli rasm yuklash mumkin. Tez yuklanishi uchun tizim menyu kartalari uchun kichik WebP versiyani avtomatik ishlatadi.',
  ru: '\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430. \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u043D\u0443\u044E WebP-\u0432\u0435\u0440\u0441\u0438\u044E \u0434\u043B\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u043C\u0435\u043D\u044E.',
  en: 'High-quality images are supported. The system automatically uses a smaller WebP version for menu cards.',
};

export default function CategoryForm({ initial = {}, onSubmit, onCancel, submitting }) {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const [f, setF] = useState({
    slug: '',
    name_uz: '', name_ru: '', name_en: '',
    image_url: '', thumbnail_url: '',
    sort_order: 0,
    is_active: true,
    ...initial,
  });

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e && e.target ? e.target.value : e }));

  // See ProductForm.handleUpload \u2014 same dual-write contract.
  const handleUpload = (res) => {
    setF((prev) => ({
      ...prev,
      image_url: res.image_url || res.url || '',
      thumbnail_url:
        res.thumbnail_url || res.image_url || res.url || '',
    }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...f,
      thumbnail_url:
        f.thumbnail_url || (f.image_url ? f.image_url : '') || null,
    });
  };

  return (
    <form onSubmit={submit} className="card grid md:grid-cols-2 gap-3">
      <div><label className="label">Slug</label><input className="input" value={f.slug || ''} onChange={set('slug')} placeholder="e.g. milliy" /></div>
      <div><label className="label">{t('admin.sortOrder')}</label><input className="input" type="number" value={f.sort_order || 0} onChange={(e) => set('sort_order')(Number(e.target.value))} /></div>
      <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
      <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
      <div className="md:col-span-2"><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
      <div className="md:col-span-2">
        <ImageUpload
          value={f.image_url}
          thumbnailUrl={f.thumbnail_url}
          onChange={(v) => set('image_url')(v)}
          onUpload={handleUpload}
          bucket="category-images"
          label={t('admin.image')}
          helperText={UPLOAD_HINT[lang] || UPLOAD_HINT.en}
        />
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
