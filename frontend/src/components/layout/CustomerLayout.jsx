import { Outlet } from 'react-router-dom';
import FloatingCartButton from '../menu/FloatingCartButton.jsx';
// IMPORTANT: do NOT import InstallAppButton here. Public customer routes must not show it.

export default function CustomerLayout() {
  return (
    <div className="bg-restaurant min-h-screen">
      <Outlet />
      <FloatingCartButton to="/cart" />
    </div>
  );
}
