module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ip } = req.query;
  if (!ip) return res.status(400).json({ error: 'Missing ip' });

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'whovswho/1.0' },
    });
    if (!response.ok) return res.status(502).json({ error: 'ipapi.co request failed' });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Location lookup failed', detail: err.message });
  }
};
