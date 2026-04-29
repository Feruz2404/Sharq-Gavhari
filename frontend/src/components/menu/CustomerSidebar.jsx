import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon.jsx';
import SearchBar from './SearchBar.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import AdminAccessButton from '../common/AdminAccessButton.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useCartStore } from '../../stores/cartStore.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useT } from '../../locales/useT.js';

/**
 * Premium customer-menu sidebar.
 *
 * Two render modes:
 *   - variant="fixed"  : sticky panel for desktop (lg+) screens
 *   - variant="drawer" : off-canvas overlay for tablet & mobile
 *
 * Both modes share the SAME inner content via <SidebarContent/>: brand block,
 * language switcher, search input, vertical category navigation list, and a
 * footer cluster (admin + install + cart link).
 *
 * NOTE: the sidebar no longer renders an "All" / "Barchasi" entry. The customer
 * menu page treats category selection as the primary action.
 */
export default function CustomerSidebar({
  variant = 'fixed',
  open = false,
  onClose,
  categories = [],
  productCounts = {},
  activeCategoryId = null,
  onSelectCategory,
  query = '',
  onQueryChange,
}) {
  useEffect(() => {
    if (variant !== 'drawer' || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [variant, open]);

  useEffect(() => {
    if (variant !== 'drawer' || !open) return;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [variant, open, onClose]);

  if (variant === 'fixed') {
    return (
      <div className="glass-strong rounded-3xl p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto no-scrollbar">
        <SidebarContent
          categories={categories}
          productCounts={productCounts}
          activeCategoryId={activeCategoryId}
          onSelectCategory={onSelectCategory}
          query={query}
          onQueryChange={onQueryChange}
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={OVERLAY_HIDDEN}
            animate={OVERLAY_SHOWN}
            exit={OVERLAY_HIDDEN}
            transition={OVERLAY_TRANS}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            key="drawer"
            initial={DRAWER_HIDDEN}
            animate={DRAWER_SHOWN}
            exit={DRAWER_HIDDEN}
            transition={DRAWER_TRANS}
            className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-sm bg-[#0A0A0A] border-r border-white/10 shadow-[12px_0_60px_-20px_rgba(0,0,0,0.8)] lg:hidden flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar header-safe">
              <SidebarContent
                categories={categories}
                productCounts={productCounts}
                activeCategoryId={activeCategoryId}
                onSelectCategory={onSelectCategory}
                query={query}
                onQueryChange={onQueryChange}
                onCloseDrawer={onClose}
              />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const OVERLAY_HIDDEN = { opacity: 0 };
const OVERLAY_SHOWN  = { opacity: 1 };
const OVERLAY_TRANS  = { duration: 0.2 };
const DRAWER_HIDDEN  = { x: '-100%' };
const DRAWER_SHOWN   = { x: 0 };
const DRAWER_TRANS   = { type: 'spring', stiffness: 320, damping: 32 };

function SidebarContent({
  categories,
  productCounts,
  activeCategoryId,
  onSelectCategory,
  query,
  onQueryChange,
  onCloseDrawer,
}) {
  const settings = useSettingsStore((s) => s.settings);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const cartCount = useCartStore((s) => s.getItemCount());
  const lang = useLanguageStore((s) => s.language);
  const t = useT();

  const restaurantName = (settings && settings.restaurant_name) || 'Sharq Gavhari';

  return (
    <div className="flex flex-col gap-4">
      {/* Brand block + (drawer-only) close button */}
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {settings && settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt=""
              className="w-11 h-11 rounded-full object-cover ring-1 ring-gold/40 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gold/15 ring-1 ring-gold/40 grid place-items-center font-display text-gold text-base shrink-0">
              SG
            </div>
          )}
          <div className="min-w-0">
            <div className="font-display text-lg gold-text leading-tight truncate">
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
        {onCloseDrawer && (
          <button
            type="button"
            onClick={onCloseDrawer}
            className="btn-icon shrink-0"
            aria-label={t('nav.closeMenu')}
          >
            <Icon name="close" size={16} className="text-white/85" />
          </button>
        )}
      </div>

      {/* Language switcher */}
      <div>
        <LanguageSwitcher />
      </div>

      {/* Search */}
      <div>
        <SearchBar value={query} onChange={onQueryChange} />
      </div>

      <div className="divider-gold opacity-60" />

      {/* Category navigation \u2014 NO "All" entry. */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/45 px-2 mb-2">
          {t('menu.categoriesTitle')}
        </div>
        <nav className="grid gap-0.5">
          {categories.map((c) => {
            const name = getLocalizedField(c, 'name', lang);
            const initial = (name || '?').trim().charAt(0).toUpperCase();
            return (
              <NavItem
                key={c.id}
                label={name}
                count={productCounts[c.id] || 0}
                active={activeCategoryId === c.id}
                onClick={() => onSelectCategory && onSelectCategory(c.id)}
                imageUrl={c.image_url}
                initial={initial}
              />
            );
          })}
        </nav>
      </div>

      <div className="divider-gold opacity-60" />

      {/* Footer actions */}
      <div className="flex items-center gap-2">
        <AdminAccessButton />
        <InstallAppButton variant="icon" />
        <Link
          to="/cart"
          className="btn-icon ml-auto relative"
          aria-label={t('nav.cart')}
          title={t('nav.cart')}
        >
          <Icon name="cart" size={16} className="text-white/85" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-black text-[10px] font-bold grid place-items-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}

function NavItem({ label, count, active, onClick, imageUrl, initial }) {
  const cls =
    'group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition ' +
    (active
      ? 'bg-gold/12 text-gold ring-1 ring-gold/30'
      : 'text-white/75 hover:text-white hover:bg-white/[0.05]');

  return (
    <button type="button" onClick={onClick} className={cls} aria-pressed={active}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
        />
      ) : (
        <span className="w-7 h-7 rounded-lg bg-white/[0.06] ring-1 ring-white/10 grid place-items-center font-display text-gold text-sm shrink-0">
          {initial}
        </span>
      )}
      <span className="flex-1 truncate text-sm">{label}</span>
      <span
        className={
          'shrink-0 text-[11px] tabular-nums px-1.5 rounded-md ' +
          (active ? 'text-gold/90' : 'text-white/35 group-hover:text-white/55')
        }
      >
        {count}
      </span>
    </button>
  );
}
