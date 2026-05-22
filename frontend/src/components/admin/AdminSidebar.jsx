import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useT } from '../../locales/useT.js';

function Item({ to, label, icon, iconNode, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
          isActive
            ? 'bg-gold text-black font-semibold shadow-gold'
            : 'text-white/70 hover:text-white hover:bg-white/5'
        }`}
    >
      {iconNode || <Icon name={icon} size={16} />}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

// Inline QR icon used for the QR sidebar item. Kept local so we don't have
// to extend the shared <Icon> name set.
const QrIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3"  y="3"  width="7" height="7" rx="1"/>
    <rect x="14" y="3"  width="7" height="7" rx="1"/>
    <rect x="3"  y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h3v3h-3z"/>
    <path d="M20 14v3"/>
    <path d="M14 20h3"/>
    <path d="M20 20h1"/>
  </svg>
);

export default function AdminSidebar() {
  const t = useT();
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const admin  = useAuthStore((s) => s.admin);
  const [open, setOpen] = useState(false);

  // Tables / "Stollar" navigation has been intentionally removed from the
  // admin UI. The backend route may still exist for legacy callers, but it
  // is no longer surfaced anywhere in the admin panel.
  const items = (
    <>
      <Item to="/admin/dashboard"  label={t('admin.sidebar.dashboard')}  icon="dashboard" onClick={() => setOpen(false)} />
      <Item to="/admin/categories" label={t('admin.sidebar.categories')} icon="list"      onClick={() => setOpen(false)} />
      <Item to="/admin/products"   label={t('admin.sidebar.products')}   icon="image"     onClick={() => setOpen(false)} />
      <Item to="/admin/qr"         label={t('admin.sidebar.qr')}         iconNode={QrIcon} onClick={() => setOpen(false)} />
      <Item to="/admin/settings"   label={t('admin.sidebar.settings')}   icon="gear"      onClick={() => setOpen(false)} />
    </>
  );

  const onLogout = () => {
    logout();
    try { localStorage.removeItem('sg_auth'); } catch (_) {}
    nav('/admin/login', { replace: true });
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 backdrop-blur-xl bg-black/55 border-b border-white/5 flex items-center justify-between px-3 py-2">
        <button className="btn-icon" onClick={() => setOpen((v) => !v)} aria-label={t('admin.sidebar.menu')}>
          <Icon name={open ? 'close' : 'menu'} size={16} />
        </button>
        <div className="font-display gold-text text-base">SG Admin</div>
        <button onClick={onLogout} className="btn-icon" aria-label={t('admin.sidebar.logout')}>
          <Icon name="logout" size={16} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-black/85 border-r border-white/10 p-4 flex flex-col gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display gold-text text-xl mb-3">SG Admin</div>
            {items}
            <div className="flex-1" />
            <div className="flex items-center justify-between gap-3 px-1 pt-3">
              <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                {t('admin.sidebar.language')}
              </span>
              <LanguageSwitcher />
            </div>
            <button onClick={onLogout} className="btn-ghost mt-3 justify-start">
              <Icon name="logout" size={16} /> {t('admin.sidebar.logout')}
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-white/5 bg-black/40 p-4 gap-1">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl border border-gold/30 bg-gold/10 grid place-items-center font-display text-gold text-sm">SG</div>
          <div>
            <div className="font-display text-lg gold-text leading-tight">Admin</div>
            <div className="text-[10px] text-white/45 tracking-widest uppercase">{admin?.email || 'Sharq Gavhari'}</div>
          </div>
        </div>
        {items}
        <div className="flex-1" />
        <div className="divider-gold my-2" />
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">
            {t('admin.sidebar.language')}
          </span>
          <LanguageSwitcher />
        </div>
        <button onClick={onLogout} className="btn-ghost justify-start mt-2">
          <Icon name="logout" size={16} /> {t('admin.sidebar.logout')}
        </button>
      </aside>
    </>
  );
}
