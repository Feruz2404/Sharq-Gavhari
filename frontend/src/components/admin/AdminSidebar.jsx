import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Icon from '../common/Icon.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useT } from '../../locales/useT.js';

function Item({ to, label, icon, onClick }) {
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
      <Icon name={icon} size={16} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export default function AdminSidebar() {
  const t = useT();
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const admin  = useAuthStore((s) => s.admin);
  const [open, setOpen] = useState(false);

  const items = (
    <>
      <Item to="/admin/dashboard"  label={t('admin.dashboard')}  icon="dashboard" onClick={() => setOpen(false)} />
      <Item to="/admin/categories" label={t('admin.categories')} icon="list"      onClick={() => setOpen(false)} />
      <Item to="/admin/products"   label={t('admin.products')}   icon="image"     onClick={() => setOpen(false)} />
      <Item to="/admin/tables"     label={t('admin.tables')}     icon="qr"        onClick={() => setOpen(false)} />
      <Item to="/admin/settings"   label={t('admin.settings')}   icon="gear"      onClick={() => setOpen(false)} />
    </>
  );

  const onLogout = () => { logout(); nav('/admin/login'); };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 backdrop-blur-xl bg-black/55 border-b border-white/5 flex items-center justify-between px-3 py-2">
        <button className="btn-icon" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          <Icon name={open ? 'close' : 'menu'} size={16} />
        </button>
        <div className="font-display gold-text text-base">SG Admin</div>
        <button onClick={onLogout} className="btn-icon" aria-label={t('admin.logout')}>
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
            <button onClick={onLogout} className="btn-ghost mt-3 justify-start">
              <Icon name="logout" size={16} /> {t('admin.logout')}
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
        <button onClick={onLogout} className="btn-ghost justify-start">
          <Icon name="logout" size={16} /> {t('admin.logout')}
        </button>
      </aside>
    </>
  );
}
