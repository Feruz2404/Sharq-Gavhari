import { useT } from '../../locales/useT.js';

export default function SearchBar({ value, onChange }) {
  const t = useT();
  return (
    <input
      className="input"
      placeholder={t('common.search')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="search"
    />
  );
}
