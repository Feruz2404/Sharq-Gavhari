import { useState } from 'react';
import ImageUpload from './ImageUpload.jsx';
import ImageUploader from '../../features/media/ImageUploader.jsx';
import ToggleSwitch from './ToggleSwitch.jsx';
import { useT } from '../../locales/useT.js';
import { useLanguageStore } from '../../stores/languageStore.js';

const UPLOAD_HINT = {
  uz: 'Yuqori sifatli rasm yuklash mumkin (50MB gacha). Tizim menyu kartalari uchun kichik WebP versiyani avtomatik tayyorlaydi.',
  ru: '\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0432\u044B\u0441\u043E\u043A\u043E\u0433\u043E \u043A\u0430\u0447\u0435\u0441\u0442\u0432\u0430 (\u0434\u043E 50MB). \u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0443\u043C\u0435\u043D\u044C\u0448\u0435\u043D\u043D\u0443\u044E WebP-\u0432\u0435\u0440\u0441\u0438\u044E \u0434\u043B\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A \u043C\u0435\u043D\u044E.',
  en: 'High-quality images up to 50 MB are supported. The system automatically generates a smaller WebP for menu cards.',
};

export default function CategoryForm({ initial = {}, onSubmit, onCancel, submitting }) {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const [f, setF] = useState({
    slug: '',
    name_uz: '', name_ru: '', name_en: '',
    image_url: '', thumbnail_url: '',
    image_thumb_url: '', image_original_url: '', image_object_path: '',
    sort_order: 0,
    is_active: true,
    ...initial,
  });

  const set = (k) => (e) =>
    setF((prev) => ({ ...prev, [k]: e && e.target ? e.target.value : e }));

  // Legacy ImageUpload \u2014 used during creation when no entity id exists.
  const handleLegacyUpload = (res) => {
    setF((prev) => ({
      ...prev,
      image_url: res.image_url || res.url || '',
      thumbnail_url:
        res.thumbnail_url || res.image_url || res.url || '',
    }));
  };

  // New ImageUploader \u2014 used while editing an existing category.
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

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...f,
      thumbnail_url:
        f.thumbnail_url ||
        f.image_thumb_url ||
        (f.image_url ? f.image_url : '') ||
        null,
    });
  };

  const isEditing = Boolean(f.id);

  return (
    <form onSubmit={submit} className="card grid md:grid-cols-2 gap-3">
      <div><label className="label">Slug</label><input className="input" value={f.slug || ''} onChange={set('slug')} placeholder="e.g. milliy" /></div>
      <div><label className="label">{t('admin.sortOrder')}</label><input className="input" type="number" value={f.sort_order || 0} onChange={(e) => set('sort_order')(Number(e.target.value))} /></div>
      <div><label className="label">Name (UZ)</label><input className="input" value={f.name_uz} onChange={set('name_uz')} required /></div>
      <div><label className="label">Name (RU)</label><input className="input" value={f.name_ru} onChange={set('name_ru')} required /></div>
      <div className="md:col-span-2"><label className="label">Name (EN)</label><input className="input" value={f.name_en} onChange={set('name_en')} required /></div>
      <div className="md:col-span-2">
        <label className="label">{t('admin.image')}</label>
        {isEditing ? (
          <ImageUploader
            entityType="category"
            entityId={f.id}
            value=
              image_url: f.image_url,
              image_thumb_url: f.image_thumb_url,
              image_original_url: f.image_original_url,
              image_object_path: f.image_object_path,
            
            onChange={handleNewUpload}
            helperText={UPLOAD_HINT[lang] || UPLOAD_HINT.en}
          />
        ) : (
          <ImageUpload
            value={f.image_url}
            thumbnailUrl={f.thumbnail_url}
            onChange={(v) => set('image_url')(v)}
            onUpload={handleLegacyUpload}
            bucket="category-images"
            label=""
            helperText={UPLOAD_HINT[lang] || UPLOAD_HINT.en}
          />
        )}
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
