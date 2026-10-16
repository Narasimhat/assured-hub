import React, { useMemo, useState } from 'react';
import { ASSAYS, ASSAY_CLASSES, REGULATORY_RULES, SOURCES, recommendPanel, type Assay } from '@assured/protocol';
import { StatedValue } from '../../common/ProvenanceBadge';

/**
 * Which off-target assay answers which question. Shown in the research-lab tier, because choosing
 * what off-target evidence to generate is the decision a PI makes and then has to defend.
 *
 * The recommendation logic lives in @assured/protocol so it is unit-tested: the panel it returns is
 * always orthogonal (one cell-based, one cell-free), it adds quantitative verification when the work
 * is heading for a clinical programme, and it reports its own gaps when it is not complete.
 *
 * The GMP, CMC and IND-filing material that accompanied this matrix in an earlier draft was dropped:
 * no tier in this Academy is an industry audience. What stays is the assay comparison and the
 * expectations a reviewer will hold the evidence to, both of which a research lab needs.
 */

type CellType = 'hipsc' | 'primary' | 'cell-line';
type DnaAvailability = 'abundant' | 'limited';

const CLASS_STYLE: Record<string, string> = {
  'in-situ': 'border-emerald-800 bg-emerald-950/30 text-emerald-200',
  'in-vitro': 'border-sky-800 bg-sky-950/30 text-sky-200',
  verification: 'border-violet-800 bg-violet-950/30 text-violet-200',
  structural: 'border-amber-800 bg-amber-950/30 text-amber-200',
};


export const OffTargetMatrix: React.FC = () => {
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

      <section aria-labelledby="selector-heading">
        <h2 id="selector-heading" className="text-2xl font-semibold text-white">
          Build the panel
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
          Describe the experiment and the matrix proposes a panel, with the reason for each assay and the gaps it
          leaves. The rule it will not break: nominate with two orthogonal methods, one cell-based and one cell-free,
          then quantify at every nominated site in the cells you will actually use.
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
              Heading for a clinical programme, not only a paper
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


      <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm leading-relaxed text-slate-400">
        This section teaches how the assays differ and what evidence each one can support. It is not regulatory advice
        and the guidance moves. If the work is heading for a clinical programme, confirm the current expectations with
        a regulatory function before they shape anything.
      </p>

    </div>
  );
};
