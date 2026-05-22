import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useT } from '../../locales/useT.js';

export default function AdminLogin() {
  const t = useT();
  const nav = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // If already authenticated, send admin straight to dashboard.
  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token) nav('/admin/dashboard', { replace: true });
  }, [nav]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(identifier, password);
      nav('/admin/dashboard', { replace: true });
    } catch (x) {
      setErr(x.response?.data?.error || t('admin.loginPage.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-restaurant flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-strong p-6 w-full max-w-sm grid gap-3">
        <h1 className="font-display gold-text text-2xl text-center">{t('admin.loginPage.title')}</h1>
        <div>
          <label className="label">{t('admin.loginPage.identifier')}</label>
          <input
            className="input"
            type="text"
            autoComplete="username"
            placeholder={t('admin.loginPage.identifierPlaceholder')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t('admin.password')}</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={busy} className="btn-gold mt-2">{busy ? t('admin.loginPage.submitting') : t('admin.loginPage.submit')}</button>
        <Link to="/menu" className="btn-ghost mt-1 justify-center text-sm">
          {t('nav.backToMenu')}
        </Link>
      </form>
    </div>
  );
}
