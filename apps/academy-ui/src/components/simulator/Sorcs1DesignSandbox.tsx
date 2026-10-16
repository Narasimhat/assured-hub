import React, { useState } from 'react';
import { Dna, ArrowRight, CheckCircle2, AlertTriangle, Layers, BookOpen, ExternalLink } from 'lucide-react';

interface GuideCandidate {
  id: string;
  name: string;
  sequence: string;
  pam: string;
  strand: '+' | '-';
  cutOffsetFromEdit: number; // distance d in bp
  onTargetScore: number;
  cfdBlockingRequired: boolean;
  notes: string;
}

const SORCS1_KI_GUIDES: GuideCandidate[] = [
  {
    id: 'g-optimal',
    name: 'gRNA-1 (Proximal, Cut at -1 bp)',
    sequence: 'GCAAGCACCTGCTACTACAC',
    pam: 'TGG',
    strand: '+',
    cutOffsetFromEdit: 1,
    onTargetScore: 88,
    cfdBlockingRequired: true,
    notes: 'Cut is 1 bp from the H1098* locus. High HDR efficiency (decay factor: e^(-1/10) = 0.90).',
  },
  {
    id: 'g-moderate',
    name: 'gRNA-2 (Intermediate, Cut at +8 bp)',
    sequence: 'GTGTAGTAGCAGGTGCTTGC',
    pam: 'AGG',
    strand: '-',
    cutOffsetFromEdit: 8,
    onTargetScore: 76,
    cfdBlockingRequired: true,
    notes: 'Cut is 8 bp from the edit. Moderate HDR efficiency (decay factor: e^(-8/10) = 0.45).',
  },
  {
    id: 'g-distal',
    name: 'gRNA-3 (Distal, Cut at +22 bp)',
    sequence: 'CTACACAGGCCCTGATGCCC',
    pam: 'CGG',
    strand: '+',
    cutOffsetFromEdit: 22,
    onTargetScore: 82,
    cfdBlockingRequired: false,
    notes: 'Cut is 22 bp away. Poor HDR efficiency (decay factor: e^(-22/10) = 0.11). Most repair events will be indels without incorporating the edit.',
  },
];

