import { useLanguageStore, SUPPORTED } from '../../stores/languageStore.js';
import { useT } from '../../locales/useT.js';

// Display labels for each supported locale code. Kept as ASCII shortcodes so
// the switcher always looks identical regardless of the current locale, and
// is recognizable even before the user can read any of the surrounding UI.
const LABELS = { uz: 'UZ', ru: 'RU', en: 'EN' };

/**
 * LanguageSwitcher
 *
 * Compact 3-state pill toggle (UZ / RU / EN) bound to the existing
 * useLanguageStore. Persists via the store's `sg_lang` localStorage key, so
 * the chosen language survives refresh and logout/login.
 *
 * Props:
 *  - className: extra wrapper classes (so callers can stretch / align it).
 */
export default function LanguageSwitcher({ className = '' }) {
  const t = useT();
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <div
      role="group"
      aria-label={t('admin.sidebar.language')}
      className={
        'inline-flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.04] ' +
        className
      }
    >
      {SUPPORTED.map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={
              'px-2.5 py-1 text-[11px] font-semibold rounded-lg tracking-wider transition ' +
              (active
                ? 'bg-gold text-black shadow-gold'
                : 'text-white/65 hover:text-white hover:bg-white/5')
            }
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
