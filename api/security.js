module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
      redirect: 'manual',
      headers: { 'User-Agent': 'whovswho-security/1.0' },
    });

    const headers = {};
    response.headers.forEach((v, k) => { headers[k] = v; });

    const security = {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      headers,
      hsts: !!headers['strict-transport-security'],
      csp: !!headers['content-security-policy'],
      xfo: headers['x-frame-options'] || null,
      xxp: headers['x-xss-protection'] || null,
      cto: headers['x-content-type-options'] || null,
      rp: headers['referrer-policy'] || null,
      permissions: headers['permissions-policy'] || headers['feature-policy'] || null,
      cors: headers['access-control-allow-origin'] || null,
      server: headers['server'] || null,
      via: headers['via'] || null,
      cfRay: headers['cf-ray'] || null,
      waf: headers['cf-ray'] ? 'Cloudflare' : headers['x-sucuri-id'] ? 'Sucuri' : headers['x-powered-by'] || null,
    };

    return res.status(200).json(security);
  } catch (err) {
    return res.status(502).json({ error: 'Security check failed', detail: err.message });
  }
};
