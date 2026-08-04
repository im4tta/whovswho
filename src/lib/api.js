// Every network call the app makes: WHOIS, DNS-over-HTTPS, certificate-transparency
// subdomain lookup, Wayback Machine, and the CORS proxy used for HTTP/social/sitemap/
// robots/security.txt/page-meta fetches, plus the PNG export call to /api/export.
import { WHOIS_API, DOH, WAYBACK, CRT, PROXIES, SECURITY_API, SSL_API, REDIRECTS_API, LOCATION_API } from './constants';
import { detectTech, detectCategory } from './detect';

export async function fetchViaProxy(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url));
      if (r.ok) {
        const text = await r.text();
        if (text && text.length > 10) return text;
      }
    } catch {}
  }
  return null;
}

export async function fetchWhois(domain) {
  const raw = await fetchViaProxy(`${WHOIS_API}${domain}`);
  if (!raw) throw new Error('WHOIS API unreachable (CORS or network error)');
  try { return JSON.parse(raw); }
  catch { throw new Error('WHOIS: invalid response'); }
}

export async function fetchDNSRecord(domain, type) {
  try {
    const r = await fetch(`${DOH}?name=${encodeURIComponent(domain)}&type=${type}`);
    if (!r.ok) return [];
    const j = await r.json();
    return (j.Answer || []).map((a) => a.data).filter(Boolean);
  } catch { return []; }
}

export async function fetchAllDNS(domain) {
  const [a, aaaa, ns, mx, txt, caa, soa] = await Promise.all([
    fetchDNSRecord(domain, 'A'),
    fetchDNSRecord(domain, 'AAAA'),
    fetchDNSRecord(domain, 'NS'),
    fetchDNSRecord(domain, 'MX'),
    fetchDNSRecord(domain, 'TXT'),
    fetchDNSRecord(domain, 'CAA'),
    fetchDNSRecord(domain, 'SOA'),
  ]);
  return { A: a, AAAA: aaaa, NS: ns, MX: mx, TXT: txt, CAA: caa, SOA: soa };
}

export async function fetchSubdomains(domain) {
  // crt.sh doesn't support CORS, route through a proxy
  try {
    const raw = await fetchViaProxy(`${CRT}?q=${encodeURIComponent('%.' + domain)}&output=json`);
    if (!raw) return [];
    const j = JSON.parse(raw);
    const set = new Set();
    j.forEach((e) => (e.name_value || '').split('\n').forEach((n) => {
      n = n.trim().toLowerCase();
      if (n.endsWith('.' + domain) || n === domain) set.add(n);
    }));
    return Array.from(set).sort().slice(0, 40);
  } catch { return []; }
}

export async function fetchWayback(domain) {
  try {
    const r = await fetch(`${WAYBACK}?url=${encodeURIComponent(domain)}`);
    if (!r.ok) return null;
    const j = await r.json();
    return j.archived_snapshots?.closest || null;
  } catch { return null; }
}

/** Real HTTP status + response headers, fetched server-side (redirect:manual)
 *  so HSTS/CSP/etc. detection reflects the actual site instead of a guess. */
