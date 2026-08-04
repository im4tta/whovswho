const { sslChecker } = require('ssl-checker');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { host } = req.query;
  if (!host) return res.status(400).json({ error: 'Missing host' });

  try {
    const result = await sslChecker(host, {
      method: 'GET',
      validateSubjectAltName: true,
      timeout: 10000,
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({ error: 'SSL check failed', detail: err.message });
  }
};