export const Sorcs1DesignSandbox: React.FC = () => {
  const [mode, setMode] = useState<'ko' | 'ki'>('ki');
  const [selectedGuideId, setSelectedGuideId] = useState<string>('g-optimal');
  const [enableCfdBlock, setEnableCfdBlock] = useState<boolean>(true);

  const selectedGuide = SORCS1_KI_GUIDES.find(g => g.id === selectedGuideId) || SORCS1_KI_GUIDES[0];

  // Mathematical cut-to-mutation distance penalty: efficiency = base_hdr * e^(-d/10)
  const d = Math.abs(selectedGuide.cutOffsetFromEdit);
  const distancePenalty = Math.exp(-d / 10);
  const rawHdrEfficiency = Math.round(65 * distancePenalty);

  // If CFD blocking is disabled on proximal guides, Cas9 re-cleaves repaired alleles into indels
  const reCutLoss = !enableCfdBlock && selectedGuide.cfdBlockingRequired ? 0.70 : 0;
  const netHdrKnockin = Math.round(rawHdrEfficiency * (1 - reCutLoss));
  const indelPercentage = Math.round(25 + rawHdrEfficiency * reCutLoss);

  return (
    <div className="rounded-2xl border border-cyan-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
            Tier 2 · RefSeq Architecture & Distance Penalty Sandbox
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">SorCS1 Target Design Sandbox (RefSeq NG_029120)</h3>
          <p className="mt-1 text-sm text-slate-400">
            Compare early constitutive exon knockout in Exon 4 against precise H1098* nonsense knock-in in Exon 25.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('ki')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              mode === 'ki'
                ? 'border-cyan-500 bg-cyan-950/70 text-cyan-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Exon 25 H1098* Knock-In
          </button>
          <button
            type="button"
            onClick={() => setMode('ko')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              mode === 'ko'
                ? 'border-cyan-500 bg-cyan-950/70 text-cyan-200'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            Exon 4 Constitutive Knockout
          </button>
        </div>
      </div>

      {mode === 'ki' ? (
        <div className="mt-6 space-y-6">
          {/* Scientific Concept Explainer */}
          <div className="p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 text-xs leading-relaxed text-slate-300">
            <strong className="text-cyan-200">The Distance Decay Function: </strong>
            Homology-Directed Repair (HDR) integration frequency decays exponentially as the physical distance <em>d</em> between the Cas9 cut site and the target mutation increases:
            <span className="font-mono text-cyan-300 block my-1">HDR Efficiency proportional to exp(-d / 10)</span>
            Cleavages within 1-3 bp of the edit achieve maximum knock-in yield. At &gt;15 bp, repair outcomes shift almost entirely to non-homologous end-joining (NHEJ) indels.
          </div>

          {/* Guide Selection Grid */}
          <div>
            <h4 className="text-sm font-semibold text-white">Select Candidate gRNA for SorCS1 Exon 25 (H1098*, c.3292_3294delinsTAG)</h4>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              {SORCS1_KI_GUIDES.map(guide => {
                const isSelected = guide.id === selectedGuideId;
                return (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{guide.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {guide.strand} strand
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-mono text-cyan-300 truncate">
                      {guide.sequence} <span className="text-amber-400 font-bold">{guide.pam}</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Distance d:</span>
                      <span className="font-bold text-white">{guide.cutOffsetFromEdit} bp</span>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400 leading-normal">{guide.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Silent Blocking Mutation Toggle */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-white">CFD-Guided Synonymous Blocking Mutation</span>
              <p className="text-xs text-slate-400 mt-0.5">
                Mutates the PAM (NGG into NGA) or seed sequence on the donor ssODN without changing the amino acid.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableCfdBlock}
                onChange={e => setEnableCfdBlock(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-semibold text-cyan-300">
                {enableCfdBlock ? 'Blocking Active (Prevents Re-Cutting)' : 'Disabled (Cas9 Re-Cleaves Edit)'}
              </span>
            </label>
          </div>

          {/* Simulated Repair Outcome Display */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Simulated Sanger Trace & Allele Distribution (ICE Deconvolution)
            </h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Intended Knock-In (KI Score)</span>
                <p className="mt-1 text-2xl font-black text-emerald-400">{netHdrKnockin}%</p>
                <span className="text-[10px] text-slate-500">Target H1098* with silent block</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Indel Frameshift (KO Score)</span>
                <p className="mt-1 text-2xl font-black text-amber-400">{indelPercentage}%</p>
                <span className="text-[10px] text-slate-500">Non-homologous end joining</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Unmodified Wild-Type</span>
                <p className="mt-1 text-2xl font-black text-slate-400">
                  {Math.max(0, 100 - netHdrKnockin - indelPercentage)}%
                </p>
                <span className="text-[10px] text-slate-500">Uncut or intact template</span>
              </div>
            </div>

            {/* Asymmetric Donor Schematic */}
            <div className="mt-5 p-4 rounded-xl border border-slate-800 bg-slate-900/50">
              <span className="text-xs font-semibold text-slate-300">Asymmetric ssODN Template Geometry (127 nt):</span>
              <div className="mt-3 flex items-center gap-1 font-mono text-[11px] overflow-x-auto pb-1">
                <div className="px-3 py-1.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 shrink-0">
                  5'-PAM Distal Arm (36 nt)
                </div>
                <span className="text-slate-600 font-bold">---</span>
                <div className="px-2 py-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0 font-bold">
                  H1098* (delinsTAG)
                </div>
                {enableCfdBlock && (
                  <div className="px-2 py-1.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                    Silent PAM Block
                  </div>
                )}
                <span className="text-slate-600 font-bold">---</span>
                <div className="px-3 py-1.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 shrink-0">
                  3'-PAM Proximal Arm (91 nt)
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Knockout Strategy (Exon 4) */
        <div className="mt-6 space-y-6">
          <div className="p-4 rounded-xl border border-cyan-900/50 bg-cyan-950/20 text-xs leading-relaxed text-slate-300">
            <strong className="text-cyan-200">Constitutive Exon Strategy (SorCS1 Exon 4): </strong>
            In mammalian genomes, alternative promoter usage and alternative splicing produce multiple transcript isoforms. Targeting the very first annotated exon often fails because downstream alternative transcription start sites bypass the frameshift.
            The ASSURED methodology targets early <strong className="text-white">constitutive exons</strong> present in 100% of validated RefSeq transcripts (e.g. <em>SorCS1</em> Exon 4).
          </div>

          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
            <h4 className="text-sm font-bold text-white">Dual-Guide Knockout vs Single-Guide Frameshift</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
                <span className="font-bold text-emerald-400">Dual-Guide Deletion (Recommended)</span>
                <p className="mt-2 text-slate-400 leading-relaxed">
                  Two guides flanking 150-300 bp in Exon 4 excise the intervening coding sequence. This generates an unambiguous defined band on standard gel electrophoresis and 100% definitive null alleles.
                </p>
                <div className="mt-3 text-emerald-300 font-semibold">Mean KO Score: 79.5 ± 23 across 32 loci</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900">
                <span className="font-bold text-slate-300">Single-Guide NHEJ Indel</span>
                <p className="mt-2 text-slate-400 leading-relaxed">
                  Generates small 1-3 bp insertions/deletions. Approximately 33% of in-frame 3n indels retain partial protein function. Requires Sanger ICE deconvolution of every single clone.
                </p>
                <div className="mt-3 text-slate-400 font-semibold">Risk of In-Frame Escapers: ~33%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Ready to export this SorCS1 design and order Alt-R synthetic reagents?
        </p>
        <a
          href="../studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold text-sm hover:bg-cyan-500 transition-colors focus-visible:outline focus-visible:outline-cyan-400"
        >
          Open ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
