import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useT } from '../../locales/useT.js';
import { isQrMode } from '../../lib/pwa.js';

/**
 * Tiny lock icon in the customer header / sidebar that links to /admin/login.
 *
 * QR-mode guests must NEVER see this affordance \u2014 returning null here
 * removes the link from the DOM entirely (no display:none reliance), which
 * means every surface that already renders <AdminAccessButton/> (customer
 * sidebar drawer, customer sidebar fixed panel, product detail page header)
 * automatically loses its admin entry point in QR mode.
 */
export default function AdminAccessButton({ className = '' }) {
  const t = useT();
  if (isQrMode()) return null;
  const label = t('common.adminAccess');
  return (
    <Link
      to="/admin/login"
      title={label}
      aria-label={label}
      className={`btn-icon ${className}`}
    >
      <Icon name="lock" size={16} className="text-white/80" />
    </Link>
  );
}
