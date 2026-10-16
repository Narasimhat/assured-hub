import React from 'react';
import { PROVENANCE_LABELS, SOURCES, type Provenance, type Stated } from '@assured/protocol';

/**
 * Nothing in the Academy renders a number without saying where it came from.
 * docs/FINDINGS.md records what happened the last time it did.
 */

const STYLES: Record<Provenance, string> = {
  published: 'border-emerald-700 bg-emerald-950/50 text-emerald-200',
  'owner-stated': 'border-sky-700 bg-sky-950/50 text-sky-200',
  illustrative: 'border-amber-700 bg-amber-950/50 text-amber-200',
};

export const ProvenanceBadge: React.FC<{ provenance: Provenance; sourceId?: string; className?: string }> = ({
  provenance,
  sourceId,
  className = '',
}) => {
  const source = sourceId ? SOURCES[sourceId] : undefined;
  const title = source ? `${PROVENANCE_LABELS[provenance]} - ${source.citation}` : PROVENANCE_LABELS[provenance];
  return (
    <span
      title={title}
      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${STYLES[provenance]} ${className}`}
    >
      {PROVENANCE_LABELS[provenance]}
    </span>
  );
};

/** A stated value with its unit and its badge, for use in a table cell or inline. */
export const StatedValue: React.FC<{ stated: Stated<unknown>; className?: string; showBadge?: boolean }> = ({
  stated,
  className = '',
  showBadge = true,
}) => (
  <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
    <span className="font-mono text-slate-100">
      {String(stated.value)}
      {stated.unit ? ` ${stated.unit}` : ''}
    </span>
    {showBadge && <ProvenanceBadge provenance={stated.provenance} sourceId={stated.sourceId} />}
  </span>
);

/** The reference list for a tier page: every source actually used on it. */
export const SourceList: React.FC<{ sourceIds: string[]; heading?: string }> = ({ sourceIds, heading = 'Sources' }) => {
  const unique = [...new Set(sourceIds)].filter((id) => SOURCES[id]);
  if (unique.length === 0) return null;
  return (
    <section aria-label={heading} className="mt-10 border-t border-slate-800 pt-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{heading}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-400">
        {unique.map((id) => {
          const source = SOURCES[id];
          return (
            <li key={id}>
              {source.citation}{' '}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 focus-visible:outline focus-visible:outline-cyan-400"
                >
                  {source.doi ? `doi:${source.doi}` : 'link'} &#8599;
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** Standing warning for anything a simulator computes. */
export const TeachingModelNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p role="note" className="rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-100">
    <strong className="font-semibold">Teaching model.</strong> {children}
  </p>
);
