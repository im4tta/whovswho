import { Column, Row, Text, Span, Photo } from 'sone';

const DARK = {
  BG_MAIN: '#07070b',
  SURFACE: 'rgba(255,255,255,0.04)',
  SURFACE_2: 'rgba(255,255,255,0.07)',
  TEXT: '#e6e6f0',
  MUTED: '#7d7d96',
  MUTED_DIM: 'rgba(230,230,240,0.35)',
  ACCENT: '#00ff95',
  ACCENT2: '#ff3d6e',
  ACCENT3: '#4aa8ff',
  BORDER: 'rgba(255,255,255,0.08)',
  BORDER_STRONG: 'rgba(255,255,255,0.16)',
  WARN: '#ffb300',
  GOOD: '#00ff95',
  BAD: '#ff3d6e',
};

const LIGHT = {
  BG_MAIN: '#f3f3f8',
  SURFACE: 'rgba(255,255,255,0.7)',
  SURFACE_2: '#ffffff',
  TEXT: '#1a1a2e',
  MUTED: '#6b6b80',
  MUTED_DIM: 'rgba(26,26,46,0.35)',
  ACCENT: '#008a5c',
  ACCENT2: '#c41e4a',
  ACCENT3: '#1a73e8',
  BORDER: 'rgba(0,0,0,0.08)',
  BORDER_STRONG: 'rgba(0,0,0,0.16)',
  WARN: '#b8860b',
  GOOD: '#008a5c',
  BAD: '#c41e4a',
};

function C(theme) {
  return theme === 'light' ? LIGHT : DARK;
}

function fmtDate(s) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return String(s); }
}

function badge(label, color, bg) {
  return Text(label).font('JetBrainsMono').size(10).weight('bold').color(color).padding(3, 8).bg(bg).rounded(999);
}

function sectionTitle(text, t) {
  return Text(text).font('ChakraPetch').size(13).weight('bold').color(t.MUTED).padding(0, 0, 6, 0);
}

function sectionSep(t) {
  return Column().height(1).bg(t.BORDER).width('100%').padding(4, 0);
}

function metaBlock(label, value, color, t) {
  return Column(
    Text(label).font('JetBrainsMono').size(10).color(t.MUTED).weight('bold').letterSpacing(0.5),
    Text(String(value ?? '—')).font('NotoSansKhmer').size(13).color(color || t.TEXT).lineHeight(1.4),
  ).gap(2).padding(10).bg(t.SURFACE).rounded(12).borderWidth(1).borderColor(t.BORDER).flex(1);
}

function labelText(s, size, color, opts = {}) {
  let n = Text(String(s)).font('JetBrainsMono').size(size).color(color);
  if (opts.bold) n = n.weight('bold');
  if (opts.lineHeight) n = n.lineHeight(opts.lineHeight);
  if (opts.letterSpacing) n = n.letterSpacing(opts.letterSpacing);
  return n;
}

function dataText(s, size, color, opts = {}) {
  let n = Text(String(s ?? '—')).font('NotoSansKhmer').size(size).color(color);
  if (opts.bold) n = n.weight('bold');
  if (opts.lineHeight) n = n.lineHeight(opts.lineHeight);
  return n;
}

function tableRow(label, valA, valB, t) {
  return Row(
    labelText(label, 10, t.MUTED).width(100),
    dataText(valA != null ? String(valA) : '—', 11, t.TEXT, { lineHeight: 1.5 }).flex(1),
    dataText(valB != null ? String(valB) : '—', 11, t.TEXT, { lineHeight: 1.5 }).flex(1),
  ).gap(8).padding(5, 0).borderWidth(0, 0, 1, 0).borderColor(t.BORDER).alignItems('flex-start');
}

function poweredBySone(t) {
  return Text('Powered by SONE').font('JetBrainsMono').size(9).color(t.MUTED_DIM).align('right');
}

function footerRow(t) {
  return Row(
    Text('Generated with WhoVsWho').font('JetBrainsMono').size(10).color(t.MUTED_DIM).flex(1),
    Column(
      Text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }))
        .font('JetBrainsMono').size(10).color(t.MUTED_DIM),
      poweredBySone(t),
    ).gap(2).alignItems('end'),
  ).padding(12, 0, 0, 0);
}

