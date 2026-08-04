import React, { useState, useEffect } from 'react';

export default function Screenshot({ domain, side }) {
  const [state, setState] = useState('loading');
  const [imgSrc, setImgSrc] = useState(null);

  useEffect(() => {
    setState('loading');
    setImgSrc(null);
    const src = `https://s.wordpress.com/mshots/v1/${encodeURIComponent('https://' + domain)}?w=1200`;
    const img = new Image();
    img.onload = () => { setImgSrc(src); setState('loaded'); };
    img.onerror = () => setState('error');
    img.src = src;
  }, [domain]);

  const initial = (domain || '?').charAt(0).toUpperCase();
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--accent3)';

  return (
    <div className="hero">
      {state === 'loading' && (
        <div className="hero-loading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading homepage…
          </div>
        </div>
      )}
      {state === 'loaded' && imgSrc && (
        <img
          src={imgSrc}
          alt={`${domain} homepage`}
          style={{ display: 'block' }}
        />
      )}
      {state === 'error' && (
        <div className="hero-fallback">
          <div className="ph" style={{ color: accentColor }}>{initial}</div>
          <div>{domain}</div>
        </div>
      )}
      <div className="hero-overlay" />
    </div>
  );
}
