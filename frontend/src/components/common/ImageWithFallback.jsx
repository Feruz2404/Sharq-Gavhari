import { useState } from 'react';
import Icon from './Icon.jsx';

export default function ImageWithFallback({ src, alt = '', className = '', ...rest }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex items-center justify-center bg-white/[0.04] text-white/30 ${className}`}>
        <Icon name="image" size={20} />
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
