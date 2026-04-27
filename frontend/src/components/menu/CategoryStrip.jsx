import { getLocalizedField } from '../../utils/getLocalizedField.js';
import { useLanguageStore } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

/**
 * Horizontal pill strip used as a chip filter when the user has narrowed the
 * menu (search query or specific category). Hidden on the default home view.
 */
export default function CategoryStrip({ categories = [], active = 'all', onChange }) {
  const lang = useLanguageStore((s) => s.language);
  const t = useT();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={`pill ${active === 'all' ? 'pill-active' : ''}`}
      >
        {t('menu.allCategories')}
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          className={`pill ${active === c.id ? 'pill-active' : ''}`}
        >
          {getLocalizedField(c, 'name', lang)}
        </button>
      ))}
    </div>
  );
}
