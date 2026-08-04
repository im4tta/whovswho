// Field accessors for the WHOIS payload (different upstream sources use different
// key names/shapes, so these normalize access) plus helpers that shape a fetched
// result into the flat structure the screenshot/JSON export payloads expect.
import { daysUntil } from './domain';

export const getRegistrar = (d) => d?.registrar?.name || d?.registrar || null;
export const getRegistrarUrl = (d) => d?.registrar?.url || null;
export const getIanaId = (d) => d?.registrar?.ianaId || null;
export const getAbuseEmail = (d) => d?.registrar?.abuseEmail || null;
export const getAbusePhone = (d) => d?.registrar?.abusePhone || null;

export const getNameservers = (d) => {
  const ns = d?.nameservers || d?.name_servers || [];
  const arr = Array.isArray(ns) ? ns : [ns];
  return arr
    .map((n) => ({ name: typeof n === 'string' ? n : n?.name, ipv4: n?.ipv4 || [], ipv6: n?.ipv6 || [] }))
    .filter((n) => n.name);
};

export const getStatuses = (d) => {
  const s = d?.status || d?.domain_status || [];
  return Array.isArray(s) ? s : [s];
};

export const getCreated = (r) => r?.dates?.created || r?.creation_date || r?.created_date || null;
export const getUpdated = (r) => r?.dates?.updated || r?.updated_date || null;
export const getExpires = (r) => r?.dates?.expires || r?.expiration_date || r?.registry_expiry_date || null;
export const getOrg = (r) => r?.contacts?.registrant?.organization || r?.registrant?.organization || r?.org || null;
export const getDnssec = (r) => (r?.dnssec?.signed === true ? 'Signed' : r?.dnssec?.signed === false ? 'Unsigned' : null);
export const getSource = (r) => (r?.meta?.source ? r.meta.source.toUpperCase() : null);
export const isCached = (r) => r?.meta?.cached === true;

export const getContacts = (r) => {
  if (!r?.contacts) return [];
  return ['registrant', 'admin', 'tech', 'billing']
    .map((role) => ({ role, ...(r.contacts[role] || {}) }))
    .filter((c) => c.organization || c.name || c.email || c.phone);
};

/** Flattens a fetched domain result into the shape used by the screenshot/export payloads. */
export const extractDomainData = (result) => {
  if (!result || (!result.whois && !result.hostingSubdomain)) return null;
  return {
    screenshotUrl: `https://s.wordpress.com/mshots/v1/${encodeURIComponent('https://' + result.domain)}?w=1200`,
    ip: result.ip || null,
    geo: result.geo ? { city: result.geo.city, country: result.geo.country, org: result.geo.org } : null,
    registrar: getRegistrar(result.whois),
    created: getCreated(result.whois),
    updated: getUpdated(result.whois),
    expires: getExpires(result.whois),
    daysLeft: daysUntil(getExpires(result.whois)),
    dnssec: getDnssec(result.whois),
    nameservers: getNameservers(result.whois).map((n) => ({ name: n.name, ipv4: n.ipv4?.[0] || null })),
    statuses: getStatuses(result.whois),
    org: getOrg(result.whois),
    contacts: getContacts(result.whois).map((c) => ({ role: c.role, org: c.organization || c.name || null, redacted: !!c.redacted })),
    source: getSource(result.whois),
    cached: isCached(result.whois),
    dns: result.dns || null,
    http: result.http ? {
      status: result.http.status,
      statusText: result.http.statusText,
      url: result.http.url,
      headers: result.http.headers || {},
    } : null,
    social: result.social || null,
    sitemap: result.sitemap || null,
    subs: result.subs || null,
    wayback: result.wayback ? { timestamp: result.wayback.timestamp, url: result.wayback.url } : null,
    robots: result.robots || null,
    sec: result.sec || null,
    ssl: result.ssl ? {
      valid: result.ssl.valid,
      daysRemaining: result.ssl.daysRemaining,
      validTo: result.ssl.validTo,
      issuer: result.ssl.issuer?.O || result.ssl.issuer?.CN || null,
      protocol: result.ssl.protocol,
    } : null,
    redirects: result.redirects ? {
      totalHops: result.redirects.totalHops,
      final: result.redirects.final,
    } : null,
    hsts: !!result.http?.headers?.['strict-transport-security'],
    csp: !!result.http?.headers?.['content-security-policy'],
    xfo: !!result.http?.headers?.['x-frame-options'],
    xss: !!result.http?.headers?.['x-xss-protection'],
  };
};

/** Flattens a fetched VS-Compare (page-meta) result for the export payload. */
export const extractVsData = (result) => {
  if (!result) return null;
  return {
    title: result.title || null,
    description: result.description || null,
    category: result.category || null,
    social: result.social || null,
    http: result.http ? {
      status: result.http.status,
      statusText: result.http.statusText,
      url: result.http.url,
      headers: result.http.headers || {},
    } : null,
    metas: result.metas || null,
    techStack: result.techStack || null,
    perf: result.perf || null,
    github: result.github || null,
    pricing: result.pricing || null,
  };
};
