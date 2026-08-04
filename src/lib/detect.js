// Heuristic tech-stack / page-category detection used by the VS-Compare tab.
// Pattern-matches response headers, homepage HTML, and script src attributes
// against known signatures — not exhaustive, just enough for a quick signal.

export function detectTech(html, http, scripts) {
  const stack = [];
  const h = http?.headers || {};

  // Headers
  if (h['x-powered-by']) stack.push(...h['x-powered-by'].split(/[,/]/).map((s) => s.trim()).filter(Boolean));
  if (h.server?.toLowerCase().includes('cloudflare')) stack.push('Cloudflare');
  if (h['cf-ray']) stack.push('Cloudflare');
  if (h['x-amz-cf-id'] || h['x-amz-rid']) stack.push('AWS CloudFront');
  if (h['x-served-by']?.includes('cache')) stack.push('Varnish');
  if (h.server?.includes('nginx')) stack.push('Nginx');
  if (h.server?.includes('gunicorn')) stack.push('Gunicorn');

  // HTML
  if (html) {
    if (html.includes('__NEXT_DATA__')) stack.push('Next.js');
    if (html.includes('data-reactroot') || html.includes('data-reactid')) stack.push('React');
    if (html.includes('wp-content') || html.includes('wp-json')) stack.push('WordPress');
    if (html.includes('ng-app') || html.includes('ng-controller')) stack.push('AngularJS');
    if (html.includes('vuejs.org') || html.includes('__NUXT__')) stack.push('Vue.js');
    if (html.includes('jquery')) stack.push('jQuery');
  }

  // Scripts
  for (const src of scripts) {
    if (src.includes('googletagmanager')) stack.push('Google Tag Manager');
    if (src.includes('google-analytics') || src.includes('ga.js') || src.includes('analytics.js') || src.includes('gtag')) stack.push('Google Analytics');
    if (src.includes('cdn.jsdelivr')) stack.push('jsDelivr');
    if (src.includes('cdnjs.cloudflare')) stack.push('cdnjs');
    if (src.includes('unpkg.com')) stack.push('unpkg');
    if (src.includes('fonts.googleapis')) stack.push('Google Fonts');
    if (src.includes('stripe')) stack.push('Stripe');
    if (src.includes('hotjar')) stack.push('Hotjar');
    if (src.includes('segment')) stack.push('Segment');
    if (src.includes('cdn.amplitude')) stack.push('Amplitude');
    if (src.includes('sentry')) stack.push('Sentry');
    if (src.includes('algolia')) stack.push('Algolia');
    if (src.includes('intercom')) stack.push('Intercom');
  }

  return [...new Set(stack)];
}

export function detectCategory(title, desc) {
  const t = (title || '') + ' ' + (desc || '');
  if (/docs?|documentation|manual|guide|reference/i.test(t)) return 'Docs';
  if (/pricing|plans?|subscription|enterprise|pro\b/i.test(t)) return 'SaaS';
  if (/tool|utilit|generator|analyzer|checker|converter/i.test(t)) return 'Tool';
  if (/landing|home|welcome|introducing/i.test(t)) return 'Landing Page';
  if (/login|sign.?in|register|account/i.test(t)) return 'Auth';
  return 'Web App';
}
