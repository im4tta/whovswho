import React, { useState } from 'react';
import I from './icons';
import SectionStatus from './SectionStatus';
import Screenshot from './Screenshot';
import {
  getRegistrar, getRegistrarUrl, getIanaId, getNameservers, getStatuses,
  getCreated, getUpdated, getExpires, getOrg, getDnssec, getSource, isCached, getContacts,
} from '../lib/whois';
import { formatDate, daysUntil, ageInYears, tenure, expiryClass } from '../lib/domain';

export default function DomainCard({ result, side, idx = 0 }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
  if (!result) return null;
  const { domain, error, loading, whois, dns, ip, geo, subs, wayback, http, social, sitemap, robots, sec, ssl, redirects } = result;
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--accent3)';
  const visitUrl = `https://${domain}`;

  if (error) {
    return (
      <div className={`bento domain-card ${side} anim-in`} style={{ '--i': idx }}>
        <div className="card-body">
          <div className="section"><div className="section-head">
            <span className="section-title" style={{ color: accentColor }}>{domain}</span>
            <SectionStatus state="error" />
          </div>
            <div className="tile-value bad">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || (!whois && !result.hostingSubdomain)) {
    return (
      <div className={`bento domain-card ${side} anim-in`} style={{ '--i': idx }}>
        <div className="hero">
          <div className="hero-loading">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '10px', height: '10px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Fetching {domain}…
            </div>
          </div>
        </div>
      </div>
    );
  }

  const registrar = getRegistrar(whois);
  const regUrl = getRegistrarUrl(whois);
  const ianaId = getIanaId(whois);
  const nsList = getNameservers(whois);
  const statuses = getStatuses(whois);
  const created = getCreated(whois);
  const updated = getUpdated(whois);
  const expires = getExpires(whois);
  const expiresFmt = formatDate(expires);
  const createdFmt = formatDate(created);
  const updatedFmt = formatDate(updated);
  const days = daysUntil(expires);
  const age = ageInYears(created);
  const ten = tenure(created, expires);
  const org = getOrg(whois);
  const dnssec = getDnssec(whois);
  const source = getSource(whois);
  const cached = isCached(whois);
  const contacts = getContacts(whois);
  const expCls = expiryClass(days);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const secSummary = sec ? sec.split('\n').filter(l => l.trim()).slice(0, 3).join(' · ') : null;
  const hasHsts = !!http?.headers?.['strict-transport-security'];
  const hasCsp = !!http?.headers?.['content-security-policy'];
  const hasXfo = !!http?.headers?.['x-frame-options'];
  const hasXss = !!http?.headers?.['x-xss-protection'];
  const securityHeaderCount = [hasHsts, hasCsp, hasXfo, hasXss].filter(Boolean).length;
  const priorityBadges = [];
  if (days != null && days < 30) priorityBadges.push({ tone: 'bad', icon: '⏳', label: `Expiry ${days > 0 ? `${days}d` : 'expired'}` });
  if (days != null && days >= 30 && days < 90) priorityBadges.push({ tone: 'warn', icon: '📅', label: `Expiry ${days}d` });
  if (dnssec === 'Unsigned') priorityBadges.push({ tone: 'warn', icon: '🧬', label: 'DNSSEC Unsigned' });
  if (http && !hasHsts) priorityBadges.push({ tone: 'bad', icon: '🔓', label: 'Header Security Risk' });
  if (http && hasHsts && hasCsp) priorityBadges.push({ tone: 'good', icon: '🛡️', label: 'Headers Hardened' });
  if (sec) priorityBadges.push({ tone: 'good', icon: '📄', label: 'Security.txt Found' });
  if (ssl && ssl.valid === false) priorityBadges.push({ tone: 'bad', icon: '🔒', label: 'Invalid TLS Cert' });
  else if (ssl && ssl.daysRemaining != null && ssl.daysRemaining < 14) priorityBadges.push({ tone: 'bad', icon: '🔒', label: `Cert expires ${ssl.daysRemaining}d` });
  else if (ssl && ssl.daysRemaining != null && ssl.daysRemaining < 30) priorityBadges.push({ tone: 'warn', icon: '🔒', label: `Cert expires ${ssl.daysRemaining}d` });
  if (redirects && redirects.totalHops > 3) priorityBadges.push({ tone: 'warn', icon: '↪️', label: `${redirects.totalHops} Redirect Hops` });

  return (
    <div className={`bento domain-card ${side} anim-in`} style={{ '--i': idx }}>
      <Screenshot domain={domain} side={side} />

      <div className="card-body">
        {/* Identity */}
        <div className="identity">
          <img className="favicon" src={faviconUrl} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className={`name ${side}`}>{domain}</span>
          {ip && <span className="section-sub" style={{ marginLeft: '0.4rem' }}>· {ip}{geo?.city ? ` · ${geo.city}, ${geo.country}` : ''}{geo?.org ? ` · ${geo.org}` : ''}</span>}
          <a className="visit-link" href={visitUrl} target="_blank" rel="noopener noreferrer">
            {I.link} Visit
          </a>
        </div>
        {priorityBadges.length > 0 && (
          <div className="priority-strip">
            {priorityBadges.slice(0, 5).map((b, i) => (
              <div key={`${b.label}-${i}`} className={`priority-pill ${b.tone}`} style={{ '--badge-delay': i }}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* WHOIS section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">WHOIS · Registration</span>
            <SectionStatus state={result.hostingSubdomain ? 'skip' : 'ok'} />
          </div>
          {result.hostingSubdomain ? (
            <div>
              <div className="tile-value warn" style={{ fontSize: '0.7rem' }}>⚠ Hosted subdomain — no WHOIS record</div>
              <div className="tile-sub" style={{ marginTop: '0.2rem' }}>Managed internally by {domain.split('.').slice(-2).join('.')} — only the registered domain has a WHOIS record</div>
            </div>
          ) : (
          <div className="tile-grid">
            <div className="tile span-2">
              <span className="tile-label">Registrar</span>
              <span className="tile-value lg">{registrar || '—'}</span>
              {regUrl && <span className="tile-sub"><a href={regUrl} target="_blank" rel="noopener noreferrer">{regUrl.replace(/^https?:\/\//, '')}</a>{ianaId ? ` · IANA ${ianaId}` : ''}</span>}
            </div>
            <div className="tile">
              <span className="tile-label">Expires</span>
              <span className={`tile-value lg ${expCls}`}>{expiresFmt || '—'}</span>
              {days != null && <span className={`tile-sub ${expCls}`}>{days > 0 ? `${days}d left` : 'Expired'}{ten ? ` · ${ten}` : ''}</span>}
            </div>
            <div className="tile">
              <span className="tile-label">Created</span>
              <span className="tile-value">{createdFmt || '—'}</span>
              {age && <span className="tile-sub">Age: {age}</span>}
            </div>
            <div className="tile">
              <span className="tile-label">Updated</span>
              <span className="tile-value">{updatedFmt || '—'}</span>
            </div>
            <div className="tile">
              <span className="tile-label">DNSSEC</span>
              <span className={`tile-value ${dnssec === 'Signed' ? 'good' : dnssec === 'Unsigned' ? 'muted' : ''}`}>{dnssec || '—'}</span>
            </div>
            <div className="tile span-2">
              <span className="tile-label">Status · Source</span>
              <div className="tags">
                {statuses.slice(0, 5).map((s, i) => <span key={i} className="tag">{(s || '').split(' ')[0] || s}</span>)}
                {statuses.length === 0 && <span className="tag muted">—</span>}
              </div>
              {source && <span className="tile-sub" style={{ marginTop: '0.2rem' }}>Source: {source}{cached ? ' · cached' : ''}</span>}
            </div>
            <div className="tile span-2">
              <span className="tile-label">Nameservers <span style={{ color: 'var(--muted)' }}>({nsList.length})</span></span>
              <div className="ns-scroll">
                {nsList.length === 0 ? <span className="tag muted">—</span> :
                  nsList.map((n, i) => (
                    <div key={i} className="ns-row">
                      <span className="ns-name">{n.name}</span>
                      {n.ipv4?.[0] && <span className="ns-ip">{n.ipv4[0]}</span>}
                    </div>
                  ))}
              </div>
            </div>
            {org && (
              <div className="tile span-2">
                <span className="tile-label">Organization</span>
                <span className="tile-value">{org}</span>
              </div>
            )}
            {contacts.length > 0 && (
              <div className="tile span-2">
                <span className="tile-label">Contacts</span>
                <div className="contacts">
                  {contacts.map((c, i) => (
                    <div key={i} className={`contact ${c.redacted ? 'redacted' : ''}`}>
                      <span className="role">{c.role}</span>
                      <span className="org">{c.redacted ? '🔒 Redacted' : (c.organization || c.name || '—')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>

        {/* DNS section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">DNS Records</span>
            <SectionStatus state={dns ? 'ok' : 'error'} />
          </div>
          {dns ? (
            <div className="dns-group">
              {Object.entries(dns).map(([type, values]) => values.length > 0 && (
                <div key={type}>
                  {(expanded['dns-' + type] ? values : values.slice(0, 4)).map((v, i) => (
                    <div key={i} className="dns-line">
                      <span className="dns-type">{type}</span>
                      <span className="dns-val">{v}{type === 'MX' ? ' (priority)' : ''}</span>
                    </div>
                  ))}
                  {values.length > 4 && (
                    <button className="expand-btn" onClick={() => toggle('dns-' + type)}>
                      {expanded['dns-' + type] ? `Show less` : `+ ${values.length - 4} more`}
                    </button>
                  )}
                </div>
              ))}
              {!Object.values(dns).some(v => v.length) && <span className="section-sub">No records</span>}
            </div>
          ) : <span className="section-sub">Unable to fetch</span>}
        </div>

        {/* HTTP section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">HTTP · Server</span>
            <SectionStatus state={http ? 'ok' : 'skip'} />
          </div>
          {http && http.status && typeof http.status === 'number' ? (
            <div>
              <div className="http-line" style={{ marginBottom: '0.3rem' }}>
                <span className="k">Status</span>
                <span className={`http-status s${String(http.status).charAt(0)}`}>{http.status} {http.statusText}</span>
              </div>
              {http.headers['server'] && <div className="http-line"><span className="k">Server</span><span className="v">{http.headers['server']}</span></div>}
              {http.headers['content-type'] && <div className="http-line"><span className="k">Content-Type</span><span className="v">{http.headers['content-type'].split(';')[0]}</span></div>}
              {http.headers['x-frame-options'] && <div className="http-line"><span className="k">X-Frame</span><span className="v">{http.headers['x-frame-options']}</span></div>}
              <div className="http-line"><span className="k">Final URL</span><span className="v" style={{ fontSize: '0.58rem' }}>{http.url}</span></div>
              
              {/* Security Badges */}
              <div className="security-badges">
                <div className={`security-badge ${securityHeaderCount >= 3 ? 'good' : securityHeaderCount >= 2 ? 'warn' : 'bad'}`} style={{ '--badge-delay': 0 }}>
                  <span className="icon">🧯</span>
                  <span>{securityHeaderCount >= 3 ? 'Header Security Strong' : securityHeaderCount >= 2 ? 'Header Security Partial' : 'Header Security Weak'}</span>
                </div>
                {http.headers['strict-transport-security'] && (
                  <div className="security-badge good" style={{ '--badge-delay': 1 }}>
                    <span className="icon">🔒</span>
                    <span>HSTS Enabled</span>
                  </div>
                )}
                {!http.headers['strict-transport-security'] && (
                  <div className="security-badge bad" style={{ '--badge-delay': 1 }}>
                    <span className="icon">⚠️</span>
                    <span>HSTS Missing</span>
                  </div>
                )}
                {http.headers['content-security-policy'] && (
                  <div className="security-badge good" style={{ '--badge-delay': 2 }}>
                    <span className="icon">🛡️</span>
                    <span>CSP Set</span>
                  </div>
                )}
                {http.headers['x-frame-options'] && (
                  <div className="security-badge good" style={{ '--badge-delay': 3 }}>
                    <span className="icon">🚫</span>
                    <span>X-Frame Protection</span>
                  </div>
                )}
                {http.headers['x-xss-protection'] && (
                  <div className="security-badge good" style={{ '--badge-delay': 4 }}>
                    <span className="icon">🦠</span>
                    <span>XSS Protection</span>
                  </div>
                )}
                {!http.headers['strict-transport-security'] && !http.headers['content-security-policy'] && (
                  <div className="security-badge bad" style={{ '--badge-delay': 5 }}>
                    <span className="icon">🔓</span>
                    <span>Weak Security</span>
                  </div>
                )}
              </div>
            </div>
          ) : http && http.status === 'CORS-blocked' ? (
            <span className="section-sub">Direct fetch blocked by CORS (needs server-side proxy)</span>
          ) : <span className="section-sub">Site unreachable</span>}
        </div>

        {/* TLS Certificate section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">TLS Certificate</span>
            <SectionStatus state={ssl ? (ssl.valid ? 'ok' : 'error') : 'skip'} />
          </div>
          {ssl ? (
            <div className="tile-grid">
              <div className="tile">
                <span className="tile-label">Valid Until</span>
                <span className={`tile-value ${ssl.daysRemaining != null && ssl.daysRemaining < 14 ? 'bad' : ssl.daysRemaining < 30 ? 'warn' : 'good'}`}>{formatDate(ssl.validTo) || '—'}</span>
                {ssl.daysRemaining != null && <span className="tile-sub">{ssl.daysRemaining > 0 ? `${ssl.daysRemaining}d left` : 'Expired'}</span>}
              </div>
              <div className="tile">
                <span className="tile-label">Issuer</span>
                <span className="tile-value">{ssl.issuer?.O || ssl.issuer?.CN || '—'}</span>
              </div>
              <div className="tile">
                <span className="tile-label">Protocol · Cipher</span>
                <span className="tile-value" style={{ fontSize: '0.65rem' }}>{ssl.protocol || '—'}</span>
                {ssl.cipher && <span className="tile-sub">{ssl.cipher} · {ssl.bits}bit</span>}
              </div>
              <div className="tile">
                <span className="tile-label">Chain</span>
                <span className={`tile-value ${ssl.chainComplete ? 'good' : 'warn'}`}>{ssl.chainComplete ? 'Complete' : 'Incomplete'}</span>
              </div>
              {ssl.validFor && ssl.validFor.length > 0 && (
                <div className="tile span-2">
                  <span className="tile-label">Valid For <span style={{ color: 'var(--muted)' }}>({ssl.validFor.length})</span></span>
                  <div className="tags">
                    {ssl.validFor.slice(0, 6).map((v, i) => <span key={i} className="tag">{v}</span>)}
                    {ssl.validFor.length > 6 && <span className="tag muted">+{ssl.validFor.length - 6} more</span>}
                  </div>
                </div>
              )}
            </div>
          ) : <span className="section-sub">Unavailable or connection failed</span>}
        </div>

        {/* Redirect chain section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Redirect Chain</span>
            <SectionStatus state={redirects ? (redirects.totalHops > 1 ? 'ok' : 'skip') : 'error'} />
          </div>
          {redirects && redirects.chain?.length > 0 ? (
            redirects.totalHops <= 1 ? (
              <span className="section-sub">No redirects — resolves directly ({redirects.chain[0]?.status})</span>
            ) : (
              <div className="dns-group">
                {redirects.chain.map((hop, i) => (
                  <div key={i} className="dns-line">
                    <span className="dns-type">{hop.status || '×'}</span>
                    <span className="dns-val" style={{ fontSize: '0.6rem' }}>
                      {hop.url}{hop.location ? ` → ${hop.location}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : <span className="section-sub">Unavailable</span>}
        </div>

        {/* Social section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Social Tags · SEO</span>
            <SectionStatus state={social ? 'ok' : 'skip'} />
          </div>
          {social && (social.title || social.description) ? (
            <div className="social-card">
              {social.image && <img className="social-img" src={social.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
              <div className="social-text">
                <div className="social-title">{social.title || '—'}</div>
                {social.description && <div className="social-desc">{social.description}</div>}
                {social.siteName && <div className="tile-sub" style={{ marginTop: '0.2rem' }}>via {social.siteName}</div>}
              </div>
            </div>
          ) : <span className="section-sub">No OG tags detected or blocked by CORS</span>}
        </div>

        {/* Sitemap section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Sitemap</span>
            <SectionStatus state={sitemap ? 'ok' : 'skip'} />
          </div>
          {sitemap && sitemap.length > 0 ? (
            <div className="scroll-list" style={expanded.sitemap ? { maxHeight: 'none' } : {}}>
              {(expanded.sitemap ? sitemap : sitemap.slice(0, 8)).map((u, i) => <div key={i} className="list-row"><a href={u} target="_blank" rel="noopener noreferrer">{u}</a></div>)}
              {sitemap.length > 8 && (
                <button className="expand-btn" onClick={() => toggle('sitemap')}>
                  {expanded.sitemap ? 'Show less' : `+ ${sitemap.length - 8} more`}
                </button>
              )}
            </div>
          ) : <span className="section-sub">No sitemap or blocked by CORS</span>}
        </div>

        {/* Subdomains section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Subdomains <span style={{ color: 'var(--muted)' }}>(crt.sh)</span></span>
            <SectionStatus state={subs && subs.length > 0 ? 'ok' : (subs ? 'skip' : 'error')} />
          </div>
          {subs && subs.length > 0 ? (
            <div className="scroll-list" style={expanded.subs ? { maxHeight: 'none' } : {}}>
              {(expanded.subs ? subs : subs.slice(0, 15)).map((s, i) => <div key={i} className="list-row">{s}</div>)}
              {subs.length > 15 && (
                <button className="expand-btn" onClick={() => toggle('subs')}>
                  {expanded.subs ? 'Show less' : `+ ${subs.length - 15} more`}
                </button>
              )}
            </div>
          ) : <span className="section-sub">No subdomains found</span>}
        </div>

        {/* Archives section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Wayback Archive</span>
            <SectionStatus state={wayback ? 'ok' : 'skip'} />
          </div>
          {wayback ? (
            <div className="wayback">
              <div className="wayback-row">
                <span className="k">Latest</span>
                <span className="v">{wayback.timestamp ? `${wayback.timestamp.slice(0,4)}-${wayback.timestamp.slice(4,6)}-${wayback.timestamp.slice(6,8)}` : '—'}</span>
              </div>
              {wayback.url && <div className="wayback-row"><span className="k">Snapshot</span><span className="v"><a href={wayback.url} target="_blank" rel="noopener noreferrer">View →</a></span></div>}
            </div>
          ) : <span className="section-sub">No archive snapshot</span>}
        </div>

        {/* Robots section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Robots.txt</span>
            <SectionStatus state={robots ? 'ok' : 'skip'} />
          </div>
          {robots ? (
            <div>
              <div className="robots-text" style={expanded.robots ? { maxHeight: 'none' } : {}}>
                {expanded.robots ? robots : robots.split('\n').slice(0, 8).join('\n')}
              </div>
              {robots.split('\n').length > 8 && (
                <button className="expand-btn" onClick={() => toggle('robots')}>
                  {expanded.robots ? 'Show less' : `+ ${robots.split('\n').length - 8} more lines`}
                </button>
              )}
            </div>
          ) : <span className="section-sub">Not found or CORS-blocked</span>}
        </div>

        {/* Security.txt section */}
        <div className="section">
          <div className="section-head">
            <span className="section-title">Security.txt</span>
            <SectionStatus state={sec ? 'ok' : 'skip'} />
          </div>
          {sec ? (
            <div>
              <div className="robots-text" style={expanded.sec ? { maxHeight: 'none' } : {}}>
                {expanded.sec ? sec : (secSummary || sec.split('\n').slice(0, 5).join('\n'))}
              </div>
              {sec.split('\n').length > 5 && (
                <button className="expand-btn" onClick={() => toggle('sec')}>
                  {expanded.sec ? 'Show less' : `+ ${sec.split('\n').length - 5} more lines`}
                </button>
              )}
            </div>
          ) : <span className="section-sub">Not found or CORS-blocked</span>}
        </div>
      </div>
    </div>
  );
}

