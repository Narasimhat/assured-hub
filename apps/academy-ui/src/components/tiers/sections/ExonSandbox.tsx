import React, { useMemo, useState } from 'react';
import { ASSURED, MAX_GUIDE_CUT_DISTANCE, LAB_CONVENTIONS } from '@assured/protocol';
import { TeachingModelNotice } from '../../common/ProvenanceBadge';
import { benchHandoffUrl } from '../../../services/benchBridge';

/**
 * Exon and isoform mapping, and the two placement rules. The student tier's design sandbox.
 *
 * IMPORTANT, and stated on the page: the exon map is a SCHEMATIC. This repository ships sequences
 * only when a reference record backs them (see docs/FINDINGS.md: the previous Academy shipped
 * hand-typed guides and ssODNs that did not exist at the loci they claimed). NG_029120 is not in
 * apps/academy-core/references, so no SorCS1 sequence is shown here. The rules are what is taught;
 * anything sequence-level hands off to Bench, which loads real reference records.
 */

interface Exon {
  number: number;
  /** Present in every annotated transcript isoform. */
  constitutive: boolean;
  /** Relative width in the schematic only. Not a base count. */
  width: number;
  coding: boolean;
  note?: string;
}

/** Schematic only. Exon 4 and exon 25 are the two the protocol's worked example uses. */
const SORCS1_SCHEMATIC: Exon[] = [
  { number: 1, constitutive: false, width: 2, coding: false, note: 'Alternative first exons: isoforms start in different places, so an edit here misses some transcripts entirely.' },
  { number: 2, constitutive: false, width: 2, coding: true, note: 'Not shared by every isoform.' },
  { number: 3, constitutive: true, width: 2, coding: true },
  { number: 4, constitutive: true, width: 3, coding: true, note: 'Early, constitutive and coding. The knockout target in the protocol’s worked example.' },
  { number: 5, constitutive: true, width: 2, coding: true },
  { number: 12, constitutive: true, width: 2, coding: true, note: 'Mid-gene: a frameshift here still triggers nonsense-mediated decay, but a truncated product is more likely to retain partial function.' },
  { number: 24, constitutive: true, width: 2, coding: true },
  { number: 25, constitutive: true, width: 3, coding: true, note: 'Carries codon 1098. The knock-in target: H1098*, c.3292_3294delinsTAG.' },
  { number: 26, constitutive: true, width: 2, coding: true, note: 'Last exon: a premature stop here often escapes nonsense-mediated decay.' },
];

type Mode = 'knockout' | 'knockin';

function assessKnockout(exon: Exon | null) {
  if (!exon) return null;
  if (!exon.coding) {
    return { ok: false, headline: 'Not a coding exon', why: 'A frameshift needs a reading frame to shift. A non-coding exon gives you an indel with no effect on the protein.' };
  }
  if (!exon.constitutive) {
    return {
      ok: false,
      headline: 'Not constitutive',
      why: 'This exon is spliced out of some isoforms. Those transcripts keep their reading frame, so the gene is knocked out in some cells and not others — and the western blot that shows residual protein will be blamed on the antibody.',
    };
  }
  if (exon.number >= 24) {
    return {
      ok: false,
      headline: 'Too late in the transcript',
      why: 'Nonsense-mediated decay only degrades transcripts whose premature stop is far enough upstream of the final exon junction. A stop in the last exon or two usually escapes it, and a truncated protein is made.',
    };
  }
  if (exon.number > 8) {
    return {
      ok: true,
      headline: 'Workable, but not ideal',
      why: 'Constitutive and coding, so a frameshift will knock out all isoforms. An earlier exon removes more of the protein if decay is incomplete.',
    };
  }
  return {
    ok: true,
    headline: 'Good knockout target',
    why: 'Early, coding and present in every isoform: a frameshift here puts a premature stop well upstream of the last exon junction, so the transcript is degraded rather than translated into a truncated protein.',
  };
}

function assessKnockin(cutDistance: number, guides: number, blocksAllGuides: boolean) {
  const issues: Array<{ level: 'error' | 'warning'; text: string }> = [];
  if (cutDistance > MAX_GUIDE_CUT_DISTANCE) {
    issues.push({
      level: 'error',
      text: `${cutDistance} bp exceeds the design engine's own limit of ${MAX_GUIDE_CUT_DISTANCE} bp. Conversion falls off with distance: most clones will copy the donor's silent blocking changes without copying the edit, and read as edited when they are not.`,
    });
  } else if (cutDistance > 10) {
    issues.push({
      level: 'warning',
      text: `${cutDistance} bp is inside the engine's limit but past the point where conversion starts dropping. Expect more partial conversions. If a nearer PAM exists, use it.`,
    });
  }
  if (guides < LAB_CONVENTIONS.minGuides.snp) {
    issues.push({
      level: 'warning',
      text: `The lab convention is ${LAB_CONVENTIONS.minGuides.snp} guides. One guide gives one chance to cut each allele, which lowers the odds of getting a homozygous clone.`,
    });
  }
  if (!blocksAllGuides) {
    issues.push({
      level: 'error',
      text: 'The donor must carry silent blocking changes for every guide. An allele repaired from a donor that still matches a guide gets cut again, and the HDR product you worked for becomes an indel.',
    });
  }
  return issues;
}

