import Icon from '../common/Icon.jsx';
import { useInstallPrompt } from '../../utils/useInstallPrompt.js';

export default function InstallAppButton({ size = 'md' }) {
  const { canInstall, install, installed } = useInstallPrompt();
  if (installed || !canInstall) return null;
  const cls = size === 'sm' ? '!py-1.5 !px-3 text-xs' : '!py-2 !px-3 text-sm';
  return (
    <button onClick={install} className={`btn-gold ${cls}`} aria-label="Install app">
      <Icon name="install" size={14} /> Install App
    </button>
  );
}
