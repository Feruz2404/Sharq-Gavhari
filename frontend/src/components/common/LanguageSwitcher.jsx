import { useLanguageStore, SUPPORTED } from '../../stores/languageStore.js';

export default function LanguageSwitcher() {
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-0.5 text-xs"
    >
      {SUPPORTED.map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLanguage(l)}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition ${
              active ? 'bg-gold text-black font-semibold shadow-gold' : 'text-white/70 hover:text-white'
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