function domainSection(label, children, t) {
  return Column(sectionTitle(label, t), ...children).gap(0).padding(16, 0, 0, 0);
}

function whoisSection(data, t) {
  if (!data) return null;
  const items = [
    ['Registrar', data.registrar],
    ['Created', data.created ? fmtDate(data.created) : null],
    ['Updated', data.updated ? fmtDate(data.updated) : null],
    ['Expires', data.expires ? fmtDate(data.expires) : null],
    ['DNSSEC', data.dnssec],
    ['Organization', data.org],
  ].filter(([, v]) => v != null);

  return Column(
    ...items.map(([label, val]) =>
      Row(labelText(label, 10, t.MUTED).width(90), dataText(val, 11, t.TEXT, { lineHeight: 1.6 })).gap(6),
    ),
    ...(data.nameservers?.length ? [
      Row(
        labelText('NS', 10, t.MUTED).width(90),
        Column(
          ...data.nameservers.map(ns =>
            Row(
              dataText(ns.name, 10, t.TEXT),
              ns.ipv4 ? dataText(ns.ipv4, 9, t.MUTED_DIM) : null,
            ).gap(6).alignItems('center'),
          ),
        ).gap(2).flex(1),
      ).gap(6).padding(4, 0),
    ] : []),
    ...(data.statuses?.length ? [
      Row(
        labelText('Status', 10, t.MUTED).width(90),
        Row(
          ...data.statuses.map(s =>
            labelText((String(s).split(' ')[0] || s).slice(0, 18), 9, t.MUTED).padding(2, 6).bg(t.SURFACE).rounded(4),
          ),
        ).gap(4).flex(1).wrap('wrap'),
      ).gap(6),
    ] : []),
  ).gap(3);
}

function dnsSection(dns, t) {
  if (!dns) return null;
  const entries = Object.entries(dns).filter(([, vals]) => vals?.length);
  if (!entries.length) return null;
  return Column(
    ...entries.map(([type, vals]) =>
      Column(
        labelText(type, 10, t.ACCENT3, { bold: true, letterSpacing: 1 }),
        ...vals.map(v => dataText(v, 10, t.TEXT, { lineHeight: 1.5 })),
      ).gap(1).padding(0, 0, 6, 0),
    ),
  ).gap(2);
}

function httpSection(http, t) {
  if (!http) return null;
  const status = http.status;
  const statusClass = status >= 200 && status < 400 ? t.GOOD : t.BAD;
  const headers = http.headers || {};
  const hasHsts = !!headers['strict-transport-security'];
  const hasCsp = !!headers['content-security-policy'];
  const hasXfo = !!headers['x-frame-options'];
  const hasXss = !!headers['x-xss-protection'];

  const secBadges = [];
  if (status != null) secBadges.push(badge(String(status), statusClass, `${statusClass}22`));
  if (hasHsts) secBadges.push(badge('HSTS', t.GOOD, `${t.GOOD}22`));
  if (hasCsp) secBadges.push(badge('CSP', t.GOOD, `${t.GOOD}22`));
  if (hasXfo) secBadges.push(badge('XFO', t.GOOD, `${t.GOOD}22`));
  if (hasXss) secBadges.push(badge('XSS', t.GOOD, `${t.GOOD}22`));
  if (!hasHsts && !hasCsp) secBadges.push(badge('Weak Security', t.BAD, `${t.BAD}22`));

  return Column(
    ...(status != null ? [Row(labelText('HTTP', 10, t.MUTED).width(80), dataText(`${status} ${http.statusText || ''}`, 11, statusClass)).gap(6)] : []),
    ...(headers.server ? [Row(labelText('Server', 10, t.MUTED).width(80), dataText(String(headers.server), 11, t.TEXT)).gap(6)] : []),
    ...(headers['content-type'] ? [Row(labelText('Type', 10, t.MUTED).width(80), dataText(String(headers['content-type']).split(';')[0], 11, t.TEXT)).gap(6)] : []),
    ...(secBadges.length ? [Row(...secBadges).gap(6).wrap('wrap')] : []),
  ).gap(4);
}

