import { useState } from 'react';

export default function ImageWithFallback({ src, alt = '', className = '', ...rest }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex items-center justify-center bg-white/5 text-white/30 text-xs ${className}`}>
        🍽️
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={className} {...rest} />;
}
