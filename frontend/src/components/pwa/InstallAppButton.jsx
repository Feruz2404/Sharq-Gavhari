import { useState } from 'react';
import Icon from '../common/Icon.jsx';
import { useInstallPrompt } from '../../utils/useInstallPrompt.js';
import { useT } from '../../locales/useT.js';
import IOSInstallModal from './IOSInstallModal.jsx';
import { isQrMode } from '../../lib/pwa.js';

/**
 * Install button rendered in the customer/admin header.
 *
 * Behavior:
 *   - QR visitors NEVER see this control \u2014 we early-return null.
 *   - On Android/desktop Chromium browsers: shows when the browser fires
 *     `beforeinstallprompt`; clicking calls `prompt()` on the deferred event.
 *   - On iOS / iPadOS Safari (where `beforeinstallprompt` is never fired):
 *     shows whenever the app is NOT running standalone; clicking opens a
 *     localized step-by-step Add-to-Home-Screen instructions modal.
 *   - When the app is already installed (standalone display mode), the button
 *     is hidden in all environments.
 */
export default function InstallAppButton({ variant = 'icon', className = '' }) {
  const { canInstall, install, platform } = useInstallPrompt();
  const t = useT();
  const [iosOpen, setIosOpen] = useState(false);

  // Hard suppress for QR guests \u2014 must run before any other condition.
  if (isQrMode()) return null;
  if (!canInstall) return null;

  const handleClick = () => {
    if (platform === 'ios') setIosOpen(true);
    else install();
  };

  const button = variant === 'icon' ? (
    <button
      type="button"
      onClick={handleClick}
      title={t('common.installApp')}
      aria-label={t('common.installApp')}
      className={`btn-icon hover:!border-gold/60 hover:!bg-gold/10 ${className}`}
    >
      <Icon name="install" size={16} className="text-gold" />
    </button>
  ) : (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-gold !py-2 !px-3 text-sm ${className}`}
      aria-label={t('common.installApp')}
    >
      <Icon name="install" size={14} />
      <span>{t('common.install')}</span>
    </button>
  );

  return (
    <>
      {button}
      {platform === 'ios' && (
        <IOSInstallModal open={iosOpen} onClose={() => setIosOpen(false)} />
      )}
    </>
  );
}