function socialSection(social, t) {
  if (!social) return null;
  return Column(
    ...(social.title ? [dataText(social.title, 14, t.TEXT, { bold: true, lineHeight: 1.3 }).font('NotoSansKhmer')] : []),
    ...(social.description ? [dataText(social.description, 10, t.MUTED, { lineHeight: 1.5 })] : []),
    ...(social.siteName ? [dataText(social.siteName, 9, t.MUTED_DIM)] : []),
  ).gap(4).padding(12).bg(t.SURFACE).rounded(12).borderWidth(1).borderColor(t.BORDER);
}

function listSection(items, t) {
  if (!items?.length) return null;
  return Column(
    ...items.map(item => dataText(String(item), 9, t.TEXT, { lineHeight: 1.5 }).padding(2, 0)),
  ).gap(1);
}

function boolText(val, yesColor, noColor) {
  return Text(val ? 'YES' : 'NO').font('JetBrainsMono').size(10).weight('bold').color(val ? yesColor : noColor);
}

function vsHeaderRow(label, valA, valB, t, colorA, colorB, labelWidth) {
  return Row(
    labelText(label || '', 10, t.MUTED).width(labelWidth || 100),
    typeof valA === 'string' ? dataText(valA, 12, colorA, { bold: true }).flex(1) : (valA ? valA.flex(1) : Column().flex(1)),
    typeof valB === 'string' ? dataText(valB, 12, colorB, { bold: true }).flex(1) : (valB ? valB.flex(1) : Column().flex(1)),
  ).gap(8).padding(5, 0).borderWidth(0, 0, 1, 0).borderColor(t.BORDER_STRONG).alignItems('stretch');
}

function sideBySideRow(label, valA, valB, t) {
  const same = String(valA ?? '—') === String(valB ?? '—');
  return Row(
    labelText(label, 9, t.MUTED).width(100),
    dataText(valA != null ? String(valA) : '—', 10, same ? t.MUTED_DIM : t.ACCENT, { lineHeight: 1.5 }).flex(1),
    dataText(valB != null ? String(valB) : '—', 10, same ? t.MUTED_DIM : t.ACCENT3, { lineHeight: 1.5 }).flex(1),
  ).gap(8).padding(4, 0).borderWidth(0, 0, 1, 0).borderColor(t.BORDER).alignItems('flex-start');
}

function sideBySideSection(dataA, dataB, t) {
  if (!dataA || !dataB) return null;

  const a = dataA;
  const b = dataB;

  const fields = [
    ['Registrar', a.registrar, b.registrar],
    ['Created', a.created ? fmtDate(a.created) : null, b.created ? fmtDate(b.created) : null],
    ['Updated', a.updated ? fmtDate(a.updated) : null, b.updated ? fmtDate(b.updated) : null],
    ['Expires', a.expires ? fmtDate(a.expires) : null, b.expires ? fmtDate(b.expires) : null],
    ['DNSSEC', a.dnssec, b.dnssec],
    ['IP', a.ip, b.ip],
    ['Location', a.geo ? [a.geo.city, a.geo.country].filter(Boolean).join(', ') : null,
                b.geo ? [b.geo.city, b.geo.country].filter(Boolean).join(', ') : null],
    ['Org', a.org, b.org],
    ['NS Count', a.nameservers?.length, b.nameservers?.length],
    ['Statuses', a.statuses?.length, b.statuses?.length],
    ['HTTP Status', a.http?.status, b.http?.status],
    ['HSTS', a.hsts ? 'YES' : 'NO', b.hsts ? 'YES' : 'NO'],
    ['Subdomains', a.subs?.length, b.subs?.length],
    ['Wayback', a.wayback?.timestamp ? a.wayback.timestamp.slice(0, 8) : null,
                b.wayback?.timestamp ? b.wayback.timestamp.slice(0, 8) : null],
  ].filter(([, va]) => va != null || b != null);

  return Column(
    sectionTitle('Side-by-Side Comparison', t),
    vsHeaderRow('', dataA.domain || 'Domain A', dataB.domain || 'Domain B', t, t.ACCENT, t.ACCENT3, 100),
    ...fields.map(([label, va, vb]) => sideBySideRow(label, va, vb, t)),
  ).gap(0).padding(16, 0, 0, 0);
}

