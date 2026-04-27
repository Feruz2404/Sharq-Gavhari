import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import AdminAccessButton from './AdminAccessButton.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';
import Icon from './Icon.jsx';
import SearchBar from '../menu/SearchBar.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useT } from '../../locales/useT.js';

/**
 * Premium sticky customer header.
 *
 * Layout:
 *   - <= md  : two rows. Row 1: brand block + actions. Row 2: full-width search.
 *   -  > md  : one row. Brand | flex-1 search | actions.
 *
 * The header respects iOS / iPadOS notch & status-bar safe area via the
 * `header-safe` utility (see index.css).
 *
 * Variants:
 *   - 'home'    : full brand block + table chip + (optional) embedded search.
 *   - 'subpage' : back-link + page title (no search).
 *
 * Props:
 *   - variant : 'home' | 'subpage'
 *   - backTo  : path used by the back button on subpages
 *   - title   : title shown on subpages
 *   - search  : { value, onChange } — when provided on the home variant the
 *               search field is embedded in the header itself (no separate
 *               search row in the page body).
 */
export default function CustomerHeader({
  variant = 'home',
  backTo = '/menu',
  title = '',
  search = null,
}) {
  const settings = useSettingsStore((s) => s.settings);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const t = useT();
  const isHome = variant === 'home';
  const showSearch = isHome && !!search;

  return (
    <header className="surface-header header-safe">
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Row 1 (mobile) / left cluster (desktop): brand + mobile-only actions */}
          <div className="flex items-center justify-between gap-3 md:gap-4 md:flex-none md:min-w-0">
            {isHome ? (
              <BrandBlock settings={settings} tableNumber={tableNumber} t={t} />
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <Link to={backTo} className="btn-icon shrink-0" aria-label={t('nav.back')}>
                  <Icon name="back" size={16} className="text-white/80" />
                </Link>
                <div className="font-display gold-text truncate text-base md:text-lg">
                  {title}
                </div>
              </div>
            )}

            {/* Mobile-only actions (right of brand). Hidden on >= md. */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              <LanguageSwitcher />
              <InstallAppButton variant="icon" />
              <AdminAccessButton />
            </div>
          </div>

          {/* Search slot — full width on mobile, flex-1 (centered, capped) on desktop */}
          {showSearch && (
            <div className="flex-1 min-w-0 md:max-w-xl md:mx-auto">
              <SearchBar value={search.value} onChange={search.onChange} />
            </div>
          )}

          {/* Desktop-only actions cluster. Hidden on < md. */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <LanguageSwitcher />
            <InstallAppButton variant="icon" />
            <AdminAccessButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function BrandBlock({ settings, tableNumber, t }) {
  const restaurantName = (settings && settings.restaurant_name) || 'Sharq Gavhari';
  return (
    <div className="flex items-center gap-3 min-w-0">
      {settings && settings.logo_url ? (
        <img
          src={settings.logo_url}
          alt=""
          className="w-10 h-10 rounded-full object-cover ring-1 ring-gold/40 shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gold/15 ring-1 ring-gold/40 grid place-items-center font-display text-gold text-sm shrink-0">
          SG
        </div>
      )}
      <div className="min-w-0">
        <div className="font-display text-base md:text-lg gold-text leading-tight truncate">
          {restaurantName}
        </div>
        {tableNumber ? (
          <div className="text-[10px] text-white/55 uppercase tracking-[0.18em] mt-0.5 truncate">
            {t('common.table')} · #{tableNumber}
          </div>
        ) : (
          <div className="text-[10px] text-white/45 uppercase tracking-[0.18em] mt-0.5 truncate">
            {t('brand.tagline')}
          </div>
        )}
      </div>
    </div>
  );
}
