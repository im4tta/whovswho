import { Font, sone } from 'sone';
import { buildDomainCompare, buildVsCompare } from './sonelayout.mjs';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

let fontsReady = false;

const FONT_SPECS = [
  {
    alias: 'ChakraPetch',
    family: 'Chakra Petch',
    weights: [
      { g: '400', s: '400' },
      { g: '700', s: 'bold' },
    ],
  },
  {
    alias: 'JetBrainsMono',
    family: 'JetBrains Mono',
    weights: [
      { g: '400', s: '400' },
      { g: '700', s: 'bold' },
    ],
  },
  {
    alias: 'NotoSansKhmer',
    family: 'Noto Sans Khmer',
    weights: [
      { g: '400', s: '400' },
      { g: '700', s: 'bold' },
    ],
  },
];

async function fetchFontUrl(family, weight) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) Chrome/125.0.0.0',
      },
    },
  ).then((r) => r.text());
  return css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)?.[1] ?? null;
}

async function ensureFonts() {
  if (fontsReady) return;
  const tmp = tmpdir();
  for (const { alias, family, weights } of FONT_SPECS) {
    for (const { g, s } of weights) {
      const file = join(tmp, `sone-${alias}-${g}.ttf`);
      if (!existsSync(file)) {
        const url = await fetchFontUrl(family, g);
        if (!url) {
          console.warn(`[export] Font not found: ${alias} ${g}`);
          continue;
        }
        writeFileSync(
          file,
          Buffer.from(await fetch(url).then((r) => r.arrayBuffer())),
        );
      }
      await Font.load(alias, [file], { weight: s });
    }
  }
  fontsReady = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  if (!body?.type) {
    res.status(400).json({ error: 'Missing type' });
    return;
  }

  try {
    await ensureFonts();

    let layout;

    if (body.type === 'domain-compare') {
      if (!body.domainA || !body.domainB) {
        res.status(400).json({ error: 'Missing domainA or domainB' });
        return;
      }
      layout = buildDomainCompare(body, body.theme || 'dark');
    } else if (body.type === 'vs-compare') {
      if (!body.domainA || !body.domainB) {
        res.status(400).json({ error: 'Missing domainA or domainB' });
        return;
      }
      layout = buildVsCompare(body, body.theme || 'dark');
    } else {
      res.status(400).json({ error: `Unknown type: ${body.type}` });
      return;
    }

    const png = await sone(layout).png({ density: 4 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.end(png);
  } catch (err) {
    console.error('[export]', err);
    res.status(500).json({ error: 'Render failed', detail: String(err.message) });
  }
}
