import { Link } from 'react-router-dom';
import LanguageSwitcher from '../../components/common/LanguageSwitcher.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useT } from '../../locales/useT.js';

export default function TabletHome() {
  const settings = useSettingsStore((s) => s.settings);
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex justify-end p-4"><LanguageSwitcher /></header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-strong p-8 text-center max-w-md w-full grid gap-4">
          {settings?.logo_url && <img src={settings.logo_url} alt="" className="w-20 h-20 mx-auto rounded-full object-cover" />}
          <h1 className="font-display gold-text text-3xl">{settings?.restaurant_name || 'Sharq Gavhari'}</h1>
          <p className="text-white/60 text-sm">PREMIUM CUISINE</p>
          <Link to="/tablet/menu" className="btn-gold !py-3 text-lg">{t('nav.menu')}</Link>
        </div>
      </div>
    </div>
  );
}