export async function fetchHTTP(domain) {
  const target = `https://${domain}`;
  try {
    const r = await fetch(`${SECURITY_API}?url=${encodeURIComponent(target)}`);
    if (!r.ok) throw new Error(`security api ${r.status}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    return { status: data.status, statusText: data.statusText, headers: data.headers || {}, url: data.url, waf: data.waf || null };
  } catch {
    // Fall back to a reachability-only check if /api/security isn't available
    // (e.g. running `npm start` without `vercel dev`).
    const proxied = await fetchViaProxy(target);
    if (!proxied) return null;
    return { status: 'CORS-blocked', headers: {}, via: 'proxy' };
  }
}

/** TLS certificate details (issuer, validity window, protocol/cipher) via ssl-checker. */
export async function fetchSSL(domain) {
  try {
    const r = await fetch(`${SSL_API}?host=${encodeURIComponent(domain)}`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.error ? null : data;
  } catch { return null; }
}

/** Full HTTP redirect chain (up to 20 hops), fetched server-side to dodge CORS. */
export async function fetchRedirects(domain) {
  try {
    const r = await fetch(`${REDIRECTS_API}?url=${encodeURIComponent(`https://${domain}`)}`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.error ? null : data;
  } catch { return null; }
}

/** Richer IP geolocation (ASN, timezone, currency) via ipapi.co, proxied server-side. */
export async function fetchGeoDetailed(ip) {
  if (!ip) return null;
  try {
    const r = await fetch(`${LOCATION_API}?ip=${encodeURIComponent(ip)}`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.error ? null : data;
  } catch { return null; }
}

export async function fetchSocial(domain) {
  const target = `https://${domain}`;
  const html = await fetchViaProxy(target);
  if (!html) return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const get = (sel, attr = 'content') => doc.querySelector(sel)?.getAttribute(attr);
  const og = (p) => get(`meta[property="og:${p}"]`) || get(`meta[name="og:${p}"]`);
  const tw = (p) => get(`meta[name="twitter:${p}"]`) || get(`meta[property="twitter:${p}"]`);
  return {
    title: og('title') || tw('title') || doc.querySelector('title')?.textContent || null,
    description: og('description') || tw('description') || get('meta[name="description"]') || null,
    image: og('image') || tw('image') || null,
    type: og('type') || null,
    siteName: og('site_name') || null,
  };
}

export async function fetchSitemap(domain) {
  const target = `https://${domain}/sitemap.xml`;
  const xml = await fetchViaProxy(target);
  if (!xml) return null;
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const urls = Array.from(doc.querySelectorAll('url > loc, sitemap > loc')).map((n) => n.textContent.trim());
    return urls.slice(0, 30);
  } catch { return null; }
}

export async function fetchRobots(domain) {
  const target = `https://${domain}/robots.txt`;
  return (await fetchViaProxy(target)) || null;
}

export async function fetchSecurityTxt(domain) {
  const target = `https://${domain}/.well-known/security.txt`;
  return (await fetchViaProxy(target)) || null;
}

export async function fetchIpGeo(ip) {
  if (!ip) return null;
  try {
    const r = await fetch(`https://ipinfo.io/${ip}/json`);
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

/** Renders the export payload to a PNG via the server-side SONE layout engine. */
export const exportViaSone = async (payload, fileName) => {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/** Fetches and analyzes a domain's homepage for the VS-Compare tab: tech stack,
 *  category, GitHub repo info (if linked), and rough pricing text extraction. */
export async function fetchPageMeta(domain) {
  const social = await fetchSocial(domain);
  const http = await fetchHTTP(domain);
  const html = await fetchViaProxy(`https://${domain}`);
  const pricingHtml = await fetchViaProxy(`https://${domain}/pricing`).catch(() => null);
  let title = null, desc = null, metas = {}, scripts = [], links = [], github = null, pricing = null, perf = {};

  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      title = doc.querySelector('title')?.textContent || null;
      desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || social?.description || null;

      doc.querySelectorAll('meta').forEach((m) => {
        const key = m.getAttribute('name') || m.getAttribute('property') || '';
        if (key) metas[key] = m.getAttribute('content') || '';
      });

      doc.querySelectorAll('script[src]').forEach((s) => { const src = s.getAttribute('src'); if (src) scripts.push(src); });

      doc.querySelectorAll('link[rel][href]').forEach((l) => links.push({ rel: l.getAttribute('rel'), href: l.getAttribute('href') }));

      const ghEl = doc.querySelector('a[href*="github.com"][href*="/"]');
      if (ghEl) {
        const m = ghEl.getAttribute('href')?.match(/github\.com\/([^/]+\/[^/#?]+)/);
        if (m) github = m[1].replace(/\/$/, '');
      }

      perf = {
        preloads: doc.querySelectorAll('link[rel="preload"]').length,
        preconnects: doc.querySelectorAll('link[rel="preconnect"]').length,
        stylesheets: doc.querySelectorAll('link[rel="stylesheet"]').length,
        lazyImages: doc.querySelectorAll('img[loading="lazy"]').length,
        totalScripts: doc.querySelectorAll('script').length,
        hasViewport: !!doc.querySelector('meta[name="viewport"]'),
        hasDescription: !!desc,
        hasIcon: !!(doc.querySelector('link[rel="icon"]') || doc.querySelector('link[rel="shortcut icon"]')),
      };
    } catch {}
  }

  const techStack = detectTech(html, http, scripts);
  const category = detectCategory(title, desc);

  // GitHub data
  if (github) {
    try {
      const ghRes = await fetchViaProxy(`https://api.github.com/repos/${github}`);
      if (ghRes) {
        const d = JSON.parse(ghRes);
        github = { fullName: d.full_name, stars: d.stargazers_count, language: d.language, pushedAt: d.pushed_at, license: d.license?.spdx_id, description: d.description, url: d.html_url };
      }
    } catch { github = { fullName: github, url: `https://github.com/${github}` }; }
  }

  // Pricing
  if (pricingHtml) {
    try {
      const doc = new DOMParser().parseFromString(pricingHtml, 'text/html');
      const text = doc.body?.textContent || '';
      const prices = [...new Set(text.match(/\$\d+(?:\.\d{2})?(?:\s*\/\s*(?:month|year|mo|yr))?/gi) || [])];
      if (prices.length) pricing = prices.slice(0, 8);
    } catch {}
  }

  return { domain, title, description: desc, social, http, metas, techStack, category, github, pricing, perf };
}