export function buildDomainCompare(data, themeName) {
  const t = C(themeName);
  const { domainA, domainB, dataA, dataB } = data;

  function domainPanel(domain, d, sideIdx) {
    const accent = sideIdx === 0 ? t.ACCENT : t.ACCENT3;
    const daysLeft = d?.daysLeft;
    const badgesList = [];

    if (d?.dnssec === 'Unsigned') badgesList.push(badge('DNSSEC Unsigned', t.WARN, `${t.WARN}22`));
    if (daysLeft != null && daysLeft < 30) badgesList.push(badge(daysLeft > 0 ? `Expiry ${daysLeft}d` : 'Expired', t.BAD, `${t.BAD}22`));
    else if (daysLeft != null && daysLeft < 90) badgesList.push(badge(`Expiry ${daysLeft}d`, t.WARN, `${t.WARN}22`));
    if (d?.hsts) badgesList.push(badge('HSTS', t.GOOD, `${t.GOOD}22`));
    if (d?.sec) badgesList.push(badge('Security.txt', t.GOOD, `${t.GOOD}22`));

    const geoParts = [d?.geo?.city, d?.geo?.country].filter(Boolean);
    const locationStr = geoParts.length ? geoParts.join(', ') : null;

    const panels = [];

    if (d?.ip || locationStr) {
      panels.push(
        Row(
          ...(d?.ip ? [metaBlock('IP', d.ip, accent, t)] : []),
          ...(locationStr ? [metaBlock('Location', locationStr, t.TEXT, t)] : []),
        ).gap(8),
      );
    }

    const whoisContent = whoisSection(d, t);
    if (whoisContent) panels.push(domainSection('WHOIS Registration', [whoisContent], t));

    if (d?.dns && Object.keys(d.dns).length) panels.push(domainSection('DNS Records', [dnsSection(d.dns, t)], t));

    if (d?.http) panels.push(domainSection('HTTP Security', [httpSection(d.http, t)], t));

    if (d?.social) panels.push(domainSection('Social Tags', [socialSection(d.social, t)], t));

    if (d?.sitemap?.length) panels.push(domainSection('Sitemap', [listSection(d.sitemap, t)], t));
    if (d?.subs?.length) panels.push(domainSection('Subdomains', [listSection(d.subs, t)], t));
    if (d?.wayback) {
      panels.push(domainSection('Wayback Archive', [
        Row(
          labelText('Latest', 10, t.MUTED).width(80),
          dataText(d.wayback.timestamp ? `${d.wayback.timestamp.slice(0, 4)}-${d.wayback.timestamp.slice(4, 6)}-${d.wayback.timestamp.slice(6, 8)}` : '—', 11, t.TEXT),
        ).gap(6),
      ], t));
    }
    if (d?.robots) panels.push(domainSection('Robots.txt', [
      dataText(d.robots, 9, t.MUTED, { lineHeight: 1.5 }).padding(8).bg(t.SURFACE).rounded(8),
    ], t));
    if (d?.sec) panels.push(domainSection('Security.txt', [
      dataText(d.sec, 9, t.MUTED, { lineHeight: 1.5 }).padding(8).bg(t.SURFACE).rounded(8),
    ], t));

    return Column(
      ...(d?.screenshotUrl ? [
        Photo(d.screenshotUrl).width('100%').height(300).rounded(12).scaleType('cover', 'top'),
      ] : []),
      Row(
        dataText(domain, 20, accent, { bold: true }).flex(1),
        ...(badgesList.length ? [Row(...badgesList.slice(0, 4)).gap(5)] : []),
      ).gap(8).alignItems('center').padding(12, 0, 0, 0),
      ...panels,
    )
      .gap(0).padding(20).bg(t.SURFACE).rounded(16).borderWidth(1).borderColor(t.BORDER).flex(1);
  }

  return Column(
    Row(
      Text('WhoVsWho').font('ChakraPetch').size(16).weight('bold').color(t.ACCENT),
      Text('Domain Compare').font('ChakraPetch').size(16).color(t.MUTED),
    ).gap(8).alignItems('center'),

    dataText(`${domainA}  vs  ${domainB}`, 30, t.TEXT, { bold: true, lineHeight: 1.2 }).padding(6, 0, 0, 0),
    labelText('WHOIS DNS HTTP Social Subdomains Archives', 11, t.MUTED_DIM).padding(0, 0, 16, 0),

    sectionSep(t),

    Row(domainPanel(domainA, dataA, 0), domainPanel(domainB, dataB, 1)).gap(16).padding(16, 0, 0, 0),

    sideBySideSection(dataA, dataB, t),

    sectionSep(t),

    footerRow(t),
  )
    .gap(0).padding(32).width(1400).bg(t.BG_MAIN).rounded(24).borderWidth(1).borderColor(t.BORDER_STRONG);
}

