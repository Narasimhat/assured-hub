import React, { useMemo, useState } from 'react';
import { ICC_REFERENCE, compareDesigns, effectiveNCurve, CRISPR_MIX, type CrisprMixLocus } from '@assured/protocol';
import { StatedValue, TeachingModelNotice } from '../../common/ProvenanceBadge';

/**
 * Experimental power and CRISPR-MiX, for the research-lab tier.
 *
 * Two halves: the design-effect explorer that makes the isogenic argument quantitative, and the
 * CRISPR-MiX guide including where pooling stops helping.
 *
 * The ICC is a slider, not a constant: the dataset quoted in the platform specification could not
 * be located in the literature (see docs/AUDIT_2026-10-16.md section 5), and the argument does not
 * need a specific value. The page says so.
 */

export const PowerAndCrisprMix: React.FC = () => {
  const [icc, setIcc] = useState(ICC_REFERENCE.medianIcc.value);
  const [totalSamples, setTotalSamples] = useState(6);
  const [linesPerDonor, setLinesPerDonor] = useState(3);

  const comparison = useMemo(() => compareDesigns({ icc, totalSamples }), [icc, totalSamples]);
  const curve = useMemo(() => effectiveNCurve({ icc, linesPerDonor, maxDonors: 12 }), [icc, linesPerDonor]);
  const maxEffective = Math.max(...curve.map((p) => p.effectiveN), 1);
  const bestEffective = Math.max(...comparison.designs.map((d) => d.effectiveN));

  return (
    <div className="space-y-14">

      <section aria-labelledby="power-heading">
        <h2 id="power-heading" className="text-2xl font-semibold text-white">
          What another donor actually buys you
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
          When a large share of transcriptomic variance sits between donors, samples from one donor are not independent
          observations. The standard correction is the design effect: with <span className="font-mono">m</span> lines per
          donor and intraclass correlation <span className="font-mono">rho</span>, the effective sample size is{' '}
          <span className="font-mono text-cyan-300">n &times; m / (1 + (m &minus; 1) rho)</span>. Move the slider and watch the
          denominator eat the extra samples.
        </p>

        <div className="mt-8 rounded-2xl border border-amber-900 bg-amber-950/20 p-5">
          <p className="text-sm leading-relaxed text-amber-100">
            <strong className="font-semibold">On the number itself.</strong> The platform specification quotes a median
            donor ICC of <span className="font-mono text-amber-200">{(ICC_REFERENCE.medianIcc.value * 100).toFixed(1)}%</span> across{' '}
            <span className="font-mono text-amber-200">{ICC_REFERENCE.genes.value.toLocaleString('en-GB')}</span> protein-coding
            genes in <span className="font-mono text-amber-200">{ICC_REFERENCE.donors.value}</span> donors.{' '}
            {ICC_REFERENCE.caution}
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label htmlFor="icc" className="block text-sm font-medium text-slate-200">
                Donor ICC: <span className="font-mono text-violet-300">{(icc * 100).toFixed(1)}%</span>
              </label>
              <input
                id="icc"
                type="range"
                min={0}
                max={0.9}
                step={0.01}
                value={icc}
                onChange={(event) => setIcc(Number(event.target.value))}
                className="mt-3 w-full accent-violet-500"
              />
              <div className="mt-1 flex justify-between text-xs text-slate-500">
                <span>0%</span>
                <span>90%</span>
              </div>
            </div>
            <div>
              <label htmlFor="samples" className="block text-sm font-medium text-slate-200">
                Samples you can afford to sequence per arm: <span className="font-mono text-violet-300">{totalSamples}</span>
              </label>
              <input
                id="samples"
                type="range"
                min={2}
                max={24}
                value={totalSamples}
                onChange={(event) => setTotalSamples(Number(event.target.value))}
                className="mt-3 w-full accent-violet-500"
              />
            </div>
            <div>
              <label htmlFor="lines" className="block text-sm font-medium text-slate-200">
                Lines per donor, for the curve: <span className="font-mono text-violet-300">{linesPerDonor}</span>
              </label>
              <input
                id="lines"
                type="range"
                min={1}
                max={8}
                value={linesPerDonor}
                onChange={(event) => setLinesPerDonor(Number(event.target.value))}
                className="mt-3 w-full accent-violet-500"
              />
            </div>
          </div>

          <div aria-live="polite" className="space-y-4">
            {comparison.designs.map((design) => {
              const isBest = design.effectiveN >= bestEffective;
              return (
                <article
                  key={design.id}
                  className={`rounded-2xl border p-5 ${isBest ? 'border-emerald-700 bg-emerald-950/20' : 'border-slate-800 bg-slate-900'}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">{design.label}</h3>
                    <p className="font-mono text-sm text-slate-300">
                      effective n <span className={`text-xl font-semibold ${isBest ? 'text-emerald-300' : 'text-slate-200'}`}>{design.effectiveN}</span>
                      <span className="ml-3 text-xs text-slate-500">design effect {design.designEffect}</span>
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-3 h-2 rounded-full bg-slate-800"
                  >
                    <div
                      className={`h-2 rounded-full ${isBest ? 'bg-emerald-500' : 'bg-slate-600'}`}
                      style={{ width: `${Math.max(2, (design.effectiveN / Math.max(bestEffective, 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{design.verdict}</p>
                </article>
              );
            })}
          </div>
        </div>

        <figure className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <figcaption className="text-sm text-slate-300">
            Effective n against donor count, at {linesPerDonor} line{linesPerDonor === 1 ? '' : 's'} per donor and ICC{' '}
            {(icc * 100).toFixed(0)}%. The grey bar is the total samples sequenced; the violet bar is what they are worth.
          </figcaption>
          <ul className="mt-5 space-y-2">
            {curve.map((point) => (
              <li key={point.donors} className="grid grid-cols-[3rem_1fr_5rem] items-center gap-3 text-xs">
                <span className="text-right font-mono text-slate-500">{point.donors}</span>
                <span aria-hidden="true" className="relative h-4 rounded bg-slate-800">
                  <span className="absolute inset-y-0 left-0 rounded bg-slate-700" style={{ width: `${(point.totalSamples / (12 * linesPerDonor)) * 100}%` }} />
                  <span className="absolute inset-y-0 left-0 rounded bg-violet-500" style={{ width: `${(point.effectiveN / Math.max(maxEffective, 1)) * 100}%` }} />
                </span>
                <span className="font-mono text-slate-400">
                  {point.effectiveN} / {point.totalSamples}
                </span>
              </li>
            ))}
          </ul>
        </figure>

        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">What this calculation does not say</h3>
          <ul className="space-y-2">
            {comparison.caveats.map((caveat) => (
              <li key={caveat} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm leading-relaxed text-slate-400">
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="mix-heading">
        <h2 id="mix-heading" className="text-2xl font-semibold text-white">
          CRISPR-MiX: pooled donors, and where they stop helping
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">{CRISPR_MIX.purpose}</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-base font-semibold text-white">The reaction</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="sgRNA" value={CRISPR_MIX.rnp.sgRNA} />
              <Row label="SpCas9" value={CRISPR_MIX.rnp.cas9} />
              <Row label="Pooled ssODNs" value={CRISPR_MIX.rnp.pooledSsodn} />
              <Row label="Complexing" value={CRISPR_MIX.rnp.complexingMinutes} />
              <Row label="Cells" value={CRISPR_MIX.electroporation.cells} />
              <Row label="Buffer" value={CRISPR_MIX.electroporation.bufferVolume} />
              <Row label="Voltage" value={CRISPR_MIX.electroporation.voltage} />
              <Row label="Pulse width" value={CRISPR_MIX.electroporation.pulseWidthMs} />
            </dl>
            <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400">{CRISPR_MIX.rnp.molarRatioNote}</p>
            <p className="mt-2 text-sm text-slate-400">{CRISPR_MIX.recovery}</p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-base font-semibold text-white">What makes a donor work</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                {CRISPR_MIX.donorDesignParameters.map((param) => (
                  <li key={param.key} className="flex items-start gap-3">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span>{param.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-slate-800 pt-4 text-sm leading-relaxed text-slate-400">
                Pooling works because these interact with the locus in ways you cannot predict in advance. Instead of
                guessing which single donor suits the site, deliver several and let the locus choose.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-900 bg-rose-950/20 p-6">
              <h3 className="text-base font-semibold text-white">Where it stops</h3>
              <p className="mt-3 text-sm leading-relaxed text-rose-100">{CRISPR_MIX.boundary}</p>
            </div>
          </div>
        </div>

        <h3 className="mt-10 text-lg font-semibold text-white">Locus behaviour</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Loci where pooled donors help and where they do not</caption>
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                <th scope="col" className="py-3 pr-4">Gene</th>
                <th scope="col" className="py-3 pr-4">Behaviour</th>
                <th scope="col" className="py-3">What to do</th>
              </tr>
            </thead>
            <tbody>
              {CRISPR_MIX.loci.map((locus: CrisprMixLocus) => (
                <tr key={locus.gene} className="border-b border-slate-800/60">
                  <th scope="row" className="py-4 pr-4 font-mono font-medium text-slate-100">{locus.gene}</th>
                  <td className="py-4 pr-4">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs ${
                        locus.behaviour === 'responsive' ? 'border-emerald-700 bg-emerald-950/40 text-emerald-200' : 'border-rose-700 bg-rose-950/40 text-rose-200'
                      }`}
                    >
                      {locus.behaviour}
                    </span>
                  </td>
                  <td className="py-4 leading-relaxed text-slate-400">{locus.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-base font-semibold text-white">Reading the outcome</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Day 2, genomic DNA</dt>
              <dd className="mt-1 text-sm text-slate-300">{CRISPR_MIX.deconvolution.day2}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Sequencing</dt>
              <dd className="mt-1 text-sm text-slate-300">{CRISPR_MIX.deconvolution.ngs}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">HDR quantification</dt>
              <dd className="mt-1 text-sm text-slate-300">{CRISPR_MIX.deconvolution.quantification}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-slate-500">Reporter readout</dt>
              <dd className="mt-1 text-sm text-slate-300">{CRISPR_MIX.deconvolution.flow}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-slate-800 pt-4 text-sm leading-relaxed text-slate-400">
            Deep amplicon sequencing, not Sanger deconvolution. A pooled-donor experiment produces several distinct HDR
            products at once, and a Sanger mixture cannot separate them; amplicon NGS can count each allele class.
          </p>
        </div>
      </section>

      <section aria-labelledby="analysis-heading">
        <h2 id="analysis-heading" className="text-2xl font-semibold text-white">
          Analysing the comparison you designed
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-base font-semibold text-white">Block on subline, do not average it away</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Independently derived clones from one parental line are correlated with each other. Treating them as
              independent replicates inflates the apparent sample size and the false-positive rate. In limma-voom this is
              <code className="mx-1 font-mono text-xs text-slate-300">duplicateCorrelation</code> with subline as the blocking
              factor; in edgeR, a term for subline in the design matrix. Averaging the clones instead discards the
              information about how variable they are.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-base font-semibold text-white">Partition the variance before interpreting it</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Before testing any gene, fit the variance components: how much is genotype, how much is clone, how much is
              batch, how much is residual. If clone-to-clone variance dominates the term you care about, no number of
              differentially expressed genes rescues the design, and you will find that out faster here than in review.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-base font-semibold text-white">X-chromosome inactivation erosion</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Female hiPSC lines lose XIST expression and reactivate the inactive X over passaging, and editing plus
              cloning accelerates the selection. Two clones from the same female line can differ in allele-specific
              expression across X-linked and autosomal genes for reasons that have nothing to do with your edit. Check
              XIST and allele-specific expression in the clones you compare, and prefer clones matched for erosion state.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="text-base font-semibold text-white">Converge with something outside the dish</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              An isogenic pair shows the edit causes the difference in that background. It does not show the difference
              matters in people. Pair it with evidence of a different kind: eQTL colocalisation at the locus, the protein
              in patient biofluids, or an orthogonal functional readout such as calcium transients in hiPSC-derived
              cardiomyocytes.
            </p>
          </article>
        </div>
      </section>

      <TeachingModelNotice>
        The effective-n calculation is a design-effect correction, not a power curve. It tells you what extra samples are
        worth under clustering; it does not tell you what effect size you can detect, which needs an effect size and a
        variance estimate from your own pilot data.
      </TeachingModelNotice>

    </div>
  );
};

const Row: React.FC<{ label: string; value: Parameters<typeof StatedValue>[0]['stated'] }> = ({ label, value }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-800/60 pb-2">
    <dt className="text-slate-400">{label}</dt>
    <dd>
      <StatedValue stated={value} showBadge={false} />
    </dd>
  </div>
);
