import { useLanguageStore, SUPPORTED } from '../../stores/languageStore.js';

export default function LanguageSwitcher() {
  const lang = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-0.5 text-xs">
      {SUPPORTED.map((l) => (
        <button key={l} onClick={() => setLanguage(l)}
          className={`px-2.5 py-1 rounded-lg uppercase tracking-wider ${lang === l ? 'bg-gold text-black' : 'text-white/70 hover:text-white'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
