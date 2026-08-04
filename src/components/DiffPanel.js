import React from 'react';
import {
  getRegistrar, getIanaId, getAbuseEmail, getCreated, getUpdated, getExpires,
  getDnssec, getSource, getOrg, getNameservers, getStatuses,
} from '../lib/whois';
import { formatDate } from '../lib/domain';

export default function DiffPanel({ a, b }) {
  if (!a?.whois || !b?.whois) return null;
  const fields = [
    { key: 'Registrar',    va: getRegistrar(a.whois),                                                              vb: getRegistrar(b.whois) },
    { key: 'IANA ID',      va: getIanaId(a.whois),                                                                 vb: getIanaId(b.whois) },
    { key: 'Abuse Email',  va: getAbuseEmail(a.whois),                                                             vb: getAbuseEmail(b.whois) },
    { key: 'Created',      va: formatDate(getCreated(a.whois)),                                                    vb: formatDate(getCreated(b.whois)) },
    { key: 'Updated',      va: formatDate(getUpdated(a.whois)),                                                    vb: formatDate(getUpdated(b.whois)) },
    { key: 'Expires',      va: formatDate(getExpires(a.whois)),                                                    vb: formatDate(getExpires(b.whois)) },
    { key: 'DNSSEC',       va: getDnssec(a.whois),                                                                 vb: getDnssec(b.whois) },
    { key: 'Source',       va: getSource(a.whois),                                                                 vb: getSource(b.whois) },
    { key: 'Org',          va: getOrg(a.whois) || (a.whois?.contacts?.registrant?.redacted ? '🔒' : null),         vb: getOrg(b.whois) || (b.whois?.contacts?.registrant?.redacted ? '🔒' : null) },
    { key: 'IP (A)',       va: a.ip || (a.dns?.A?.[0]) || null,                                                    vb: b.ip || (b.dns?.A?.[0]) || null },
    { key: 'NS Count',     va: String(getNameservers(a.whois).length),                                             vb: String(getNameservers(b.whois).length) },
    { key: 'Status Count', va: String(getStatuses(a.whois).length),                                                vb: String(getStatuses(b.whois).length) },
    { key: 'HTTP Status',  va: a.http && typeof a.http.status === 'number' ? `${a.http.status}` : null,            vb: b.http && typeof b.http.status === 'number' ? `${b.http.status}` : null },
    { key: 'Subdomains',   va: a.subs ? String(a.subs.length) : null,                                              vb: b.subs ? String(b.subs.length) : null },
    { key: 'Wayback',      va: a.wayback?.timestamp ? a.wayback.timestamp.slice(0, 8) : null,                      vb: b.wayback?.timestamp ? b.wayback.timestamp.slice(0, 8) : null },
    { key: 'Geo City',     va: a.geo?.city ? `${a.geo.city}, ${a.geo.country}` : null,                             vb: b.geo?.city ? `${b.geo.city}, ${b.geo.country}` : null },
    { key: 'Geo Org',      va: a.geo?.org || null,                                                                  vb: b.geo?.org || null },
    { key: 'TLS Expires',  va: a.ssl ? formatDate(a.ssl.validTo) : null,                                             vb: b.ssl ? formatDate(b.ssl.validTo) : null },
    { key: 'TLS Issuer',   va: a.ssl?.issuer?.O || a.ssl?.issuer?.CN || null,                                        vb: b.ssl?.issuer?.O || b.ssl?.issuer?.CN || null },
    { key: 'Redirect Hops', va: a.redirects ? String(a.redirects.totalHops) : null,                                 vb: b.redirects ? String(b.redirects.totalHops) : null },
  ];
  const rows = fields.filter(r => r.va || r.vb);
  const sameCount = rows.filter(r => r.va === r.vb).length;
  const score = rows.length === 0 ? 0 : Math.round((sameCount / rows.length) * 100);

  return (
    <div className="bento diff-bento anim-in" style={{ '--i': 2 }}>
      <div className="diff-head">
        <h3>Side-by-Side Comparison · Match {sameCount}/{rows.length}</h3>
        <div className="match-score">
          <div className="match-bar"><span style={{ width: `${score}%` }} /></div>
          <span style={{ color: score >= 80 ? 'var(--good)' : score >= 50 ? 'var(--warn)' : 'var(--bad)' }}>{score}%</span>
        </div>
      </div>
      <table className="diff-table">
        <thead><tr><th>Field</th><th>{a.domain}</th><th>{b.domain}</th></tr></thead>
        <tbody>
          {rows.map(r => {
            const same = r.va === r.vb;
            return (
              <tr key={r.key} className={same ? 'same' : 'diff'}>
                <td className="k">{r.key}</td>
                <td className="a">{r.va || '—'}</td>
                <td className="b">{r.vb || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

