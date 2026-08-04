const FETCH_TIMEOUT = 15000;
const LONG_TIMEOUT = 30000;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'DomainCompare/1.0',
];

const ACCEPT_VARIANTS = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'application/json,text/html,*/*',
  '*/*',
];

async function tryFetch(url, ua, accept, timeout) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
      headers: {
        'User-Agent': ua,
        'Accept': accept,
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    return response;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  // Fast attempts first, then longer timeout as fallback
  for (const timeout of [FETCH_TIMEOUT, LONG_TIMEOUT]) {
    for (const ua of USER_AGENTS) {
      for (const accept of ACCEPT_VARIANTS) {
        const response = await tryFetch(url, ua, accept, timeout);
        if (response) {
          const contentType = response.headers.get('content-type') || '';
          const isBinary = contentType.startsWith('image/') || contentType.startsWith('font/') ||
                           contentType.startsWith('video/') || contentType.includes('octet-stream');

          // Handle 404 and other client errors gracefully
          if (response.status >= 400 && response.status < 500) {
            return res.status(200).send('');
          }

          if (isBinary) {
            const buffer = Buffer.from(await response.arrayBuffer());
            return res.status(response.status)
              .setHeader('Content-Type', contentType)
              .send(buffer);
          } else {
            const text = await response.text();
            return res.status(response.status).send(text);
          }
        }
      }
    }
  }

  return res.status(502).json({ error: 'All fetch attempts failed' });
};
