import { useEffect, useMemo, useState } from 'react';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useToast } from '../../components/common/Toast.jsx';
import { useT } from '../../locales/useT.js';

const LANGS = [
  { value: 'uz', label: "O\u02BBzbekcha" },
  { value: 'ru', label: 'Pусский' },
  { value: 'en', label: 'English' },
];

export default function AdminSettings() {
  const t = useT();
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const toast = useToast();

  const [f, setF] = useState({
    restaurant_name: '',
    logo_url: '',
    background_image_url: '',
    phone: '',
    accent_color: '#D4AF37',
    default_language: 'uz',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => {
    if (!settings) return;
    setF((prev) => ({
      ...prev,
      restaurant_name: settings.restaurant_name || '',
      logo_url: settings.logo_url || '',
      background_image_url: settings.background_image_url || settings.background_url || '',
      phone: settings.phone || '',
      accent_color: settings.accent_color || '#D4AF37',
      default_language: settings.default_language || 'uz',
    }));
  }, [settings]);

  const set = (k) => (v) =>
    setF((prev) => ({ ...prev, [k]: v && v.target ? v.target.value : v }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await updateSettings({
        restaurant_name: f.restaurant_name,
        logo_url: f.logo_url || null,
        background_image_url: f.background_image_url || null,
        phone: f.phone || null,
        accent_color: f.accent_color,
        default_language: f.default_language,
      });
      toast.success('Sozlamalar saqlandi');
    } catch (x) {
      const msg = (x && x.response && x.response.data && x.response.data.error) || (x && x.message) || 'Saqlashda xatolik';
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const previewBgStyle = useMemo(
    () => (f.background_image_url ? { backgroundImage: 'url(' + f.background_image_url + ')' } : undefined),
    [f.background_image_url]
  );
  const previewBrandStyle = useMemo(
    () => ({ color: f.accent_color || '#D4AF37' }),
    [f.accent_color]
  );
  const previewChipStyle = useMemo(
    () => ({ background: f.accent_color || '#D4AF37', color: '#000' }),
    [f.accent_color]
  );

  return (
    <form onSubmit={save} className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
      <div className="grid gap-5 min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl gold-text">{t('admin.settings')}</h1>
          <button disabled={busy} type="submit" className="btn-gold">
            {busy ? '\u2026' : t('common.save')}
          </button>
        </div>

        <section className="card grid gap-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Brand</div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.restaurantName')}</label>
              <input className="input" value={f.restaurant_name} onChange={set('restaurant_name')} placeholder="Sharq Gavhari" />
            </div>
            <div>
              <label className="label">{t('admin.phone')}</label>
              <input className="input" value={f.phone} onChange={set('phone')} placeholder="+998 ..." />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <ImageUpload
              value={f.logo_url}
              onChange={set('logo_url')}
              label={t('admin.logo')}
              bucket="logos"
            />
            <ImageUpload
              value={f.background_image_url}
              onChange={set('background_image_url')}
              label={t('admin.background')}
              bucket="backgrounds"
              aspect="4 / 3"
            />
          </div>
        </section>

        <section className="card grid gap-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Appearance</div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('admin.defaultLanguage')}</label>
              <div className="flex gap-1.5">
                {LANGS.map((l) => {
                  const active = f.default_language === l.value;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => set('default_language')(l.value)}
                      className={'pill ' + (active ? 'pill-active' : '')}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">{t('admin.accentColor')}</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                  value={f.accent_color}
                  onChange={set('accent_color')}
                />
                <input className="input flex-1" value={f.accent_color} onChange={set('accent_color')} />
              </div>
            </div>
          </div>
        </section>

        {err && (
          <div className="card !border-red-500/30 text-red-300 text-sm">{err}</div>
        )}
      </div>

      <aside className="grid gap-3 min-w-0">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Live preview</div>
        <div className="rounded-3xl border border-white/10 overflow-hidden shadow-soft relative aspect-[3/4] bg-black">
          <div className="absolute inset-0 bg-cover bg-center" style={previewBgStyle} aria-hidden="true" />
          {!f.background_image_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-zinc-950 to-black" aria-hidden="true" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black" aria-hidden="true" />
          <div className="relative z-10 h-full p-5 flex flex-col">
            <div className="flex items-center gap-2.5">
              {f.logo_url ? (
                <img src={f.logo_url} alt="" className="w-10 h-10 rounded-full object-cover ring-1 ring-gold/40" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold/15 ring-1 ring-gold/40 grid place-items-center font-display text-gold text-sm">SG</div>
              )}
              <div className="font-display text-lg leading-tight truncate" style={previewBrandStyle}>
                {f.restaurant_name || 'Sharq Gavhari'}
              </div>
            </div>
            <div className="mt-auto">
              <div className="text-[10px] uppercase tracking-[0.32em] text-white/55">Premium Cuisine</div>
              <div className="font-display text-2xl text-white mt-1 leading-tight">
                {f.restaurant_name || 'Sharq Gavhari'}
              </div>
              <div className="mt-3 inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold" style={previewChipStyle}>
                {t('common.showWaiter')}
              </div>
            </div>
          </div>
        </div>
        <div className="text-[11px] text-white/40 leading-relaxed">
          Bu yerda logo, fon, restoran nomi va asosiy rang real vaqtda ko\u02BBrinadi.
        </div>
      </aside>
    </form>
  );
}
