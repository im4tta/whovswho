<div align="center">

# ⚡ WhoVsWho

**Compare two domains instantly — WHOIS, DNS, HTTP, Security, and more**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-000?logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/license-MIT-3A86FF)](#license)

Enter two domains and get a side-by-side comparison of WHOIS data, DNS records, HTTP security headers, social metadata, subdomains, Wayback Machine snapshots, and more — all in a beautiful, responsive interface.

[**🚀 Try it live →**](https://whovswho.vercel.app)

</div>

---

## ✨ Features

### 🔍 Comprehensive Domain Analysis

- **🧾 WHOIS Data** — Registrar, creation/expiration dates, nameservers, DNSSEC status, domain status codes, and registrant contacts
- **🌐 DNS Records** — A, AAAA, NS, MX, TXT, CAA, SOA resolved via Google Public DNS (DNS-over-HTTPS)
- **🔒 TLS Certificate** — Issuer, validity window, protocol/cipher, and chain completeness via server-side `ssl-checker`
- **↪️ Redirect Chain** — Full hop-by-hop HTTP redirect trace, resolved server-side
- **📍 IP Geolocation** — IP address, city, country, ISP, and ASN via ipinfo.io + ipapi.co
- **🖼️ Homepage Screenshots** — Visual preview of each domain's homepage
- **🔒 HTTP Security Headers** — Status code, server info, HSTS, CSP, X-Frame-Options, and more with animated security badges
- **📢 Social Metadata** — Open Graph and Twitter Card tags (title, description, image, site name)
- **🗺️ Sitemap Discovery** — Parses `/sitemap.xml` and lists discovered URLs
- **🔍 Subdomain Enumeration** — Certificate Transparency data from crt.sh
- **🕰️ Wayback Machine** — Latest archive.org snapshot with timestamp and direct link
- **📄 Robots & Security** — Fetches and displays `robots.txt` and `security.txt` files

### ⚔️ Comparison Tools

- **📊 Diff Panel** — Side-by-side field comparison with percentage match score
- **🚨 Priority Badges** — Auto-flags expiring domains, unsigned DNSSEC, missing security headers
- **📸 Screenshot Export** — Export full results as PNG image
- **📋 JSON Export** — Download comparison data as JSON or copy to clipboard
- **📄 Raw Data Viewer** — Tabbed JSON viewer per domain with all raw data
- **🎯 VS Compare Mode** — Compare any two web apps side-by-side with feature matrix

### 🎨 User Experience

- **🌓 Dark/Light Theme** — Toggle in header, respects OS preference, persists across sessions
- **⌨️ Keyboard Shortcuts** — `Ctrl+Enter` to trigger comparison
- **🔗 URL Sharing** — Share comparisons via URL params (`?a=github.com&b=gitlab.com`)
- **📝 History** — Last 6 comparisons saved in localStorage for quick re-run
- **💡 Domain Suggestions** — Quick TLD append (`.com`, `.io`, `.ai`, `.dev`, etc.)
- **🔄 Flip Animation** — 3D card flip between scan results and VS Compare mode

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/whovswho.git
cd whovswho

# Install dependencies
npm install

# Start development server
npm start        # → http://localhost:3000

# Build for production
npm run build    # → production build in build/
```

### Deployment

Deploy on Vercel for automatic serverless function deployment:

```bash
npm run build
```

Connect your repository to Vercel — it auto-detects Create React App. The API proxy at `api/proxy.js` deploys alongside as a serverless function for CORS-free requests.

---

## 📊 How It Works

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│  WHOVSWHO       Compare Domains Side-by-Side        [☀/🌙] │
├────────────────────────────────────────────────────────────┤
│  Domain A      [github.com     ]  VS  [gitlab.com     ]   │
│  [→ Compare]  Ctrl+↵     10 modules · parallel fetch       │
├──────────────────────┬─────────────────────────────────────┤
│  github.com          │  gitlab.com                         │
│  WHOIS · DNS · HTTP  │  WHOIS · DNS · HTTP                │
│  Security · Social   │  Security · Social                 │
│  Sitemap · Subs      │  Sitemap · Subs                     │
│  Wayback · Archive   │  Wayback · Archive                 │
├──────────────────────┴─────────────────────────────────────┤
│  Match: 12/18  ⚖️  67%                                      │
│  [📋 Copy] [💾 Export] [📄 JSON·A] [📄 JSON·B] [📸 Screenshot] │
└────────────────────────────────────────────────────────────┘
```

### Data Sources

| Source | Purpose |
|--------|---------|
| [`who-dat.as93.net`](https://who-dat.as93.net) | WHOIS lookup |
| [`dns.google/resolve`](https://dns.google) | DNS records (DoH) — A, AAAA, NS, MX, TXT, CAA, SOA |
| `/api/security` (Vercel fn) | Real HTTP status + response headers (server-side, `redirect: manual`) |
| `/api/ssl` (Vercel fn, `ssl-checker`) | TLS certificate: issuer, validity window, protocol, cipher, chain |
| `/api/redirects` (Vercel fn) | Full HTTP redirect chain (up to 20 hops) |
| `/api/location` (Vercel fn, [`ipapi.co`](https://ipapi.co)) | IP geolocation enrichment (ASN, timezone, currency) |
| [`ipinfo.io`](https://ipinfo.io) | IP geolocation (primary) |
| [`archive.org/wayback`](https://archive.org) | Wayback Machine snapshots |
| [`s.wordpress.com/mshots`](https://wordpress.com) | Homepage screenshots |
| [`crt.sh`](https://crt.sh) | Certificate Transparency (subdomains) |
| `/api/proxy` (Vercel fn) | CORS-free fetch for sitemap/robots/social/page-meta |

`/api/screenshot.js` (Puppeteer + `@sparticuz/chromium`) is also deployed for a headless-browser screenshot, but isn't wired into the UI yet — the mshots-based screenshot is faster and free on every request.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Create React App |
| **Styling** | Plain CSS (`src/styles.css`) + CSS custom properties |
| **Image Export** | [SONE](https://github.com/seanghay/sone) — declarative Skia layout engine (server-side) + html2canvas fallback |
| **Serverless functions** | Vercel Node.js functions: proxy, security headers, SSL check, redirect chain, IP geolocation, screenshot, export |
| **Icons** | Inline SVG (zero external dependencies) |
| **Fonts** | Chakra Petch (display) · JetBrains Mono (mono/body) |


---

## 🔧 Configuration

### Environment Variables

No environment variables required for basic functionality. The app uses public APIs and a Vercel serverless proxy for CORS handling.

### Proxy Configuration

The included Vercel serverless function (`api/proxy.js`) handles CORS for:
- HTTP header fetching
- Sitemap parsing
- Robots.txt and security.txt retrieval
- Social metadata extraction

---

## 📝 Usage Examples

### Basic Domain Comparison

1. Enter two domains (e.g., `github.com` vs `gitlab.com`)
2. Click "Compare" or press `Ctrl+Enter`
3. View side-by-side results with security badges and diff panel

### Sharing Comparisons

Share any comparison via URL:
```
https://whovswho.vercel.app/?a=github.com&b=gitlab.com
```

### Exporting Results

- **Screenshot**: Click the camera icon to export results as PNG
- **JSON**: Click the download icon to save raw data as JSON
- **Copy**: Click the copy icon to copy JSON to clipboard

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs via GitHub Issues
- Suggest new features
- Submit pull requests

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with [React](https://react.dev) · Deployed on [Vercel](https://vercel.com) · Images by [SONE](https://github.com/seanghay/sone)**

</div>
