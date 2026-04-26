import uz from './uz.js';
import ru from './ru.js';
import en from './en.js';
import { useLanguageStore } from '../stores/languageStore.js';

const dicts = { uz, ru, en };

function lookup(dict, path) {
  return path.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : undefined), dict);
}

export function tForLang(path, lang = 'uz') {
  return lookup(dicts[lang], path) ?? lookup(dicts.uz, path) ?? path;
}

export function useT() {
  const lang = useLanguageStore((s) => s.language);
  return (path) => tForLang(path, lang);
}
