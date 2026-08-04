import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import I from './icons';
import { cleanDomain } from '../lib/domain';
import { extractVsData } from '../lib/whois';
import { fetchPageMeta, exportViaSone } from '../lib/api';

export default function VsIdeaCard({ theme, domainA, domainB, scanTrigger }) {
  const cardRef = useRef(null);
  const [urlA, setUrlA] = useState('');
  const [urlB, setUrlB] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  const parseDomain = (u) => {
    try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, ''); }
    catch { return cleanDomain(u); }
  };

  const onScan = async (a, b) => {
    const ua = a || urlA, ub = b || urlB;
    if (!ua || !ub) return;
    setUrlA(ua); setUrlB(ub);
    setScanning(true);
    setResult(null);
    const dA = parseDomain(ua);
    const dB = parseDomain(ub);
    const [rA, rB] = await Promise.allSettled([fetchPageMeta(dA), fetchPageMeta(dB)]);
    const ra = rA.status === 'fulfilled' ? rA.value : { domain: dA, error: rA.reason?.message };
    const rb = rB.status === 'fulfilled' ? rB.value : { domain: dB, error: rB.reason?.message };
    setResult({ a: ra, b: rb, time: Date.now() });
    setScanning(false);
    if (cardRef.current) cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (domainA && domainB) onScan(domainA, domainB);
  // eslint-disable-next-line
  }, [scanTrigger]);

  const onExport = async () => {
    if (!result) return;
    try {
      const payload = {
        type: 'vs-compare',
        theme,
        domainA,
        domainB,
        dataA: extractVsData(result.a),
        dataB: extractVsData(result.b),
      };
      await exportViaSone(payload, `vs-compare-${Date.now()}.png`);
    } catch (err) {
      console.error('SONE VS export failed, trying fallback:', err);
      try {
        if (!cardRef.current) return;
        const images = cardRef.current.querySelectorAll('img');
        const restore = [];
        for (const img of images) {
          if (img.src && !img.src.startsWith('data:')) {
            try {
              const r = await fetch(img.src);
              const blob = await r.blob();
              const dataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
              });
              if (dataUrl) { restore.push({ img, original: img.src }); img.src = dataUrl; }
            } catch {}
          }
        }

        await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { img.addEventListener('load', resolve); img.addEventListener('error', resolve); setTimeout(resolve, 3000); });
        }));

        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: theme === 'dark' ? '#07070b' : '#f3f3f8',
          scale: 2, logging: false, timeout: 20000, removeContainer: true, useCORS: true,
        });

        for (const { img, original } of restore) img.src = original;

        const link = document.createElement('a');
        link.download = `vs-compare-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 0.95);
        link.click();
      } catch (fallbackErr) {
        console.error('VS Idea export failed:', fallbackErr);
      }
    }
  };

  const displayUrl = (domain) => {
    const input = domain === 'a' ? urlA : urlB;
    try { return input.startsWith('http') ? input : `https://${input}`; } catch { return input; }
  };

  const labelName = (domain) => {
    try { return new URL(domain.startsWith('http') ? domain : `https://${domain}`).hostname.replace(/^www\./, ''); }
    catch { return domain; }
  };

  return (
    <div className="bento vs-idea-bento anim-in" style={{ '--i': 3 }} ref={cardRef}>
      <div className="vs-idea-head">
        <div>
          <h2>VS Compare</h2>
          <div className="sub">Compare any two web apps or products side-by-side</div>
        </div>
        {result && (
          <button className="btn btn-ghost btn-sm" onClick={onExport} title="Export this comparison as image">
            {I.cam} Export
          </button>
        )}
      </div>

      {/* Inputs */}
      <div className="input-row" style={{ marginBottom: '0.6rem' }}>
        <div className="input-group">
          <label>URL A</label>
          <input value={urlA} onChange={e => setUrlA(e.target.value)}
            placeholder="e.g. github.com" spellCheck={false} autoComplete="off" />
        </div>
        <div className="vs-divider"><span className="vs-badge">VS</span></div>
        <div className="input-group">
          <label>URL B</label>
          <input value={urlB} onChange={e => setUrlB(e.target.value)}
            placeholder="e.g. gitlab.com" spellCheck={false} autoComplete="off" />
        </div>
      </div>
      <div className="input-actions" style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary" onClick={() => onScan()} disabled={scanning || !urlA || !urlB}>
          {I.arrow}{scanning ? 'Scanning…' : 'Compare'}
        </button>
      </div>

      {/* Results */}
      {scanning && (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted)', fontSize: '0.7rem' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '0.4rem' }} />
          Scanning both URLs…
        </div>
      )}

      {result && !scanning && (
        <>
          <div className="vs-idea-section">
            <h3>Overview</h3>
            <table className="vs-table vs-overview">
              <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                {[
                  ['Title', result.a.title || result.a.social?.title, result.b.title || result.b.social?.title],
                  ['Description', (result.a.description || result.a.social?.description || '').slice(0, 100), (result.b.description || result.b.social?.description || '').slice(0, 100)],
                  ['Category', result.a.category, result.b.category],
                ].map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{ci === 0 ? cell : (ci > 0 && cell ? <span className={`vs-cat-tag ${cell.replace(/\s/g, '\\ ')}`}>{cell}</span> : cell || '—')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tech Stack */}
          <div className="vs-idea-section">
            <h3>Tech Stack</h3>
            <table className="vs-table">
              <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                <tr>
                  <td>Detected</td>
                  <td>{(result.a.techStack || []).length ? result.a.techStack.map(t => <span key={t} className="vs-tech-badge">{t}</span>) : '—'}</td>
                  <td>{(result.b.techStack || []).length ? result.b.techStack.map(t => <span key={t} className="vs-tech-badge">{t}</span>) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HTTP */}
          <div className="vs-idea-section">
            <h3>HTTP · Server</h3>
            <table className="vs-table">
              <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                {[
                  ['Status', result.a.http?.status, result.b.http?.status],
                  ['Server', result.a.http?.headers?.server, result.b.http?.headers?.server],
                  ['Content-Type', result.a.http?.headers?.['content-type']?.split(';')[0], result.b.http?.headers?.['content-type']?.split(';')[0]],
                ].map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell || '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Open Graph */}
          <div className="vs-idea-section">
            <h3>Open Graph · Meta</h3>
            <table className="vs-table">
              <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                {[
                  ['og:title', result.a.metas?.['og:title'] || result.a.metas?.['twitter:title'], result.b.metas?.['og:title'] || result.b.metas?.['twitter:title']],
                  ['og:description', result.a.metas?.['og:description'] || result.a.metas?.['twitter:description'], result.b.metas?.['og:description'] || result.b.metas?.['twitter:description']],
                  ['og:image', result.a.metas?.['og:image'] || result.a.social?.image, result.b.metas?.['og:image'] || result.b.social?.image],
                  ['og:site_name', result.a.metas?.['og:site_name'], result.b.metas?.['og:site_name']],
                  ['twitter:card', result.a.metas?.['twitter:card'], result.b.metas?.['twitter:card']],
                  ['fb:app_id', result.a.metas?.['fb:app_id'], result.b.metas?.['fb:app_id']],
                ].map((row, ri) => (
                  <tr key={ri}>
                    <td>{row[0]}</td>
                    <td>{row[0] === 'og:image' && row[1] && row[1] !== '—' ? <img src={row[1]} alt="" style={{ maxWidth: '100px', maxHeight: '50px', borderRadius: '4px' }} /> : (row[1] && row[1].length > 60 ? row[1].slice(0, 60) + '…' : row[1] || '—')}</td>
                    <td>{row[0] === 'og:image' && row[2] && row[2] !== '—' ? <img src={row[2]} alt="" style={{ maxWidth: '100px', maxHeight: '50px', borderRadius: '4px' }} /> : (row[2] && row[2].length > 60 ? row[2].slice(0, 60) + '…' : row[2] || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance */}
          <div className="vs-idea-section">
            <h3>Performance Hints</h3>
            <table className="vs-table">
              <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                {[
                  ['Preloads', result.a.perf?.preloads, result.b.perf?.preloads],
                  ['Preconnects', result.a.perf?.preconnects, result.b.perf?.preconnects],
                  ['Stylesheets', result.a.perf?.stylesheets, result.b.perf?.stylesheets],
                  ['Lazy Images', result.a.perf?.lazyImages, result.b.perf?.lazyImages],
                  ['Total Scripts', result.a.perf?.totalScripts, result.b.perf?.totalScripts],
                  ['Has Viewport Meta', result.a.perf?.hasViewport ? '✓' : '✗', result.b.perf?.hasViewport ? '✓' : '✗'],
                  ['Has Description', result.a.perf?.hasDescription ? '✓' : '✗', result.b.perf?.hasDescription ? '✓' : '✗'],
                  ['Has Favicon', result.a.perf?.hasIcon ? '✓' : '✗', result.b.perf?.hasIcon ? '✓' : '✗'],
                ].map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell != null ? String(cell) : '—'}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Feature Matrix */}
          <div className="vs-idea-section">
            <h3>Feature Matrix</h3>
            <table className="vs-table">
              <thead><tr><th>Feature</th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
              <tbody>
                {[
                  ['HTTPS', result.a.http?.url?.startsWith('https'), result.b.http?.url?.startsWith('https')],
                  ['Valid SSL', result.a.http?.status >= 200 && result.a.http?.status < 400, result.b.http?.status >= 200 && result.b.http?.status < 400],
                  ['Open Graph', !!result.a.metas?.['og:title'], !!result.b.metas?.['og:title']],
                  ['Twitter Cards', !!result.a.metas?.['twitter:card'], !!result.b.metas?.['twitter:card']],
                  ['Sitemap', !!(result.a.metas || result.a.social), !!(result.b.metas || result.b.social)],
                  ['Description Meta', !!result.a.description, !!result.b.description],
                  ['Viewport Meta', result.a.perf?.hasViewport, result.b.perf?.hasViewport],
                  ['Lazy Loading', (result.a.perf?.lazyImages || 0) > 0, (result.b.perf?.lazyImages || 0) > 0],
                  ['Preload Hints', (result.a.perf?.preloads || 0) > 0, (result.b.perf?.preloads || 0) > 0],
                  ['Service Worker', (result.a.techStack || []).some(t => t.toLowerCase().includes('service')), (result.b.techStack || []).some(t => t.toLowerCase().includes('service'))],
                ].map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{ci === 0 ? cell : (cell ? '✓' : '✗')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* GitHub */}
          {(result.a.github || result.b.github) ? (
            <div className="vs-idea-section">
              <h3>GitHub Repo</h3>
              <table className="vs-table">
                <thead><tr><th></th><th>{labelName(urlA)}</th><th>{labelName(urlB)}</th></tr></thead>
                <tbody>
                  {[
                    ['Repo', result.a.github?.fullName || result.a.github?.url, result.b.github?.fullName || result.b.github?.url],
                    ['Stars', result.a.github?.stars, result.b.github?.stars],
                    ['Language', result.a.github?.language, result.b.github?.language],
                    ['Last Push', result.a.github?.pushedAt, result.b.github?.pushedAt],
                    ['License', result.a.github?.license, result.b.github?.license],
                  ].map((row, ri) => (
                    <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{ci === 0 ? cell : (cell != null ? String(cell) : '—')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Pricing */}
          {(result.a.pricing || result.b.pricing) ? (
            <div className="vs-idea-section">
              <h3>Pricing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="vs-pricing-card">
                  <h4>{labelName(urlA)}</h4>
                  <table><tbody>
                    {(result.a.pricing || ['—']).slice(0, 6).map((p, i) => <tr key={i}><td>{p}</td></tr>)}
                  </tbody></table>
                </div>
                <div className="vs-pricing-card">
                  <h4>{labelName(urlB)}</h4>
                  <table><tbody>
                    {(result.b.pricing || ['—']).slice(0, 6).map((p, i) => <tr key={i}><td>{p}</td></tr>)}
                  </tbody></table>
                </div>
              </div>
            </div>
          ) : null}

          <div className="vs-footer-note">
            Generated with WhoVSWho · {new Date(result.time).toLocaleDateString()}
          </div>
        </>
      )}
    </div>
  );
}

