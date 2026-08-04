import React from 'react';

export default function SectionStatus({ state }) {
  if (state === 'loading') return <span className="section-status loading"><span className="dot" />Loading</span>;
  if (state === 'ok') return <span className="section-status ok"><span className="dot" />OK</span>;
  if (state === 'error') return <span className="section-status error"><span className="dot" />Error</span>;
  return <span className="section-status skip"><span className="dot" />N/A</span>;
}
