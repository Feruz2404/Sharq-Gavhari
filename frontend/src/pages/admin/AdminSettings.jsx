import { useEffect, useMemo, useState } from 'react';
import ImageUpload from '../../components/admin/ImageUpload.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useToast } from '../../components/common/Toast.jsx';
import { useT } from '../../locales/useT.js';

const LANGS = [
  { value: 'uz', label: 'O\u02BBzbekcha' },
  { value: 'ru', label: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
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
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);
  useEffect(() => {
    if (!settings) return;
    setF((prev) => ({
      ...prev,
      restaurant_name: settings.restaurant_name || '',
      logo_url: settings.logo_url || '',
      background_image_url:
        settings.background_image_url || settings.background_url || '',
      phone: settings.phone || '',
      accent_color: settings.accent_color || '#D4AF37',
      default_language: settings.default_language || 'uz',
    }));
  }, [settings]);

  const set = (k) => (v) =>
    setF((prev) => ({ ...prev, [k]: v && v.target ? v.target.value : v }));

  const save = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setBusy(true); setErr(''); setSaved(false);
    try {
      await updateSettings({
        restaurant_name: f.restaurant_name,
        logo_url: f.logo_url || null,
        background_image_url: f.background_image_url || null,
        phone: f.phone || null,
        accent_color: f.accent_color,
        default_language: f.default_language,
      });
      // Re-fetch so the public menu and other consumers immediately see the
      // persisted row (logo / background) without an extra reload.
      await fetchSettings();
      setSaved(true);
      toast.success(t('admin.settingsSaved'));
      setTimeout(() => setSaved(false), 2400);
    } catch (x) {
      const msg =
        (x && x.response && x.response.data && x.response.data.error) ||
        (x && x.message) ||
        t('admin.settingsSaveError');
      setErr(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const previewBgStyle = useMemo(
    () => (f.background_image_url
      ? { backgroundImage: 'url(' + f.background_image_url + ')' }
      : undefined),
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
    <form onSubmit={save} className="grid gap-5">
      {/* Sticky page header with title, description and save button */}
      <div className="sticky top-0 md:top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-xl bg-black/55 border-b border-white/5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl md:text-2xl gold-text leading-tight truncate">
            {t('admin.settings')}
          </h1>
          <p className="text-[12px] text-white/55 mt-0.5 hidden sm:block truncate">
            {t('admin.settingsDescription')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
              {t('admin.settingsSaved')}
            </span>
          )}
          <button disabled={busy} type="submit" className="btn-gold whitespace-nowrap">
            {busy ? t('admin.saving') : t('common.save')}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
        <div className="grid gap-5 min-w-0">
          {/* Brand section */}
          <section className="card grid gap-4">
            <header className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-base text-white/90 truncate">
                  {t('admin.restaurantDetails')}
                </div>
                <div className="text-[12px] text-white/45 mt-0.5">
                  {t('admin.brandHelper')}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70 shrink-0">Brand</span>
            </header>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">{t('admin.restaurantName')}</label>
                <input
                  className="input"
                  value={f.restaurant_name}
                  onChange={set('restaurant_name')}
                  placeholder="Sharq Gavhari"
                />
              </div>
              <div>
                <label className="label">{t('admin.phone')}</label>
                <input
                  className="input"
                  value={f.phone}
                  onChange={set('phone')}
                  placeholder="+998 ..."
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <ImageUpload
                value={f.logo_url}
                onChange={set('logo_url')}
                label={t('admin.logo')}
                bucket="logos"
                uploadLabel={t('admin.uploadLogo')}
                changeLabel={t('admin.changeLogo')}
                removeLabel={t('admin.remove')}
                placeholder={t('admin.logoPlaceholder')}
                helperText={t('admin.logoHelper')}
              />
              <ImageUpload
                value={f.background_image_url}
                onChange={set('background_image_url')}
                label={t('admin.background')}
                bucket="backgrounds"
                aspect="4 / 3"
                uploadLabel={t('admin.uploadBackground')}
                changeLabel={t('admin.changeBackground')}
                removeLabel={t('admin.remove')}
                placeholder={t('admin.backgroundPlaceholder')}
                helperText={t('admin.backgroundHelper')}
              />
            </div>
          </section>

          {/* Appearance section */}
          <section className="card grid gap-4">
            <header className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-base text-white/90 truncate">
                  {t('admin.appearance')}
                </div>
                <div className="text-[12px] text-white/45 mt-0.5">
                  {t('admin.appearanceHelper')}
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70 shrink-0">Theme</span>
            </header>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('admin.defaultLanguage')}</label>
                <div className="flex flex-wrap gap-1.5">
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
                  <input
                    className="input flex-1"
                    value={f.accent_color}
                    onChange={set('accent_color')}
                  />
                </div>
              </div>
            </div>
          </section>

          {err && (
            <div className="card !border-red-500/30 text-red-300 text-sm">
              {err}
            </div>
          )}
        </div>

        {/* Live preview \u2014 sticks alongside form on xl+ */}
        <aside className="grid gap-3 min-w-0 xl:sticky xl:top-24">
          <div className="flex items-baseline justify-between gap-3">
            <div className="font-display text-base text-white/90">
              {t('admin.livePreview')}
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Preview</span>
          </div>
          <div className="rounded-3xl border border-white/10 overflow-hidden shadow-soft relative aspect-[3/4] bg-black">
            {f.background_image_url ? (
              <div className="absolute inset-0 bg-cover bg-center" style={previewBgStyle} aria-hidden="true" />
            ) : (
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
            {t('admin.previewHint')}
          </div>
        </aside>
      </div>
    </form>
  );
}
