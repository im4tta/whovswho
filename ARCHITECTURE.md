# whovswho Architecture

## Recommended Setup

Use two free services together — Vercel for most checks, Cloudflare Workers as a CORS proxy for high-frequency lookups.

```
whovswho (Vercel)
├── /api/ssl.js          → ssl-checker npm package
├── /api/location.js     → fetch ipapi.co (free, 1k/day)
├── /api/screenshot.js   → @sparticuz/chromium + puppeteer-core
├── /api/security.js     → parse existing headers for CSP/HSTS/WAF
└── /api/redirects.js    → follow redirect chain with node-fetch

Cloudflare Worker (worker.whovswho.com or similar)
└── proxy.js             → CORS-safe proxy for WHOIS/DNS APIs
```

## Port Scanning

No free host allows outbound TCP scanning. Use the **Shodan API** (free tier: 100 queries/month) which has pre-scanned port data for most public IPs.
