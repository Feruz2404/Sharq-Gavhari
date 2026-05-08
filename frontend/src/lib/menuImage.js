// Helpers for picking the right rendition on the public menu / tablet PWA.
//
// Public surfaces MUST NEVER load image_original_url — the originals are kept
// in private storage and only signed read URLs (admin-only) are issued for
// them. These helpers therefore never reference image_original_url.
//
// Field precedence reflects the migration path from the legacy single-image
// uploader to the new pipeline:
//   image_thumb_url  – new pipeline 450px WebP (small, fast)
//   thumbnail_url    – legacy column written by the old uploader (small WebP)
//   image_url        – new pipeline 1600px WebP and/or legacy single image
//
// Legacy rows that only have image_url still render correctly because the
// helpers fall through to it as the last resort.
//
// Usage:
//   <img src={cardImage(product)} loading="lazy" alt={product.name} />
//   <img src={detailImage(product)} alt={product.name} />

export function cardImage(item) {
  if (!item) return null
  return (
    item.image_thumb_url ||
    item.thumbnail_url ||
    item.image_url ||
    null
  )
}

export function detailImage(item) {
  if (!item) return null
  return (
    item.image_url ||
    item.thumbnail_url ||
    item.image_thumb_url ||
    null
  )
}
