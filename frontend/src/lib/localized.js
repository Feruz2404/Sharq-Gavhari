// Centralized helper for reading a localized field off a record that has
// per-language columns like name_uz / name_ru / name_en.
//
// The helper falls back through the active language -> uz -> ru -> en ->
// the base key, so partially-translated rows still render something
// instead of an empty cell. This keeps the admin lists / search readable
// even when a new product has only been filled in for one language so
// far.
//
// Intentionally NOT for:
//   - id
//   - slug
//   - image_url / thumbnail_url
//   - API paths
//   - category_id
// Those columns are language-agnostic and should be read directly.

const SUPPORTED = ['uz', 'ru', 'en'];

export function getLocalizedField(item, fieldBase, lang = 'uz') {
  if (!item) return '';
  const normalizedLang = SUPPORTED.includes(lang) ? lang : 'uz';
  return (
    item[`${fieldBase}_${normalizedLang}`] ||
    item[`${fieldBase}_uz`] ||
    item[`${fieldBase}_ru`] ||
    item[`${fieldBase}_en`] ||
    item[fieldBase] ||
    ''
  );
}
