import Icon from '../common/Icon.jsx';
import { useT } from '../../locales/useT.js';

export default function SearchBar({ value, onChange }) {
  const t = useT();
  return (
    <div className="relative">
      <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        className="input pl-10 pr-10"
        placeholder={t('common.search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        aria-label={t('common.search')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
          aria-label="Clear"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
