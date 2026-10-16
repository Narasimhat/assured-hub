import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, Search, ExternalLink, Scale } from 'lucide-react';

interface AssayProfile {
  id: string;
  name: string;
  type: 'In Situ' | 'Cell-Based' | 'Cell-Free';
  inputMaterial: string;
  sensitivity: string;
  strengths: string;
  limitations: string;
  fdaReadiness: 'High' | 'Medium';
}

const NOMINATION_ASSAYS: AssayProfile[] = [
  {
    id: 'discover-seq',
    name: 'DISCOVER-Seq (MRE11 ChIP-Seq)',
    type: 'In Situ',
    inputMaterial: 'Live intact hiPSCs or organoids',
    sensitivity: 'Detects in situ physiological cuts (0.1% indel LOD)',
    strengths: 'Captures true endogenous chromatin states; revealed 0.75% de novo indel at VEGFA site 2 with HiFi Cas9.',
    limitations: 'Requires high cell input (>5×10⁶ cells) and validated MRE11 ChIP-grade antibodies.',
    fdaReadiness: 'High',
  },
  {
    id: 'circle-seq',
    name: 'CIRCLE-Seq',
    type: 'Cell-Free',
    inputMaterial: 'Purified genomic DNA (5 µg)',
    sensitivity: 'Ultra-high sensitivity (unbiased cleavage of circularized gDNA)',
    strengths: 'Independent of chromatin accessibility; nominates candidate loci comprehensively.',
    limitations: 'Generates false-positive candidates protected by chromatin in vivo.',
    fdaReadiness: 'High',
  },
  {
    id: 'e-guide',
    name: 'E-GUIDE / GUIDE-Seq',
    type: 'Cell-Based',
    inputMaterial: 'Transfected live hiPSCs',
    sensitivity: 'Standard cell-based DSB capture (0.1-0.5% LOD)',
    strengths: 'Captures double-strand break repair in living cells via double-stranded oligodeoxynucleotide integration.',
    limitations: 'Can perturb cell viability; blunt-ended capture oligos may be toxic in stem cells.',
    fdaReadiness: 'High',
  },
  {
    id: 'pem-seq',
    name: 'PEM-Seq (Primer Extension-Mediated)',
    type: 'Cell-Based',
    inputMaterial: 'Edited hiPSC gDNA',
    sensitivity: 'Chromosomal translocation detection (0.01% LOD)',
    strengths: 'Directly quantifies large chromosomal structural rearrangements and translocations between on- and off-targets.',
    limitations: 'Targeted single-sided primer design required for each locus.',
    fdaReadiness: 'High',
  },
];

export const OffTargetDecisionMatrix: React.FC = () => {
  const [selectedAssayId, setSelectedAssayId] = useState<string>('discover-seq');
  const [regulatoryStandard, setRegulatoryStandard] = useState<'fda-2024' | 'cde-2022' | 'ich-q2'>('fda-2024');

  const selectedAssay = NOMINATION_ASSAYS.find(a => a.id === selectedAssayId) || NOMINATION_ASSAYS[0];

  return (
    <div className="rounded-2xl border border-rose-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            Tier 6 · CGT Analytical Validation & CMC
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">Orthogonal Off-Target Cleavage Decision Matrix</h3>
          <p className="mt-1 text-sm text-slate-400">
            Evaluate nomination assays against FDA 2024, CDE 2022, and ICH Q2(R2) analytical guidelines for IND-enabling studies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRegulatoryStandard('fda-2024')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              regulatoryStandard === 'fda-2024'
                ? 'border-rose-500 bg-rose-950/70 text-rose-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            FDA 2024 Draft
          </button>
          <button
            type="button"
            onClick={() => setRegulatoryStandard('cde-2022')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              regulatoryStandard === 'cde-2022'
                ? 'border-rose-500 bg-rose-950/70 text-rose-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            CDE 2022 Guidelines
          </button>
          <button
            type="button"
            onClick={() => setRegulatoryStandard('ich-q2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              regulatoryStandard === 'ich-q2'
                ? 'border-rose-500 bg-rose-950/70 text-rose-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            ICH Q2(R2) Analytical
          </button>
        </div>
      </div>

      {/* Case Study Callout: HiFi Cas9 VEGFA Site 2 */}
      <div className="mt-6 p-4 rounded-xl border border-rose-900/50 bg-rose-950/30 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-300">
          <strong className="text-rose-200">The HiFi Cas9 Off-Target Reality: </strong>
          Engineered high-fidelity nucleases (such as Alt-R S.p. HiFi Cas9 V3) reduce off-target cleavage at canonical sites by over 99%. However, unbiased in situ profiling via <strong>DISCOVER-Seq</strong> demonstrates that HiFi Cas9 can occasionally create novel, unexpected off-target indels (e.g. a <strong>0.75% indel frequency</strong> at the promiscuous VEGFA site 2 locus) that are undetectable by cell-free or cell-line GUIDE-seq. This finding necessitates orthogonal nomination using at least two independent assay mechanisms.
        </div>
      </div>

      {/* Nomination Assays Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {NOMINATION_ASSAYS.map(assay => {
          const isSelected = assay.id === selectedAssayId;
          return (
            <div
              key={assay.id}
              onClick={() => setSelectedAssayId(assay.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
                  {assay.type}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  FDA: {assay.fdaReadiness}
                </span>
              </div>
              <h4 className="mt-2 text-sm font-bold text-white">{assay.name}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-normal">{assay.sensitivity}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Assay Evaluation Panel */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white">{selectedAssay.name} Detailed Specifications</h4>
          <span className="text-xs font-mono text-slate-400">Input: {selectedAssay.inputMaterial}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="font-bold text-emerald-400">Analytical Strengths</span>
            <p className="mt-1 text-slate-300 leading-relaxed">{selectedAssay.strengths}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="font-bold text-amber-400">Operational Limitations</span>
            <p className="mt-1 text-slate-300 leading-relaxed">{selectedAssay.limitations}</p>
          </div>
        </div>

        {/* Regulatory Guidance Accordion */}
        <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
            <Scale className="w-4 h-4" />
            <span>
              {regulatoryStandard === 'fda-2024'
                ? 'FDA 2024 Draft Guidance Alignment'
                : regulatoryStandard === 'cde-2022'
                ? 'CDE 2022 Gene Therapy Technical Guidelines'
                : 'ICH Q2(R2) Analytical Method Validation'}
            </span>
          </div>
          <p>
            {regulatoryStandard === 'fda-2024' &&
              'Requires orthogonal nomination (combining cell-free and cell-based or in situ methods) followed by high-depth targeted NGS (>10,000x coverage, LOD <0.1%). Every nominated site >0.1% indel frequency must be logged and monitored for clinical oncogenic potential.'}
            {regulatoryStandard === 'cde-2022' &&
              'Emphasizes structural genomic alterations, demanding PEM-seq or whole-genome sequencing (WGS) to rule out large chromosomal translocations, deletions >1 kb, and vector integration remnants.'}
            {regulatoryStandard === 'ich-q2' &&
              'Demands formal assay validation protocols establishing Linearity (R ≥ 0.99), Repeatability (%CV < 15%), Limit of Detection (LOD ≤ 0.1%), and Matrix Specificity in human pluripotent stem cells.'}
          </p>
        </div>
      </div>

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Ready to review Sanger trace deconvolution and audit report exports in ASSURED Bench?
        </p>
        <a
          href="../studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-sm hover:bg-rose-500 transition-colors focus-visible:outline focus-visible:outline-rose-400"
        >
          Open ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
