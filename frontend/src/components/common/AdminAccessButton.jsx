import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useT } from '../../locales/useT.js';

export default function AdminAccessButton({ className = '' }) {
  const t = useT();
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
