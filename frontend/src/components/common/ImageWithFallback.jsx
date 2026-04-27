import { useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Premium image with graceful fallback. Pass `fallback` to render a custom
 * placeholder (e.g. category gradient + initial). Otherwise we render a
 * subtle gold-tinted dark placeholder with an icon — never a broken-image
 * box.
 */
export default function ImageWithFallback({
  src,
  alt = '',
  className = '',
  fallback = null,
  iconName = 'image',
  ...rest
}) {
  const [err, setErr] = useState(false);
  if (!src || err) {
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
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className={className}
      {...rest}
    />
  );
}