export function buildVsCompare(data, themeName) {
  const t = C(themeName);
  const { domainA, domainB, dataA, dataB } = data;

  const dA = dataA || {};
  const dB = dataB || {};

  const sections_out = [];

  const overviewRows = [
    ['Title', dA.title || dA.social?.title, dB.title || dB.social?.title],
    ['Description', dA.description || dA.social?.description, dB.description || dB.social?.description],
    ['Category', dA.category, dB.category],
  ].filter(([, va]) => va != null || dB != null);
  if (overviewRows.length) {
    sections_out.push(sectionTitle('Overview', t),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      ...overviewRows.map(([label, va, vb]) => tableRow(label, va || '—', vb || '—', t)));
  }

  const techA = dA.techStack || [];
  const techB = dB.techStack || [];
  if (techA.length || techB.length) {
    sections_out.push(
      sectionTitle('Tech Stack', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      Row(
        labelText('Detected', 10, t.MUTED).width(100),
        Column(
          ...(techA.length ? techA.map(s => dataText(s, 10, t.TEXT).padding(2, 6).bg(t.SURFACE).rounded(4)) : [dataText('—', 10, t.MUTED)]),
        ).gap(3).flex(1),
        Column(
          ...(techB.length ? techB.map(s => dataText(s, 10, t.TEXT).padding(2, 6).bg(t.SURFACE).rounded(4)) : [dataText('—', 10, t.MUTED)]),
        ).gap(3).flex(1),
      ).gap(8).padding(6, 0).borderWidth(0, 0, 1, 0).borderColor(t.BORDER).alignItems('flex-start'),
    );
  }

  const httpA = dA.http || {};
  const httpB = dB.http || {};
  const hA = httpA.headers || {};
  const hB = httpB.headers || {};
  if (httpA.status || httpB.status) {
    sections_out.push(
      sectionTitle('HTTP Server', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      tableRow('Status', httpA.status ? `${httpA.status} ${httpA.statusText || ''}`.trim() : null, httpB.status ? `${httpB.status} ${httpB.statusText || ''}`.trim() : null, t),
      tableRow('Server', hA.server, hB.server, t),
      tableRow('Content-Type', hA['content-type']?.split(';')[0], hB['content-type']?.split(';')[0], t),
    );
  }

  const mA = dA.metas || {};
  const mB = dB.metas || {};
  const metaRows = [
    ['og:title', mA['og:title'] || mA['twitter:title'], mB['og:title'] || mB['twitter:title']],
    ['og:description', mA['og:description'] || mA['twitter:description'], mB['og:description'] || mB['twitter:description']],
    ['og:image', mA['og:image'] || dA.social?.image, mB['og:image'] || dB.social?.image],
    ['og:site_name', mA['og:site_name'], mB['og:site_name']],
    ['twitter:card', mA['twitter:card'], mB['twitter:card']],
    ['fb:app_id', mA['fb:app_id'], mB['fb:app_id']],
  ].filter(([, va]) => va != null || mB != null);
  if (metaRows.length) {
    sections_out.push(sectionTitle('Open Graph Meta', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      ...metaRows.map(([label, va, vb]) => tableRow(label, va || '—', vb || '—', t)));
  }

  const pA = dA.perf || {};
  const pB = dB.perf || {};
  if (pA.preloads != null || pB.preloads != null || pA.totalScripts != null || pB.totalScripts != null) {
    sections_out.push(
      sectionTitle('Performance Hints', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      tableRow('Preloads', pA.preloads, pB.preloads, t),
      tableRow('Preconnects', pA.preconnects, pB.preconnects, t),
      tableRow('Stylesheets', pA.stylesheets, pB.stylesheets, t),
      tableRow('Lazy Images', pA.lazyImages, pB.lazyImages, t),
      tableRow('Total Scripts', pA.totalScripts, pB.totalScripts, t),
      tableRow('Viewport Meta', pA.hasViewport ? 'YES' : 'NO', pB.hasViewport ? 'YES' : 'NO', t),
      tableRow('Description Meta', pA.hasDescription ? 'YES' : 'NO', pB.hasDescription ? 'YES' : 'NO', t),
      tableRow('Has Favicon', pA.hasIcon ? 'YES' : 'NO', pB.hasIcon ? 'YES' : 'NO', t),
    );
  }

  const features = [
    ['HTTPS', httpA.url?.startsWith('https'), httpB.url?.startsWith('https')],
    ['Valid SSL', httpA.status >= 200 && httpA.status < 400, httpB.status >= 200 && httpB.status < 400],
    ['Open Graph', !!mA['og:title'], !!mB['og:title']],
    ['Twitter Cards', !!mA['twitter:card'], !!mB['twitter:card']],
    ['Description Meta', !!dA.description, !!dB.description],
    ['Viewport Meta', pA.hasViewport, pB.hasViewport],
    ['Lazy Loading', (pA.lazyImages || 0) > 0, (pB.lazyImages || 0) > 0],
    ['Preload Hints', (pA.preloads || 0) > 0, (pB.preloads || 0) > 0],
  ];
  sections_out.push(
    sectionTitle('Feature Matrix', t).padding(12, 0, 0, 0),
    vsHeaderRow('Feature', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
    ...features.map(([label, va, vb]) =>
      Row(
        labelText(label, 10, t.MUTED).width(100),
        boolText(va, t.GOOD, t.BAD).flex(1),
        boolText(vb, t.GOOD, t.BAD).flex(1),
      ).gap(8).padding(5, 0).borderWidth(0, 0, 1, 0).borderColor(t.BORDER).alignItems('center'),
    ),
  );

  const gA = dA.github || {};
  const gB = dB.github || {};
  if (gA.stars != null || gB.stars != null) {
    sections_out.push(
      sectionTitle('GitHub Repo', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      tableRow('Repo', gA.fullName || gA.url, gB.fullName || gB.url, t),
      tableRow('Stars', gA.stars, gB.stars, t),
      tableRow('Language', gA.language, gB.language, t),
      tableRow('Last Push', gA.pushedAt, gB.pushedAt, t),
      tableRow('License', gA.license, gB.license, t),
    );
  }

  const pricingA = dA.pricing || [];
  const pricingB = dB.pricing || [];
  if (pricingA.length || pricingB.length) {
    sections_out.push(
      sectionTitle('Pricing', t).padding(12, 0, 0, 0),
      vsHeaderRow('', domainA, domainB, t, t.ACCENT, t.ACCENT3, 100),
      Row(
        Column(...pricingA.map(p => dataText(p, 10, t.TEXT, { lineHeight: 1.6 })))
          .padding(10).bg(t.SURFACE).rounded(12).borderWidth(1).borderColor(t.BORDER).flex(1),
        Column(...pricingB.map(p => dataText(p, 10, t.TEXT, { lineHeight: 1.6 })))
          .padding(10).bg(t.SURFACE).rounded(12).borderWidth(1).borderColor(t.BORDER).flex(1),
      ).gap(12),
    );
  }

  return Column(
    Row(
      Text('WhoVsWho').font('ChakraPetch').size(16).weight('bold').color(t.ACCENT),
      Text('VS Compare').font('ChakraPetch').size(16).color(t.MUTED),
    ).gap(8).alignItems('center'),

    dataText(`${domainA}  vs  ${domainB}`, 28, t.TEXT, { bold: true, lineHeight: 1.2 }).padding(6, 0, 0, 0),

    sectionSep(t),

    ...sections_out,

    sectionSep(t),

    footerRow(t),
  )
    .gap(0).padding(32).width(1200).bg(t.BG_MAIN).rounded(24).borderWidth(1).borderColor(t.BORDER_STRONG);
}
