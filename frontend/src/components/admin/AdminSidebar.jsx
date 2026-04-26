import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useT } from '../../locales/useT.js';

function Item({ to, label }) {
  return (
    <NavLink to={to}
      className={({ isActive }) => `block px-3 py-2 rounded-xl text-sm ${isActive ? 'bg-gold text-black font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
      {label}
    </NavLink>
  );
}

export default function AdminSidebar() {
  const t = useT();
  const nav = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  return (
    <aside className="w-60 shrink-0 border-r border-white/5 bg-black/40 hidden md:flex md:flex-col p-4 gap-1">
      <div className="font-display text-xl gold-text mb-4">SG Admin</div>
      <Item to="/admin/dashboard"  label={t('admin.dashboard')} />
      <Item to="/admin/categories" label={t('admin.categories')} />
      <Item to="/admin/products"   label={t('admin.products')} />
      <Item to="/admin/tables"     label={t('admin.tables')} />
      <Item to="/admin/settings"   label={t('admin.settings')} />
      <div className="flex-1" />
      <button onClick={() => { logout(); nav('/admin/login'); }} className="btn-ghost mt-4">{t('admin.logout')}</button>
    </aside>
  );
}
