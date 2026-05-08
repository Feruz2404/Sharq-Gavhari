// Helpers for picking the right rendition on the public menu / tablet PWA.
// Public surfaces MUST NEVER load image_original_url — the originals are private.
//
// Usage:
//   <img src={cardImage(product)} loading="lazy" alt={product.name} />
//   <img src={detailImage(product)} alt={product.name} />
//
// Falls back to the legacy single image_url so existing rows keep rendering
// until they are re-uploaded through the new pipeline.

export function cardImage(item) {
  if (!item) return null
  return item.image_thumb_url || item.image_url || null
}

export function detailImage(item) {
  if (!item) return null
  return item.image_url || item.image_thumb_url || null
}
