import Icon from '../common/Icon.jsx';
import { useInstallPrompt } from '../../utils/useInstallPrompt.js';
import { useT } from '../../locales/useT.js';

/**
 * Install button. Renders nothing unless the browser has fired
 * `beforeinstallprompt`. Variants:
 *   - 'icon' : compact gold icon button (header)
 *   - 'pill' : full pill with label
 */
export default function InstallAppButton({ variant = 'icon', className = '' }) {
  const { canInstall, install } = useInstallPrompt();
  const t = useT();
  if (!canInstall) return null;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={install}
        title={t('common.installApp')}
        aria-label={t('common.installApp')}
        className={`btn-icon hover:!border-gold/60 hover:!bg-gold/10 ${className}`}
      >
        <Icon name="install" size={16} className="text-gold" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={install}
      className={`btn-gold !py-2 !px-3 text-sm ${className}`}
      aria-label={t('common.installApp')}
    >
      <Icon name="install" size={14} />
      <span>{t('common.install')}</span>
    </button>
  );
}
