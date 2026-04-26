import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-bg-deep flex">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        <div className="flex justify-end mb-3"><InstallAppButton /></div>
        <Outlet />
      </main>
    </div>
  );
}
