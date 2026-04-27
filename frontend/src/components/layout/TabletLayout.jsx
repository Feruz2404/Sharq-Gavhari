import { Outlet } from 'react-router-dom';
import FloatingCartButton from '../menu/FloatingCartButton.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';

export default function TabletLayout() {
  return (
    <div className="app-bg min-h-screen">
      <Outlet />
      <FloatingCartButton to="/tablet/cart" />
      <div className="fixed bottom-4 left-4 z-30"><InstallAppButton /></div>
    </div>
  );
}
