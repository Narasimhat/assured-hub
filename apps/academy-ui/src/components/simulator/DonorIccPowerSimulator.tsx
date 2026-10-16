import React, { useState } from 'react';
import { BarChart3, Dna, ShieldAlert, CheckCircle2, Info, ExternalLink, Zap } from 'lucide-react';

interface LocusData {
  gene: string;
  locus: string;
  singleDonorHDR: number;
  crisprMixHDR: number;
  status: 'rescued' | 'refractory' | 'standard';
  notes: string;
}

const BENCHMARK_LOCI: LocusData[] = [
  {
    gene: 'PLN',
    locus: 'chr6:118,547,400 (R14del)',
    singleDonorHDR: 12.4,
    crisprMixHDR: 58.2,
    status: 'rescued',
    notes: 'Rescued with pooled sense and antisense ssODNs (60:20:120 pmol stoichiometry).',
  },
  {
    gene: 'TPM1',
    locus: 'chr15:63,042,100 (E192K)',
    singleDonorHDR: 18.1,
    crisprMixHDR: 64.7,
    status: 'rescued',
    notes: 'Substantial HDR boost over single-template design; verified by AlleleProfileR.',
  },
  {
    gene: 'TNNT2',
    locus: 'chr1:201,359,000 (R92Q)',
    singleDonorHDR: 15.6,
    crisprMixHDR: 61.3,
    status: 'rescued',
    notes: 'High knock-in yield achieved in hypoxic culture without selection markers.',
  },
  {
    gene: 'KCNH2',
    locus: 'chr7:150,945,000 (A561V)',
    singleDonorHDR: 4.2,
    crisprMixHDR: 18.5,
    status: 'refractory',
    notes: 'High GC-content and chromatin compaction keep this locus challenging even with pooled donors.',
  },
  {
    gene: 'RBM20',
    locus: 'chr10:110,978,000 (P633L)',
    singleDonorHDR: 6.8,
    crisprMixHDR: 22.1,
    status: 'refractory',
    notes: 'Locus requires dual-guide excision or secondary chromatin-remodeling strategies.',
  },
];

