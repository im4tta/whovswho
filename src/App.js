import React, { useState, useCallback, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

import { HISTORY_KEY, THEME_KEY, HISTORY_LIMIT, SUGGESTIONS, isHostingSubdomain, MODULE_COUNT } from './lib/constants';
import { cleanDomain, stripTrailingDots, hasTld } from './lib/domain';
import { extractDomainData } from './lib/whois';
import {
  fetchWhois, fetchAllDNS, fetchSubdomains, fetchWayback, fetchHTTP,
  fetchSocial, fetchSitemap, fetchRobots, fetchSecurityTxt, fetchIpGeo,
  fetchSSL, fetchRedirects, fetchGeoDetailed, exportViaSone,
} from './lib/api';

import I from './components/icons';
import LiveBg from './components/LiveBg';
import DomainCard from './components/DomainCard';
import RawModal from './components/RawModal';
import DiffPanel from './components/DiffPanel';
import VsIdeaCard from './components/VsIdeaCard';

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  });
  const [domainA, setDomainA] = useState('');
  const [domainB, setDomainB] = useState('');
  const [focusA, setFocusA] = useState(false);
  const [focusB, setFocusB] = useState(false);
  const [resultA, setResultA] = useState(null);
  const [resultB, setResultB] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [rawOpen, setRawOpen] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [vsScanTrigger, setVsScanTrigger] = useState(0);
  const resultsRef = useRef(null);
  const flipRef = useRef(null);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const a = p.get('a'); const b = p.get('b');
    if (a && b) {
      setDomainA(a); setDomainB(b);
      setTimeout(() => doCompare(a, b, true), 80);
    }
    // eslint-disable-next-line
  }, []);

  // Auto-run VS Compare silently when domain compare completes
  useEffect(() => {
    if (!loading && resultA && resultB && !resultA.error && !resultB.error) {
      setVsScanTrigger((t) => t + 1);
    }
    // eslint-disable-next-line
  }, [loading, resultA, resultB]);

  const onToggleFlip = () => {
    if (!flipped) setVsScanTrigger((t) => t + 1);
    setFlipped((f) => !f);
  };

  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCompare(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [domainA, domainB]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const pushHistory = (a, b) => {
    const key = `${a}__${b}`;
    const next = [{ a, b, t: Date.now() }, ...history.filter((h) => `${h.a}__${h.b}` !== key)].slice(0, HISTORY_LIMIT);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const fetchAll = async (domain) => {
    const hosting = isHostingSubdomain(domain);
    const whoisP = hosting
      ? Promise.resolve(null)
      : fetchWhois(domain).catch((e) => { throw new Error(`WHOIS: ${e.message}`); });
    const dnsP = fetchAllDNS(domain);
    const subsP = fetchSubdomains(domain);
    const waybackP = fetchWayback(domain);
    const httpP = fetchHTTP(domain);
    const socialP = fetchSocial(domain);
    const sitemapP = fetchSitemap(domain);
    const robotsP = fetchRobots(domain);
    const secP = fetchSecurityTxt(domain);
    const sslP = fetchSSL(domain);
    const redirectsP = fetchRedirects(domain);

    const [whois, dns, subs, wayback, http, social, sitemap, robots, sec, ssl, redirects] = await Promise.all([
      whoisP, dnsP, subsP, waybackP, httpP, socialP, sitemapP, robotsP, secP, sslP, redirectsP,
    ]);
    const ip = dns?.A?.[0] || null;
    let geo = await fetchIpGeo(ip);
    if (ip) {
      const detailed = await fetchGeoDetailed(ip);
      if (detailed) geo = { ...geo, ...detailed };
    }
    return {
      domain, whois, dns, ip, geo, subs, wayback, http, social, sitemap, robots, sec, ssl, redirects,
      hostingSubdomain: hosting || undefined,
    };
  };

  const doCompare = useCallback(async (aIn, bIn, silent = false) => {
    const a = cleanDomain(aIn ?? domainA);
    const b = cleanDomain(bIn ?? domainB);
    if (!a || !b) { if (!silent) setError('Please enter two domains to compare.'); return; }
    setError(''); setLoading(true);
    setResultA({ domain: a, loading: true });
    setResultB({ domain: b, loading: true });
    pushHistory(a, b);
    const url = new URL(window.location.href);
    url.searchParams.set('a', a); url.searchParams.set('b', b);
    window.history.replaceState({}, '', url.toString());

    const [rA, rB] = await Promise.allSettled([
      fetchAll(a),
      fetchAll(b),
    ]);
    setResultA(rA.status === 'fulfilled' ? rA.value : { domain: a, error: rA.reason?.message || 'Failed' });
    setResultB(rB.status === 'fulfilled' ? rB.value : { domain: b, error: rB.reason?.message || 'Failed' });
    setLoading(false);
    // eslint-disable-next-line
  }, [domainA, domainB, history]);

  const toDataUrl = async (url) => {
    try {
      // Try direct fetch first (for same-origin or CORS-enabled images)
      let r = await fetch(url);
      if (!r.ok) throw new Error('Direct fetch failed');
      const blob = await r.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      // If direct fetch fails, try using the proxy for external images
      try {
        const r = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
        if (r.ok) {
          const blob = await r.blob();
          return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        }
      } catch {}
      return null;
    }
  };

  const captureElement = async (el, name) => {
    if (!el) return;
    const images = el.querySelectorAll('img');
    const restore = [];
    for (const img of images) {
      if (img.src && !img.src.startsWith('data:')) {
        const dataUrl = await toDataUrl(img.src);
        if (dataUrl) {
          restore.push({ img, original: img.src });
          img.src = dataUrl;
        }
      }
    }

    await Promise.all(Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
        setTimeout(resolve, 3000);
      });
    }));

    const canvas = await html2canvas(el, {
      backgroundColor: theme === 'dark' ? '#07070b' : '#f3f3f8',
      scale: 2,
      logging: false,
      timeout: 20000,
      removeContainer: true,
      useCORS: true,
    });

    for (const { img, original } of restore) img.src = original;

    const link = document.createElement('a');
    link.download = `${name}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 0.95);
    link.click();
  };

  const onScreenshot = async () => {
    if (!bothLoaded) return;
    try {
      showToast('Generating image…');
      const payload = {
        type: 'domain-compare',
        theme,
        domainA: resultA.domain,
        domainB: resultB.domain,
        dataA: extractDomainData(resultA),
        dataB: extractDomainData(resultB),
      };
      await exportViaSone(payload, `domain-compare-${resultA.domain}-vs-${resultB.domain}.png`);
      showToast('Screenshot saved');
    } catch (err) {
      console.error('SONE export failed:', err);
      showToast('Server export failed, trying local fallback…');
      try {
        const container = flipRef.current;
        const el = container?.querySelector('.flip-front');
        if (el) await captureElement(el, 'domain-compare');
        showToast('Screenshot saved');
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
        showToast('Screenshot failed');
      }
    }
  };

  const onCopyJson = async () => {
    if (!resultA?.whois || !resultB?.whois) return;
    const data = { a: resultA, b: resultB };
    try { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); showToast('JSON copied'); }
    catch { showToast('Copy failed'); }
  };

  const onExportJson = () => {
    if (!resultA?.whois || !resultB?.whois) return;
    const data = { a: resultA, b: resultB };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `domain-compare-${resultA.domain}-vs-${resultB.domain}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applySuggestion = (sugg, target) => {
    const raw = target === 'a' ? domainA : domainB;
    const value = stripTrailingDots(raw) + sugg;
    if (target === 'a') setDomainA(value); else setDomainB(value);
  };

  const showSuggestA = focusA && domainA && (!hasTld(domainA) || domainA.endsWith('.')) && domainA.length > 1;
  const showSuggestB = focusB && domainB && (!hasTld(domainB) || domainB.endsWith('.')) && domainB.length > 1;
  const hasResults = !!(resultA || resultB);
  const bothLoaded = resultA && resultB && !resultA.loading && !resultB.loading && (resultA.whois || resultA.hostingSubdomain) && (resultB.whois || resultB.hostingSubdomain);

  return (
    <>
      <LiveBg />
      <div className="scanline" />
      <div className="app">
        <header className="header">
          <div className="brand">
            <h1>Domain Compare</h1>
            <p>WHOIS · DNS · HTTP · Social · Sitemap · Subdomains · Archives</p>
          </div>
          <div className="toolbar">
            <button
              className="icon-btn"
              title={flipped ? 'Show domain results' : 'Show VS Compare'}
              onClick={onToggleFlip}
              aria-label="Toggle VS Compare"
              style={{ color: flipped ? 'var(--accent)' : undefined }}
            >
              {I.grid}
            </button>
            <button
              className="icon-btn"
              title="Toggle theme"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? I.sun : I.moon}
            </button>
          </div>
        </header>

        <main className="main-content">

        <div className={`bento input-bento anim-in${showSuggestA || showSuggestB ? ' suggest-open' : ''}`} style={{ '--i': 0 }}>
          <div className="input-row">
            <div className="input-group">
              <label>Domain A</label>
              <input value={domainA} onChange={(e) => setDomainA(e.target.value)}
                onFocus={() => setFocusA(true)} onBlur={() => setTimeout(() => setFocusA(false), 150)}
                placeholder="e.g. github.com" spellCheck={false} autoComplete="off" />
              {showSuggestA && (
                <div className="suggest">
                  {SUGGESTIONS.map((s) => (
                    <span key={s} className="suggest-item" onMouseDown={() => applySuggestion(s, 'a')}>
                      {stripTrailingDots(domainA)}{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="vs-divider"><span className="vs-badge">VS</span></div>
            <div className="input-group">
              <label>Domain B</label>
              <input value={domainB} onChange={(e) => setDomainB(e.target.value)}
                onFocus={() => setFocusB(true)} onBlur={() => setTimeout(() => setFocusB(false), 150)}
                placeholder="e.g. gitlab.com" spellCheck={false} autoComplete="off" />
              {showSuggestB && (
                <div className="suggest">
                  {SUGGESTIONS.map((s) => (
                    <span key={s} className="suggest-item" onMouseDown={() => applySuggestion(s, 'b')}>
                      {stripTrailingDots(domainB)}{s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="input-actions">
            <button className="btn btn-primary" onClick={() => doCompare()} disabled={loading}>
              {I.arrow}{loading ? 'Scanning…' : 'Compare'}
              <span className="kbd">Ctrl+↵</span>
            </button>
            <span className="helper">{MODULE_COUNT} modules · parallel fetch</span>
          </div>
        </div>

        {error && <div className="error-bar">{error}</div>}

        {history.length > 0 && (
          <div className="history anim-in" style={{ '--i': 1 }}>
            <span className="history-label">Recent</span>
            {history.map((h, i) => (
              <span key={i} className="history-chip" onClick={() => { setDomainA(h.a); setDomainB(h.b); setTimeout(() => doCompare(h.a, h.b, true), 50); }}>
                {h.a} <span className="vs">vs</span> {h.b}
                <span className="x" onClick={(e) => {
                  e.stopPropagation();
                  const next = history.filter((x) => !(x.a === h.a && x.b === h.b));
                  setHistory(next); localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
                }}>×</span>
              </span>
            ))}
            <button className="history-clear" onClick={() => { setHistory([]); localStorage.setItem(HISTORY_KEY, '[]'); }}>Clear</button>
          </div>
        )}

        <div ref={resultsRef}>
          {!hasResults && (
            <div className="bento anim-in" style={{ '--i': 1, padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem', opacity: 0.4 }}>⚡</div>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.08em' }}>Enter two domains to start the scan</p>
            </div>
          )}

          {hasResults && (
            <div className="flip-container" ref={flipRef}>
              <div className={`flip-inner${flipped ? ' flipped' : ''}`}>
                <div className="flip-front">
                  <div className="results-wrap">
                    <div className="results-header">
                      <h2>Scan Results</h2>
                      <div className="results-actions">
                        <button className="btn btn-ghost btn-sm" onClick={onCopyJson} disabled={!bothLoaded}>{I.copy} Copy</button>
                        <button className="btn btn-ghost btn-sm" onClick={onExportJson} disabled={!bothLoaded}>{I.dl} Export</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRawOpen('a')} disabled={!resultA?.whois}>JSON · A</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRawOpen('b')} disabled={!resultB?.whois}>JSON · B</button>
                        <button className="btn btn-ghost btn-sm" onClick={onScreenshot} disabled={!bothLoaded}>{I.cam} Screenshot</button>
                      </div>
                    </div>

                    <div className="compare-grid">
                      <DomainCard result={resultA} side="a" idx={0} />
                      <DomainCard result={resultB} side="b" idx={1} />
                    </div>

                    {bothLoaded && <DiffPanel a={resultA} b={resultB} />}
                  </div>
                </div>
                <div className="flip-back">
                  <VsIdeaCard theme={theme} domainA={domainA} domainB={domainB} scanTrigger={vsScanTrigger} />
                </div>
              </div>
            </div>
          )}
        </div>

        <RawModal result={rawOpen === 'a' ? resultA : resultB} open={!!rawOpen} onClose={() => setRawOpen(null)} />

        {toast && <div className="toast">{toast}</div>}

        <button className={`top-btn${showTopBtn ? ' visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Go to top">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>

        </main>

        <footer className="footer anim-in" style={{ '--i': 5 }}>
          <div className="footer-content">
            <p className="footer-desc">
              A simple tool to compare WHOIS, DNS, HTTP, and other info for two domains side-by-side.
            </p>
            <a className="footer-link" href="https://github.com/im4tta/whovswho" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Open source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
