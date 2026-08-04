const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  let browser;
  try {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.end(screenshot);
  } catch (err) {
    return res.status(502).json({ error: 'Screenshot failed', detail: err.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
};
