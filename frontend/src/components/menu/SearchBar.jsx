import Icon from '../common/Icon.jsx';
import { useT } from '../../locales/useT.js';

/**
 * Header-friendly search input. Used embedded inside CustomerHeader on the
 * customer menu page. Uses `common.searchPlaceholder` for richer copy than
 * the plain "Search" label.
 */
export default function SearchBar({ value, onChange }) {
  const t = useT();
  const placeholder = t('common.searchPlaceholder');
  const ariaLabel = t('common.search');
  return (
    <div className="relative">
      <Icon
        name="search"
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none"
      />
      <input
        className="input pl-10 pr-10 !bg-white/[0.06] !border-white/10 hover:!border-white/20 focus:!ring-gold/50"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        aria-label={ariaLabel}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white p-1"
          aria-label={t('common.clear')}
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
}
