import { useState, useEffect } from 'react';
import Icon from './Icon.jsx';

/**
 * Lazy, layout-stable image with graceful fallback.
 *
 * Performance-tuned for the public menu:
 *   * `decoding="async"` so decode runs off the main thread.
 *   * `loading="lazy"` for off-screen images, `eager` for above-the-fold
 *     (hero, drawer image when opened).
 *   * `fetchPriority="high"` when `eager` so the browser prioritises the
 *     LCP candidate.
 *   * Optional `thumbnailUrl` is rendered first; a `srcSet` containing both
 *     the thumb (\u2248600w) and the full image lets the browser pick the
 *     right asset based on `sizes` so high-DPI desktops still get sharp
 *     images while mobile / iPad cards download the small WebP.
 *   * Fade-in via opacity \u2014 prevents the empty placeholder from popping
 *     into the loaded image.
 *   * Stable: no re-render storms, even when `onError` fires.
 *
 * Props:
 *   src           full-quality image URL (used in srcSet + fallback)
 *   thumbnailUrl  optimized small URL preferred for cards
 *   alt           accessible label
 *   className     applied directly to <img> (parents must own aspect-ratio /
 *                 overflow-hidden so layout stays stable while the image loads)
 *   fallback      ReactNode rendered when no URL or load fails
 *   eager         true \u2192 loading="eager" + fetchPriority="high"
 *   sizes         responsive `sizes` attribute paired with srcSet
 *   iconName      icon for the default fallback box
 */
export default function ImageWithFallback({
  src,
  thumbnailUrl,
  alt = '',
  className = '',
  fallback = null,
  eager = false,
  sizes,
  iconName = 'image',
  ...rest
}) {
  const primary = thumbnailUrl || src || '';
  const [err, setErr] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset state when the source changes (e.g. user navigates to a different
  // product in the drawer). Avoids stuck "already loaded" opacity if the
  // browser still needs to fetch the new URL.
  useEffect(() => {
    setErr(false);
    setLoaded(false);
  }, [primary]);

  if (!primary || err) {
    if (fallback) {
      return <div className={className}>{fallback}</div>;
    }
    return (
      <div
        className={`flex items-center justify-center text-gold/40 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-gold/[0.06] ${className}`}
      >
        <Icon name={iconName} size={28} />
      </div>
    );
  }

  // Build srcSet only when both URLs exist and differ \u2014 otherwise the
  // browser would receive duplicates and pick arbitrarily.
  const srcSet =
    thumbnailUrl && src && thumbnailUrl !== src
      ? `${thumbnailUrl} 600w, ${src} 1600w`
      : undefined;

  const opacityCls = loaded ? 'opacity-100' : 'opacity-0';
  const finalCls = `${className} transition-opacity duration-500 ${opacityCls}`;

  return (
    <img
      src={primary}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={() => setErr(true)}
      onLoad={() => setLoaded(true)}
      className={finalCls}
      {...rest}
    />
  );
}
