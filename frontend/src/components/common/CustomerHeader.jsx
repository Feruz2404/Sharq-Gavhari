import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AdminAccessButton from './AdminAccessButton.jsx';
import Icon from './Icon.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

/**
 * Premium sticky header used across customer-facing pages.
 * Variants:
 *   - 'home'    : full brand block + table chip
 *   - 'subpage' : back-link + page title
 */
export default function CustomerHeader({ variant = 'home', backTo = '/menu', title = '' }) {
  const settings = useSettingsStore((s) => s.settings);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const t = useT();

  return (
    <header className="surface-header">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {variant === 'home' ? (
          <div className="flex items-center gap-3 min-w-0">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover ring-1 ring-gold/40"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gold/15 ring-1 ring-gold/40 grid place-items-center font-display text-gold text-sm">SG</div>
            )}
            <div className="min-w-0">
              <div className="font-display text-lg gold-text leading-tight truncate">
                {settings?.restaurant_name || 'Sharq Gavhari'}
              </div>
              {tableNumber ? (
                <div className="text-[10px] text-white/55 uppercase tracking-[0.18em] mt-0.5">
                  {t('common.table')} · #{tableNumber}
                </div>
              ) : (
                <div className="text-[10px] text-white/40 uppercase tracking-[0.18em] mt-0.5">Premium Cuisine</div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            <Link to={backTo} className="btn-icon" aria-label={t('nav.back')}>
              <Icon name="back" size={16} className="text-white/80" />
            </Link>
            <div className="font-display gold-text truncate text-base md:text-lg">{title}</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AdminAccessButton />
        </div>
      </div>
    </header>
  );
}
