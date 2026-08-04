// Cloudflare Worker — CORS-safe proxy for WHOIS/DNS APIs
// Deploy to your worker subdomain (e.g. worker.whovswho.com)
//
// Usage:
//   GET /proxy?url=https://who-dat.as93.net/example.com
//   GET /proxy?url=https://dns.google/resolve?name=example.com&type=A

const ALLOWED_DOMAINS = [
  'who-dat.as93.net',
  'dns.google',
  'ipapi.co',
  'archive.org',
  'crt.sh',
  'ipinfo.io',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get('url');

  if (!target) {
    return new Response(JSON.stringify({ error: 'Missing url param' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Validate target URL
  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid url' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Restrict to allowed upstreams
  const isAllowed = ALLOWED_DOMAINS.some(d =>
    targetUrl.hostname === d || targetUrl.hostname.endsWith('.' + d),
  );
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
      status: 403,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(target, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
        'User-Agent': 'whovswho-worker/1.0',
        'Accept': 'application/json,text/html,*/*',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isText = contentType.includes('json') || contentType.includes('text') || contentType.includes('html');
    const isBinary = contentType.includes('image') || contentType.includes('font') || contentType.includes('octet-stream');

    const corsResponseHeaders = {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=300',
    };

    if (isBinary) {
      const buffer = await response.arrayBuffer();
      return new Response(buffer, {
        status: response.status,
        headers: {
          ...corsResponseHeaders,
          'Content-Type': contentType,
        },
      });
    }

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        ...corsResponseHeaders,
        'Content-Type': isText ? contentType : 'text/plain',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed', detail: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

export default { fetch: handleRequest };