export const ExonSandbox: React.FC = () => {
  const [mode, setMode] = useState<Mode>('knockout');
  const [selectedExon, setSelectedExon] = useState<number | null>(null);
  const [cutDistance, setCutDistance] = useState(4);
  const [guides, setGuides] = useState(2);
  const [blocksAllGuides, setBlocksAllGuides] = useState(true);

  const exon = useMemo(() => SORCS1_SCHEMATIC.find((e) => e.number === selectedExon) ?? null, [selectedExon]);
  const koVerdict = useMemo(() => assessKnockout(exon), [exon]);
  const kiIssues = useMemo(() => assessKnockin(cutDistance, guides, blocksAllGuides), [cutDistance, guides, blocksAllGuides]);

  const handoff = benchHandoffUrl({
    name: mode === 'knockout' ? 'Academy: SORCS1 knockout' : 'Academy: SORCS1 H1098*',
    gene: 'SORCS1',
    editType: mode === 'knockout' ? 'ko' : 'pm',
    mutation: mode === 'knockin' ? 'H1098*' : undefined,
  });

  return (
    <div className="space-y-12">

      <TeachingModelNotice>
        The exon map below is a <strong>schematic</strong>: the boxes show which exons are shared across isoforms and
        roughly where they sit, not their lengths and not their sequence. This repository ships sequence only where a
        reference record backs it, and {ASSURED.design.recordTypes} record NG_029120 is not bundled here. Work the rules
        out on the schematic, then take the target into ASSURED Bench, which loads the real record.
      </TeachingModelNotice>

      <section aria-labelledby="mode-heading">
        <h2 id="mode-heading" className="text-2xl font-semibold text-white">
          Two edits, two different rules
        </h2>
        <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Edit type">
          {(['knockout', 'knockin'] as Mode[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-cyan-400 ${
                mode === option ? 'border-emerald-600 bg-emerald-950/40 text-emerald-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {option === 'knockout' ? 'Knockout (frameshift indel)' : 'SNP knock-in (HDR from an ssODN)'}
            </button>
          ))}
        </div>
        <p className="mt-4 max-w-3xl rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm leading-relaxed text-slate-300">
          {mode === 'knockout' ? ASSURED.design.knockoutRule : ASSURED.design.knockinRule}
        </p>
      </section>

      {mode === 'knockout' && (
        <section aria-labelledby="exon-heading">
          <h2 id="exon-heading" className="text-2xl font-semibold text-white">
            Choose an exon to target
          </h2>
          <p className="mt-2 max-w-3xl text-slate-400">
            SORCS1 (ENSG00000108018), schematic. Solid boxes are present in every annotated isoform; hatched boxes are not.
          </p>

          <div className="mt-6 overflow-x-auto pb-2">
            <ul className="flex min-w-max items-end gap-1" aria-label="Exon map">
              {SORCS1_SCHEMATIC.map((e, index) => {
                const previous = SORCS1_SCHEMATIC[index - 1];
                const gap = previous && e.number - previous.number > 1;
                const selected = selectedExon === e.number;
                return (
                  <React.Fragment key={e.number}>
                    {gap && (
                      <li aria-hidden="true" className="px-2 pb-6 text-xs text-slate-600">
                        &hellip;
                      </li>
                    )}
                    <li>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedExon(e.number)}
                        style={{ width: `${e.width * 28}px` }}
                        className={`flex h-16 flex-col items-center justify-center rounded border-2 text-xs font-medium focus-visible:outline focus-visible:outline-cyan-400 ${
                          selected ? 'border-cyan-400 bg-cyan-900/50 text-cyan-100' : e.constitutive ? 'border-emerald-800 bg-emerald-950/50 text-emerald-200 hover:border-emerald-600' : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <span>{e.number}</span>
                        {!e.constitutive && <span className="mt-0.5 text-[9px] uppercase tracking-wider">alt</span>}
                        {!e.coding && <span className="mt-0.5 text-[9px] uppercase tracking-wider">UTR</span>}
                      </button>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </div>

          <div aria-live="polite" className="mt-6">
            {!exon && <p className="text-sm text-slate-400">Select an exon to see whether it works as a knockout target.</p>}
            {exon && koVerdict && (
              <article className={`rounded-2xl border p-6 ${koVerdict.ok ? 'border-emerald-800 bg-emerald-950/20' : 'border-rose-800 bg-rose-950/20'}`}>
                <p className={`text-xs font-semibold uppercase tracking-widest ${koVerdict.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  Exon {exon.number} &middot; {koVerdict.headline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">{koVerdict.why}</p>
                {exon.note && <p className="mt-3 border-t border-slate-800 pt-3 text-sm leading-relaxed text-slate-400">{exon.note}</p>}
              </article>
            )}
          </div>
        </section>
      )}

      {mode === 'knockin' && (
        <section aria-labelledby="ki-heading">
          <h2 id="ki-heading" className="text-2xl font-semibold text-white">
            Place the cut, and check the donor
          </h2>
          <p className="mt-2 max-w-3xl text-slate-400">
            Target: SORCS1 exon 25, H1098*, c.3292_3294delinsTAG. You cannot move the mutation, so the only thing you
            control is which PAM you choose and therefore how far the cut lands from it.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div>
                <label htmlFor="cut-distance" className="block text-sm font-medium text-slate-200">
                  Distance from cut site to the edited base: <span className="font-mono text-cyan-300">{cutDistance} bp</span>
                </label>
                <input
                  id="cut-distance"
                  type="range"
                  min={0}
                  max={30}
                  value={cutDistance}
                  onChange={(event) => setCutDistance(Number(event.target.value))}
                  className="mt-3 w-full accent-cyan-500"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>0 bp</span>
                  <span>engine limit {MAX_GUIDE_CUT_DISTANCE} bp</span>
                  <span>30 bp</span>
                </div>
              </div>

              <div>
                <label htmlFor="guide-count" className="block text-sm font-medium text-slate-200">
                  Number of guides
                </label>
                <select
                  id="guide-count"
                  value={guides}
                  onChange={(event) => setGuides(Number(event.target.value))}
                  className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-cyan-400"
                >
                  <option value={1}>1 guide</option>
                  <option value={2}>2 guides</option>
                </select>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="blocking"
                  type="checkbox"
                  checked={blocksAllGuides}
                  onChange={(event) => setBlocksAllGuides(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-cyan-500"
                />
                <label htmlFor="blocking" className="text-sm leading-relaxed text-slate-300">
                  The ssODN carries silent blocking changes for <em>every</em> guide
                </label>
              </div>
            </div>

            <div aria-live="polite" className="space-y-3">
              {kiIssues.length === 0 ? (
                <article className="rounded-2xl border border-emerald-800 bg-emerald-950/20 p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Design passes</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">
                    Cut within {MAX_GUIDE_CUT_DISTANCE} bp of the edit, {LAB_CONVENTIONS.minGuides.snp} guides, and a donor that blocks both of them.
                    This is the design the pipeline is built around.
                  </p>
                </article>
              ) : (
                kiIssues.map((issue, index) => (
                  <article
                    key={index}
                    className={`rounded-2xl border p-5 ${issue.level === 'error' ? 'border-rose-800 bg-rose-950/20' : 'border-amber-800 bg-amber-950/20'}`}
                  >
                    <p className={`text-xs font-semibold uppercase tracking-widest ${issue.level === 'error' ? 'text-rose-300' : 'text-amber-300'}`}>
                      {issue.level === 'error' ? 'Will not work' : 'Will cost you clones'}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">{issue.text}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="handoff-heading" className="rounded-2xl border border-cyan-900 bg-cyan-950/20 p-6">
        <h2 id="handoff-heading" className="text-xl font-semibold text-white">
          Now do it against the real sequence
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          The schematic gets the rules across. ASSURED Bench loads the reference record, enumerates the real PAMs, scores
          the candidates and writes the donor. This link opens Bench with the target already filled in.
        </p>
        <a
          href={handoff}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-700 bg-cyan-950/60 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:border-cyan-500 focus-visible:outline focus-visible:outline-cyan-400"
        >
          Open SORCS1 {mode === 'knockout' ? 'knockout' : 'H1098*'} in ASSURED Bench <span aria-hidden="true">&rarr;</span>
        </a>
      </section>

      <section aria-labelledby="ice-heading">
        <h2 id="ice-heading" className="text-2xl font-semibold text-white">
          Reading the pool before you clone
        </h2>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-slate-300">
          <p>
            After editing, the whole population is amplified at the target and Sanger-sequenced in one go. The trace is a
            mixture: every allele in the pool contributes to every peak.
          </p>
          <p>
            Upstream of the cut, the edited and unedited alleles agree, so the trace is clean. From the cut onward, alleles
            with different indels are out of register with each other and the peaks superimpose. Deconvolution works out which
            mixture of indels best explains the mess, and reports the fraction. {ASSURED.deconvolution.method}.
          </p>
          <p>
            <strong className="text-white">What the number means:</strong> a KO or KI score is the fraction of edited{' '}
            <em>sequence</em> in the pool, not the fraction of edited <em>cells</em>, and not a promise about any single
            clone. It tells you whether cloning is worth the plate.
          </p>
          <p className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-400">
            A trace that is clean on both sides of the cut means nothing was edited. A trace that is noisy{' '}
            <em>before</em> the cut means the sequencing failed, not the editing — check the primer and the read quality
            before concluding anything about the experiment.
          </p>
        </div>
      </section>

    </div>
  );
};
