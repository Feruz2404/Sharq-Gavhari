import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

export default function CategoryStrip({ categories = [], active = 'all', onChange }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
      <button onClick={() => onChange('all')} className={`pill ${active === 'all' ? 'pill-active' : ''}`}>
        {t('admin.categories')}
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`pill ${active === c.id ? 'pill-active' : ''}`}
        >
          {getLocalizedField(c, 'name', lang)}
        </button>
      ))}
    </div>
  );
}
