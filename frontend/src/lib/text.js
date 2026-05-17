// Display-text normalizer.
//
// Why this exists:
//  - Some product/category names + descriptions stored in Supabase contain
//    literal escape sequences (e.g. the six characters `\u2018`) instead of
//    the actual code point. JSX text content does NOT interpret JS escape
//    sequences, so those leak straight into the rendered UI.
//  - Older translation strings and admin-entered content mix typographic
//    apostrophes (\u2018 / \u2019 / \u02BB / \u02BC) with the straight ASCII
//    apostrophe. The Sharq Gavhari brand standard is straight ASCII `'`.
//
// What this does:
//  - Replaces literal escape strings `\\u2018`, `\\u2019`, `\\u02bb`,
//    `\\u201c`, `\\u201d`, `\\u2022` with their proper code points.
//  - Folds every flavor of curly / modifier apostrophe to straight ASCII `'`.
//  - Folds curly double quotes to straight `"`.
//  - Collapses runs of whitespace and trims the result.
//
// Use ONLY on user-facing display text:
//  - product / category names
//  - product / category descriptions, ingredients
//  - QR card labels, free-form admin labels
//
// Do NOT use on URLs, IDs, slugs, image paths, or API endpoints — apostrophe
// folding will corrupt them.
export function normalizeDisplayText(value) {
  if (typeof value !== 'string') return value;
  if (value.length === 0) return value;
  return value
    // Literal six-character escape sequences that leaked into stored text.
    .replace(/\\u2018/g, "'")
    .replace(/\\u2019/g, "'")
    .replace(/\\u02bb/gi, "'")
    .replace(/\\u02bc/gi, "'")
    .replace(/\\u201c/gi, '"')
    .replace(/\\u201d/gi, '"')
    .replace(/\\u2022/gi, '•')
    // Real typographic apostrophe / modifier-letter variants → straight ASCII.
    .replace(/[\u2018\u2019\u02BB\u02BC\u2032]/g, "'")
    // Real curly double quotes → straight ASCII.
    .replace(/[\u201C\u201D]/g, '"')
    // Collapse whitespace runs (but keep single newlines tidy).
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// Convenience: normalize an object's display fields in place (non-mutating).
// Useful if you ever want to bulk-clean a record before passing it down.
export function normalizeDisplayFields(record, fields) {
  if (!record || typeof record !== 'object') return record;
  const out = { ...record };
  for (const f of fields) {
    if (typeof out[f] === 'string') out[f] = normalizeDisplayText(out[f]);
  }
  return out;
}
