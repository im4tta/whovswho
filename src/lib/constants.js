// API endpoints used across the data fetchers.
export const WHOIS_API = 'https://who-dat.as93.net/';
export const DOH = 'https://dns.google/resolve';
export const WAYBACK = 'https://archive.org/wayback/available';
export const CRT = 'https://crt.sh/';
export const PROXY_API = '/api/proxy'; // Vercel serverless — direct server-side fetch (no CORS)
export const SECURITY_API = '/api/security'; // real header/status fetch (redirect:manual, server-side)
export const SSL_API = '/api/ssl'; // TLS certificate inspection (ssl-checker)
export const REDIRECTS_API = '/api/redirects'; // full HTTP redirect chain
export const LOCATION_API = '/api/location'; // richer IP geolocation (ipapi.co)
export const PROXIES = [
  (u) => `${PROXY_API}?url=${encodeURIComponent(u)}`, // Vercel serverless (preferred)
];

// Number of independent data sources fetched per domain (WHOIS, DNS, subdomains,
// wayback, HTTP headers, social meta, sitemap, robots.txt, security.txt, IP geo,
// TLS certificate, redirect chain).
export const MODULE_COUNT = 12;

export const SUGGESTIONS = ['.com', '.io', '.ai', '.dev', '.net', '.co', '.app', '.org', '.xyz', '.me'];
export const HOSTING_SUBDOMAINS = ['vercel.app', 'netlify.app', 'pages.dev', 'github.io', 'fly.dev', 'railway.app'];
export const isHostingSubdomain = (domain) => HOSTING_SUBDOMAINS.some((host) => domain.endsWith(`.${host}`));

export const HISTORY_KEY = 'dc_history_v1';
export const THEME_KEY = 'dc_theme_v1';
export const HISTORY_LIMIT = 6;

export const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
`;
