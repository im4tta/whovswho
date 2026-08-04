module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const startUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const chain = [];
    let currentUrl = startUrl;
    let maxHops = 20;

    for (let i = 0; i < maxHops; i++) {
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000),
        redirect: 'manual',
        headers: { 'User-Agent': 'whovswho-redirects/1.0' },
      });

      const hop = {
        step: i,
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        location: response.headers.get('location') || null,
      };
      chain.push(hop);

      if (response.status < 300 || response.status >= 400) break;
      if (!response.headers.get('location')) break;

      const location = response.headers.get('location');
      currentUrl = new URL(location, currentUrl).href;

      if (chain.some(h => h.url === currentUrl)) {
        chain.push({ step: i + 1, url: currentUrl, status: 0, statusText: 'Redirect Loop', location: null });
        break;
      }
    }

    return res.status(200).json({
      start: startUrl,
      final: chain[chain.length - 1]?.url || startUrl,
      totalHops: chain.length,
      chain,
    });
  } catch (err) {
    return res.status(502).json({ error: 'Redirect check failed', detail: err.message });
  }
};
