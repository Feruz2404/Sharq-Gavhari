import { useEffect, useState } from 'react';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useT } from '../../locales/useT.js';

export default function AdminSettings() {
  const t = useT();
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [f, setF] = useState({
    restaurant_name: '', logo_url: '', background_url: '',
    contact_phone: '', accent_color: '#D4AF37', default_language: 'uz',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => { if (settings) setF((prev) => ({ ...prev, ...settings })); }, [settings]);

  const set = (k) => (v) => setF({ ...f, [k]: v?.target ? v.target.value : v });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await updateSettings(f); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={save} className="grid gap-4 max-w-3xl">
      <h1 className="font-display text-2xl gold-text">{t('admin.settings')}</h1>
      <div className="grid md:grid-cols-2 gap-3 card">
        <div><label className="label">{t('admin.restaurantName')}</label><input className="input" value={f.restaurant_name || ''} onChange={set('restaurant_name')} /></div>
        <div><label className="label">{t('admin.phone')}</label><input className="input" value={f.contact_phone || ''} onChange={set('contact_phone')} /></div>
        <div>
          <label className="label">{t('admin.defaultLanguage')}</label>
          <select className="input" value={f.default_language || 'uz'} onChange={set('default_language')}>
            <option value="uz">UZ</option><option value="ru">RU</option><option value="en">EN</option>
          </select>
        </div>
        <div><label className="label">{t('admin.accentColor')}</label><input className="input" type="color" value={f.accent_color || '#D4AF37'} onChange={set('accent_color')} /></div>
        <ImageUpload value={f.logo_url}        onChange={set('logo_url')}        label={t('admin.logo')}       bucket="restaurant-assets" />
        <ImageUpload value={f.background_url}  onChange={set('background_url')}  label={t('admin.background')} bucket="restaurant-assets" />
      </div>
      <div className="flex justify-end"><button disabled={busy} className="btn-gold">{busy ? '...' : t('common.save')}</button></div>
    </form>
  );
}
