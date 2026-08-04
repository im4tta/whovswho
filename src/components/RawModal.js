import React, { useState } from 'react';

export default function RawModal({ result, open, onClose }) {
  const [tab, setTab] = useState('all');
  if (!open || !result) return null;

  const sections = {
    all: { label: 'All', data: result },
    whois: { label: 'WHOIS', data: result.whois },
    dns: { label: 'DNS', data: result.dns },
    geo: { label: 'IP', data: result.geo },
    subs: { label: 'Subs', data: result.subs },
    wayback: { label: 'Archive', data: result.wayback },
    http: { label: 'HTTP', data: result.http },
    social: { label: 'Social', data: result.social },
    sitemap: { label: 'Sitemap', data: result.sitemap },
    robots: { label: 'Robots', data: result.robots },
    sec: { label: 'Sec.txt', data: result.sec },
    ssl: { label: 'SSL', data: result.ssl },
    redirects: { label: 'Redirects', data: result.redirects },
  };

  const syntaxHL = (obj) => {
    let s = JSON.stringify(obj, null, 2);
    if (s === undefined) s = 'null';
    return s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '"<span class="k">$1</span>":')
      .replace(/: "([^"]*)"/g, ': "<span class="s">$1</span>"')
      .replace(/: (\d+\.?\d*)/g, ': <span class="n">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="b">$1</span>');
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Raw Data · {result.domain}</h3>
          <button className="x-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-tabs">
          {Object.entries(sections).map(([k, v]) => (
            <button key={k} className={`modal-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="modal-body">
          <pre dangerouslySetInnerHTML={{ __html: syntaxHL(sections[tab].data) || 'null' }} />
        </div>
      </div>
    </div>
  );
}