export const DonorIccPowerSimulator: React.FC = () => {
  const [donorIcc, setDonorIcc] = useState<number>(43.2); // Empirical median: 43.2%
  const [unmatchedDonors, setUnmatchedDonors] = useState<number>(3);
  const [isogenicReplicates, setIsogenicReplicates] = useState<number>(2);
  const [effectSize, setEffectSize] = useState<'moderate' | 'strong'>('moderate');
  const [activeTab, setActiveTab] = useState<'power' | 'crispr-mix'>('power');

  // Statistical Power calculation approximations grounded in variance partitioning
  // Var_total = Var_donor + Var_treatment + Var_residual
  // In unmatched designs, Var_donor = ICC * Var_total acts as unpowered genomic background noise
  const delta = effectSize === 'moderate' ? 0.8 : 1.5;
  const iccFrac = donorIcc / 100;

  // Effective noise variance for unmatched vs isogenic
  const unmatchedVariance = 1 + (unmatchedDonors - 1) * iccFrac;
  const isogenicVariance = 1 - iccFrac; // background donor variance cancels out completely!

  const unmatchedPower = Math.min(
    99,
    Math.max(
      10,
      Math.round(
        (1 / (1 + Math.exp(-2.2 * (delta * Math.sqrt(unmatchedDonors) / Math.sqrt(unmatchedVariance) - 1.96)))) * 100
      )
    )
  );

  const isogenicPower = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        (1 / (1 + Math.exp(-2.5 * (delta * Math.sqrt(isogenicReplicates * 2) / Math.sqrt(isogenicVariance) - 1.96)))) * 100
      )
    )
  );

  return (
    <div className="rounded-2xl border border-purple-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
            Tier 4 · Statistical Genetics & Refractory Loci
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">51-Donor ICC Power Explorer & CRISPR-MiX</h3>
          <p className="mt-1 text-sm text-slate-400">
            Model transcriptomic variance partitioning across 51 donors to evaluate statistical power, and design pooled ssODNs to rescue refractory loci.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('power')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'power'
                ? 'border-purple-500 bg-purple-950/70 text-purple-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            51-Donor ICC Power
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('crispr-mix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === 'crispr-mix'
                ? 'border-purple-500 bg-purple-950/70 text-purple-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            CRISPR-MiX Rescuer
          </button>
        </div>
      </div>

      {activeTab === 'power' ? (
        <div className="mt-6 space-y-6">
          {/* Empirical Finding Callout */}
          <div className="p-4 rounded-xl border border-purple-800/50 bg-purple-950/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-purple-200">The 51-Donor ICC Paradigm: </strong>
              Quantitative variance partitioning across 9,013 protein-coding genes in 51 human iPSC donors demonstrates that the median donor intraclass correlation coefficient (ICC) is{' '}
              <span className="text-purple-300 font-bold">43.2%</span>. Over <span className="font-semibold text-white">90%</span> of expressed genes exhibit a donor ICC above 20%, and <span className="font-semibold text-white">35%</span> exceed 50%.
              Because inter-individual genetic background dominates transcriptomic variance, requesting 2-3 unmatched patient donors introduces unpowered genomic noise. The gold standard is the <strong className="text-emerald-300">isogenic comparison</strong>.
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl border border-slate-800 bg-slate-950">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Donor ICC (Transcriptomic Variance)</span>
                <span className="text-purple-400 font-bold">{donorIcc.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="0.5"
                value={donorIcc}
                onChange={e => setDonorIcc(parseFloat(e.target.value))}
                className="w-full mt-2 accent-purple-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">Empirical median across 9,013 genes is 43.2%.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Unmatched Patient Donors</span>
                <span className="text-amber-400 font-bold">{unmatchedDonors} Donors</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={unmatchedDonors}
                onChange={e => setUnmatchedDonors(parseInt(e.target.value, 10))}
                className="w-full mt-2 accent-amber-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">Historical peer-review convention (often 2-3 donors).</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Isogenic Clones (Same Genetic Background)</span>
                <span className="text-emerald-400 font-bold">{isogenicReplicates} Clones</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={isogenicReplicates}
                onChange={e => setIsogenicReplicates(parseInt(e.target.value, 10))}
                className="w-full mt-2 accent-emerald-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">Parental vs CRISPR isogenic edited clones.</p>
            </div>
          </div>

          {/* Power Comparison Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unmatched Cohort */}
            <div className="p-6 rounded-2xl border border-amber-900/50 bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">Experimental Design A</span>
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="mt-2 text-lg font-bold text-white">Unmatched Patient Donors (N = {unmatchedDonors})</h4>
              <p className="mt-1 text-xs text-slate-400">
                Comparing unrelated patient-derived hiPSC lines against healthy unrelated controls.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold ${unmatchedPower >= 80 ? 'text-emerald-400' : unmatchedPower >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {unmatchedPower}%
                </span>
                <span className="text-xs text-slate-400">Statistical Power (1 - beta)</span>
              </div>

              <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${unmatchedPower >= 80 ? 'bg-emerald-500' : unmatchedPower >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${unmatchedPower}%` }}
                />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <strong className="text-amber-300">Confounding: </strong>
                With a {donorIcc.toFixed(1)}% donor ICC, inter-individual background variance dominates the phenotype. True variant-driven differences are obscured by thousands of non-causal expression outliers.
              </div>
            </div>

            {/* Isogenic Model */}
            <div className="p-6 rounded-2xl border border-emerald-900/50 bg-slate-950">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Experimental Design B</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="mt-2 text-lg font-bold text-white">Isogenic Comparison ({isogenicReplicates} Clone Pair)</h4>
              <p className="mt-1 text-xs text-slate-400">
                Introducing or correcting the mutation in the exact same parental genomic background.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-emerald-400">
                  {isogenicPower}%
                </span>
                <span className="text-xs text-slate-400">Statistical Power (1 - beta)</span>
              </div>

              <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${isogenicPower}%` }}
                />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <strong className="text-emerald-300">Isogenic Power: </strong>
                Cancels out 100% of the {donorIcc.toFixed(1)}% inter-individual donor background variance. Any detected phenotypic change is causally attributable to the edited variant.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* CRISPR-MiX Rescuer Tab */
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-xl border border-cyan-800/50 bg-cyan-950/30 flex items-start gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-slate-300">
              <strong className="text-cyan-200">The CRISPR-MiX Strategy: </strong>
              To overcome locus-dependent HDR failure, CRISPR-MiX pools multiple single-stranded oligodeoxynucleotide (ssODN) donor templates targeting both the target (sense) and non-target (antisense) strands. Formulated at{' '}
              <span className="text-cyan-300 font-semibold">60 pmol sgRNA : 20 pmol SpCas9 : 120 pmol pooled ssODNs</span> in 10 µL R buffer and pulsed via Neon (1,200 V, 20 ms, 1 pulse), this strategy rescues recalcitrant loci without antibiotic selection.
            </div>
          </div>

          {/* Loci Comparison Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-bold text-white">Empirical Locus Performance: Single Donor vs CRISPR-MiX</h4>
              <span className="text-xs text-slate-400">Deep Amplicon NGS Quantification (AlleleProfileR)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Gene & Variant</th>
                    <th className="p-3.5">Genomic Locus (hg38)</th>
                    <th className="p-3.5">Single-Donor HDR %</th>
                    <th className="p-3.5">CRISPR-MiX HDR %</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Empirical Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {BENCHMARK_LOCI.map(item => (
                    <tr key={item.gene} className="hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-white">{item.gene}</td>
                      <td className="p-3.5 font-mono text-slate-400">{item.locus}</td>
                      <td className="p-3.5 font-semibold text-rose-400">{item.singleDonorHDR}%</td>
                      <td className="p-3.5 font-bold text-emerald-400">{item.crisprMixHDR}%</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'rescued'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.status === 'rescued' ? 'Rescued' : 'Refractory'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{item.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Epigenetic Stability Callout */}
          <div className="p-4 rounded-xl border border-purple-900/60 bg-purple-950/20 text-xs leading-relaxed text-slate-300">
            <strong className="text-purple-300">Epigenetic Caveat for Disease Modelers: </strong>
            Female hiPSC lines frequently undergo variable erosion of X-chromosome inactivation (XCI) during CRISPR gene editing and prolonged culture. Loss of <em>XIST</em> expression alters allele-specific expression across both X-linked and autosomal loci. Always audit <em>XIST</em> and mono-allelic expression in female clones prior to neural differentiation.
          </div>
        </div>
      )}

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Ready to design pooled ssODNs or isogenic controls for your gene of interest?
        </p>
        <a
          href="../studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-500 transition-colors focus-visible:outline focus-visible:outline-purple-400"
        >
          Open ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
