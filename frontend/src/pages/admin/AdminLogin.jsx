import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useT } from '../../locales/useT.js';

export default function AdminLogin() {
  const t = useT();
  const nav = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await login(email, password);
      nav('/admin/dashboard', { replace: true });
    } catch (x) {
      setErr(x.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-restaurant flex items-center justify-center p-4">
      <form onSubmit={submit} className="glass-strong p-6 w-full max-w-sm grid gap-3">
        <h1 className="font-display gold-text text-2xl text-center">SG Admin</h1>
        <div><label className="label">{t('admin.email')}</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><label className="label">{t('admin.password')}</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button disabled={busy} className="btn-gold mt-2">{busy ? '...' : t('admin.login')}</button>
      </form>
    </div>
  );
}
