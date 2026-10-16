import React, { useMemo, useState } from 'react';
import { ASSAYS, ASSAY_CLASSES, REGULATORY_RULES, SOURCES, recommendPanel, type Assay } from '@assured/protocol';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList, StatedValue } from '../common/ProvenanceBadge';

/**
 * Tier 6 - CGT industry and CMC. The off-target assay decision matrix, plus the GMP transition notes.
 *
 * The recommendation logic lives in @assured/protocol so it is unit-tested: the panel it returns is
 * always orthogonal (one cell-based, one cell-free) and always verified for an IND, and it reports
 * its own gaps when it is not.
 */

type CellType = 'hipsc' | 'primary' | 'cell-line';
type DnaAvailability = 'abundant' | 'limited';

const CLASS_STYLE: Record<string, string> = {
  'in-situ': 'border-emerald-800 bg-emerald-950/30 text-emerald-200',
  'in-vitro': 'border-sky-800 bg-sky-950/30 text-sky-200',
  verification: 'border-violet-800 bg-violet-950/30 text-violet-200',
  structural: 'border-amber-800 bg-amber-950/30 text-amber-200',
};

const GMP_TOPICS = [
  {
    id: 'xeno-free',
    heading: 'Xeno-free and chemically defined substitution',
    body:
      'Basement-membrane extracts are animal-derived and lot-variable; recombinant laminin fragments are the usual clinical-grade substitute. Every substitution is a process change, and a line that was characterised on one matrix has not been characterised on the other. Make the swap early, re-characterise after it, and never on the batch you intend to file.',
  },
  {
    id: 'rnp',
    heading: 'RNP delivery is an advantage you should state',
    body:
      'Protein and synthetic RNA are cleared within days and leave nothing to integrate. There is no vector sequence to test for, no copy number to measure, and no insertional-mutagenesis argument to make. That is a shorter characterisation package than a plasmid or viral route, and it is worth saying so explicitly rather than leaving the reviewer to notice.',
  },
  {
    id: 'somatic-memory',
    heading: 'Donor somatic memory and starting-material choice',
    body:
      'Reprogrammed lines retain epigenetic traces of the tissue they came from, strongest at early passage. Cord blood, adult fibroblast and T-cell-derived lines are not interchangeable starting materials: T-cell-derived lines additionally carry rearranged TCR loci, which is either a feature or a confound depending on the product. Fix the source early; changing it late invalidates the comparability package.',
  },
  {
    id: 'potency',
    heading: 'Lot release and potency',
    body:
      'A release assay has to measure what the product is supposed to do, in a validated, quantitative way, with a specification set before the lot is tested. Marker expression is identity, not potency. Decide which functional readout carries the potency claim early, because validating it takes longer than developing it.',
  },
  {
    id: 'comparability',
    heading: 'Comparability across the scale-up',
    body:
      'Every move — flask to bioreactor, manual to automated, one matrix to another — needs a comparability exercise against the pre-change material. Build the bridging panel before you change anything, so the pre-change arm exists.',
  },
];

