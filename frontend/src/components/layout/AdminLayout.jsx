import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import InstallAppButton from '../pwa/InstallAppButton.jsx';
import UpdateBanner from '../pwa/UpdateBanner.jsx';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { useLanguageStore } from '../../stores/languageStore.js';

export default function AdminLayout() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  const setLanguageFromSettings = useLanguageStore((s) => s.setLanguageFromSettings);

  // Make sure restaurant settings are loaded once so the admin shell has
  // access to default_language (and so the customer menu picks up brand
  // assets even if an admin lands directly on /admin/...).
  useEffect(() => {
    if (!settings) {
      fetchSettings().catch(() => { /* non-blocking */ });
    }
  }, [settings, fetchSettings]);

  // When settings arrive, fill the language with the restaurant default
  // ONLY if the visitor has not already picked one. Manual picks via the
  // sidebar's LanguageSwitcher always win (tracked by userPicked in the
  // language store).
  useEffect(() => {
    if (settings && settings.default_language) {
      setLanguageFromSettings(settings.default_language);
    }
  }, [settings, setLanguageFromSettings]);

  return (
    <div className="min-h-screen app-bg flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden">
        <div className="hidden md:flex items-center justify-end gap-2 mb-4">
          <InstallAppButton size="sm" />
        </div>
        <Outlet />
      </main>
      <UpdateBanner />
    </div>
  );
}
