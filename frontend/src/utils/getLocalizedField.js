export function getLocalizedField(item, field, lang = 'uz') {
  if (!item) return '';
  return item[`${field}_${lang}`] || item[`${field}_uz`] || item[field] || '';
}
