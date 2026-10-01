import { useState } from 'react';


export default function Photo({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`photo-empty ${className}`} role="img" aria-label={alt} />;
  }
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