export const Tier6OffTargetMatrix: React.FC = () => {
  const [cellType, setCellType] = useState<CellType>('hipsc');
  const [dnaAvailability, setDnaAvailability] = useState<DnaAvailability>('abundant');
  const [multiplexed, setMultiplexed] = useState(false);
  const [indEnabling, setIndEnabling] = useState(true);

  const panel = useMemo(
    () => recommendPanel({ cellType, dnaAvailability, multiplexed, indEnabling }),
    [cellType, dnaAvailability, multiplexed, indEnabling],
  );
  const chosen = new Set(panel.assays.map((a) => a.id));

  return (
    <div className="space-y-14">
      <PersonaHeader personaId="cgt" />

      <section aria-labelledby="selector-heading">
        <h2 id="selector-heading" className="text-2xl font-semibold text-white">
          Build the panel
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
          Describe the programme and the matrix proposes a panel, with the reason for each assay and the gaps it leaves.
          The rule it will not break: nomination by two orthogonal methods, then quantification at every nominated site
          in the actual product.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <form className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6" aria-label="Programme parameters">
            <fieldset>
              <legend className="text-sm font-medium text-slate-200">Cell type being edited</legend>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ['hipsc', 'hiPSC'],
                    ['primary', 'Primary cells (T cells, HSPCs)'],
                    ['cell-line', 'Immortalised cell line'],
                  ] as Array<[CellType, string]>
                ).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                    <input type="radio" name="cellType" checked={cellType === value} onChange={() => setCellType(value)} className="accent-rose-500" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-200">Genomic DNA available</legend>
              <div className="mt-3 space-y-2">
                {(
                  [
                    ['abundant', 'Abundant (tens of micrograms)'],
                    ['limited', 'Limited (a few micrograms)'],
                  ] as Array<[DnaAvailability, string]>
                ).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
                    <input type="radio" name="dna" checked={dnaAvailability === value} onChange={() => setDnaAvailability(value)} className="accent-rose-500" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={multiplexed} onChange={(event) => setMultiplexed(event.target.checked)} className="mt-1 accent-rose-500" />
              More than one guide, or repeated cutting
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={indEnabling} onChange={(event) => setIndEnabling(event.target.checked)} className="mt-1 accent-rose-500" />
              IND-enabling (destined for a regulatory filing)
            </label>
          </form>

          <div aria-live="polite" className="space-y-5">
            <div className="rounded-2xl border border-rose-900 bg-rose-950/20 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-rose-300">Recommended panel</h3>
              <ul className="mt-4 space-y-3">
                {panel.assays.map((assay) => (
                  <li key={assay.id} className="flex flex-wrap items-baseline gap-3">
                    <span className="font-medium text-white">{assay.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${CLASS_STYLE[assay.class]}`}>{ASSAY_CLASSES[assay.class].label}</span>
                  </li>
                ))}
              </ul>
              <ul className="mt-5 space-y-2 border-t border-rose-900/60 pt-4">
                {panel.reasons.map((reason) => (
                  <li key={reason} className="text-sm leading-relaxed text-slate-300">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl border p-5 ${panel.gaps.length === 0 ? 'border-emerald-800 bg-emerald-950/20' : 'border-amber-800 bg-amber-950/20'}`}>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">Gaps</h3>
              {panel.gaps.length === 0 ? (
                <p className="mt-2 text-sm leading-relaxed text-emerald-100">
                  Orthogonal nomination and quantitative verification are both covered for this configuration.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {panel.gaps.map((gap) => (
                    <li key={gap} className="text-sm leading-relaxed text-amber-100">
                      {gap}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="matrix-heading">
        <h2 id="matrix-heading" className="text-2xl font-semibold text-white">
          The full matrix
        </h2>
        <p className="mt-2 text-slate-400">Assays in the recommended panel are highlighted.</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <caption className="sr-only">Off-target nomination and verification assays compared</caption>
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                <th scope="col" className="py-3 pr-4">Assay</th>
                <th scope="col" className="py-3 pr-4">Class</th>
                <th scope="col" className="py-3 pr-4">Principle</th>
                <th scope="col" className="py-3 pr-4">Material</th>
                <th scope="col" className="py-3 pr-4">DNA input</th>
                <th scope="col" className="py-3">Constraint</th>
              </tr>
            </thead>
            <tbody>
              {ASSAYS.map((assay: Assay) => (
                <tr key={assay.id} className={`border-b border-slate-800/60 ${chosen.has(assay.id) ? 'bg-rose-950/15' : ''}`}>
                  <th scope="row" className="py-4 pr-4 align-top font-medium text-slate-100">
                    {assay.name}
                    {chosen.has(assay.id) && <span className="ml-2 rounded-full border border-rose-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-300">in panel</span>}
                    {assay.note && <p className="mt-2 max-w-xs text-xs font-normal leading-relaxed text-slate-500">{assay.note}</p>}
                  </th>
                  <td className="py-4 pr-4 align-top">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap ${CLASS_STYLE[assay.class]}`}>{ASSAY_CLASSES[assay.class].label}</span>
                  </td>
                  <td className="py-4 pr-4 align-top leading-relaxed text-slate-400">{assay.principle}</td>
                  <td className="py-4 pr-4 align-top text-slate-400">{assay.material}</td>
                  <td className="py-4 pr-4 align-top">{assay.dnaInput ? <StatedValue stated={assay.dnaInput} showBadge={false} /> : <span className="text-slate-600">&mdash;</span>}</td>
                  <td className="py-4 align-top leading-relaxed text-slate-400">{assay.constraints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {Object.entries(ASSAY_CLASSES).map(([key, info]) => (
            <article key={key} className={`rounded-2xl border p-5 ${CLASS_STYLE[key]}`}>
              <h3 className="text-sm font-semibold uppercase tracking-widest">{info.label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                <strong className="font-semibold">Strength.</strong> {info.strength}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                <strong className="font-semibold">Weakness.</strong> {info.weakness}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="text-2xl font-semibold text-white">
          What a reviewer expects
        </h2>
        <ul className="mt-6 space-y-4">
          {REGULATORY_RULES.map((rule) => (
            <li key={rule.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="font-medium text-white">{rule.rule}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{rule.why}</p>
              <p className="mt-3 text-xs text-slate-500">{SOURCES[rule.sourceId]?.short}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="gmp-heading">
        <h2 id="gmp-heading" className="text-2xl font-semibold text-white">
          Research protocol to GMP process
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {GMP_TOPICS.map((topic) => (
            <article key={topic.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-base font-semibold text-white">{topic.heading}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{topic.body}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm leading-relaxed text-slate-400">
        This module teaches how the assays differ and what a package needs to contain. It is not regulatory advice, it
        is not a substitute for reading the current guidance, and the guidance moves. Confirm the current expectations
        with your regulatory function before they shape a filing.
      </p>

      <SourceList sourceIds={['FDA_2024_GENOME_EDITING', 'ICH_Q2R2', 'PLATFORM_SPEC']} />
    </div>
  );
};
