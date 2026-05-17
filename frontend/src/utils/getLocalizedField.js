import { normalizeDisplayText } from '../lib/text.js';

/**
 * Read a localized display field from a Notion-like record.
 *
 * The record stores variants per language as `<field>_<lang>` (e.g. `name_uz`,
 * `name_ru`, `name_en`). We fall back to `_uz` and then to the bare key.
 *
 * Every return value is passed through `normalizeDisplayText` so any escaped
 * unicode that leaked in from Supabase (e.g. literal `\u2018`) and any mixed
 * apostrophe variants (\u2018 / \u2019 / \u02BB) are folded to the straight
 * ASCII apostrophe before the UI ever sees them.
 */
export function getLocalizedField(item, field, lang = 'uz') {
  if (!item) return '';
  const raw =
    item[`${field}_${lang}`] ||
    item[`${field}_uz`] ||
    item[field] ||
    '';
  return normalizeDisplayText(raw);
}
