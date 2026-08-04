// Domain-string normalization and date/duration formatting helpers.

export const cleanDomain = (s) => String(s || '').trim().toLowerCase()
  .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\.+$/, '').split('/')[0].split('?')[0];

export const stripTrailingDots = (s) => String(s || '').replace(/\.+$/, '');

export const hasTld = (s) => /^[a-z0-9-]+\.[a-z]{2,}$/i.test(cleanDomain(s));

export const formatDate = (s) => {
  if (!s) return null;
  try { return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return s; }
};

export const daysUntil = (s) => {
  if (!s) return null;
  try { return Math.ceil((new Date(s) - new Date()) / 86400000); } catch { return null; }
};

export const ageInYears = (s) => {
  if (!s) return null;
  const yrs = (Date.now() - new Date(s).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (isNaN(yrs)) return null;
  if (yrs < 1) return `${Math.round(yrs * 12)}mo`;
  return `${yrs.toFixed(1)}yr`;
};

export const tenure = (c, e) => {
  if (!c || !e) return null;
  const yrs = (new Date(e) - new Date(c)) / (1000 * 60 * 60 * 24 * 365.25);
  return `${yrs.toFixed(1)}yr`;
};

export const expiryClass = (d) => (d == null ? '' : d < 30 ? 'bad' : d < 90 ? 'warn' : 'good');
