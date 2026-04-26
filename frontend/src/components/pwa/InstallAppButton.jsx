import { useInstallPrompt } from '../../utils/useInstallPrompt.js';

export default function InstallAppButton() {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button onClick={install} className="btn-gold !py-2 !px-3 text-sm">
      ⬇ Install App
    </button>
  );
}
