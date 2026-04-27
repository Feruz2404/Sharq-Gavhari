import { Outlet } from 'react-router-dom';
import FloatingCartButton from '../menu/FloatingCartButton.jsx';
// IMPORTANT: do NOT import InstallAppButton here. Public customer routes must not surface PWA install.

export default function CustomerLayout() {
  return (
    <div className="app-bg min-h-screen">
      <Outlet />
      <FloatingCartButton to="/cart" />
    </div>
  );
}
