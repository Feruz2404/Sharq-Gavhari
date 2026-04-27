import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';

export default function AdminLayout() {
  return (
    <div className="min-h-screen app-bg flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden">
        <div className="hidden md:flex items-center justify-end gap-2 mb-4">
          <InstallAppButton size="sm" />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
