import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export default function AdminAccessButton({ className = '' }) {
  return (
    <Link
      to="/admin/login"
      title="Admin access"
      aria-label="Admin access"
      className={`btn-icon ${className}`}
    >
      <Icon name="lock" size={16} className="text-white/80" />
    </Link>
  );
}
