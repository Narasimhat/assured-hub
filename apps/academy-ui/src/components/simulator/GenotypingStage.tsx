import React, { useState } from 'react';
import { 
  Binary, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ExternalLink, 
  Award, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VirtualLabState } from '../../types';

interface GenotypingStageProps {
  labState: VirtualLabState;
  onRestart: () => void;
  onAwardMastery: (points: number) => void;
}

interface SimulatedClone {
  wellId: string;
  name: string;
  status: 'WT' | 'KO_INDEL' | 'COMP_HET' | 'HOMOZYGOUS_KI';
  title: string;
  description: string;
  tracePreview: string; // ASCII or mock peak representation
  hasSilentPamBlock: boolean;
  isRecommended: boolean;
}

export const GenotypingStage: React.FC<GenotypingStageProps> = ({
  labState,
  onRestart,
  onAwardMastery
}) => {
  const clonesToEvaluate: SimulatedClone[] = (labState.selectedWells.length > 0 
    ? labState.selectedWells.slice(0, 4) 
    : ['B3', 'C7', 'D2', 'F9']).map((well, idx) => {
    if (idx === 0) {
      return {
        wellId: well,
        name: `Clone #${idx + 1} (${well})`,
        status: 'WT',
        title: 'Unedited Wild-Type (Escapee)',
        description: 'No cleavage occurred or re-ligated perfectly without modification. Wild-type disease mutation persists.',
        tracePreview: 'A-A-C-G-T-C-C-T-G-G-A-G-T-C-A-G-G-C',
        hasSilentPamBlock: false,
        isRecommended: false
      };
    } else if (idx === 1) {
      return {
        wellId: well,
        name: `Clone #${idx + 1} (${well})`,
        status: 'KO_INDEL',
        title: 'Frameshift Knockout (-2 bp Indel)',
        description: 'Repaired via error-prone NHEJ. Deletion of 2 nucleotides causes catastrophic premature termination codon.',
        tracePreview: 'A-A-C-G-T-C--X-X--G-A-G-T-C-A-G-G-C',
        hasSilentPamBlock: false,
        isRecommended: false
      };
    } else if (idx === 2) {
      return {
        wellId: well,
        name: `Clone #${idx + 1} (${well})`,
        status: 'COMP_HET',
        title: 'Compound Heterozygote (KI + 1-bp Indel)',
        description: 'Hazardous! One allele underwent HDR precision correction, but the second allele suffered a +1 bp insertion knockout.',
        tracePreview: 'A-A-C-G-[T/C]-[C/A]-[T/G]-[G/C] (Mixed Deconvoluted Trace)',
        hasSilentPamBlock: true,
        isRecommended: false
      };
    } else {
      return {
        wellId: well,
        name: `Clone #${idx + 1} (${well})`,
        status: 'HOMOZYGOUS_KI',
        title: 'True Homozygous Knock-In (Ideal Rescued Line)',
        description: 'Both alleles carry the therapeutic correction AND the synonymous PAM-blocking mutation (AGG -> AGA). 0% indel signal.',
        tracePreview: 'A-A-C-G-T-T-T-G-G-A-G-T-C-A-G-A-C (100% Pure Corrected)',
        hasSilentPamBlock: true,
        isRecommended: true
      };
    }
  });

  const [selectedCloneIdx, setSelectedCloneIdx] = useState(0);
  const [calledClone, setCalledClone] = useState<string | null>(null);

  const activeClone = clonesToEvaluate[selectedCloneIdx];

  const handleCallClone = (status: string) => {
    setCalledClone(status);
    if (status === 'HOMOZYGOUS_KI') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
      onAwardMastery(100);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
          <Binary className="w-4 h-4" />
          <span>Stage 4: Assured QC & Sanger Trace Deconvolution</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Analyze Chromatograms & Call Homozygous Isogenic Clones
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Inspect the Sanger electrophoretic sequencing traces for your picked candidate clones. Use Assured QC principles to distinguish between unedited WT, NHEJ indels, deceptive compound heterozygotes, and true homozygous knock-in rescues.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Clone Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Candidate Clones for Evaluation
          </h4>

          {clonesToEvaluate.map((c, idx) => (
            <div
              key={c.wellId}
              onClick={() => { setSelectedCloneIdx(idx); setCalledClone(null); }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedCloneIdx === idx
                  ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white">{c.name}</span>
                <span className="font-mono text-purple-400 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Sanger AB1 Loaded
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {c.title}
              </p>
            </div>
          ))}

          {/* Quick link to real Assured QC app */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-300">Live Production Tool</span>
              <a
                href="https://assured-qc.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>Launch Assured QC</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-300">
              Run this exact trace deconvolution algorithm in your browser with real AB1 files from your own wet-lab experiments.
            </p>
          </div>
        </div>

        {/* Trace Inspector & Calling Bench (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Evaluating Trace
              </span>
              <h3 className="text-xl font-black text-white">
                {activeClone.name} — {activeClone.title}
              </h3>
            </div>

            {calledClone === 'HOMOZYGOUS_KI' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold animate-bounce">
                <Award className="w-4 h-4" />
                <span>Therapeutic Rescue Verified!</span>
              </div>
            )}
          </div>

          {/* Simulated Four-Color Sanger Chromatogram View */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Fluorescence Trace Window (Cut Site +/- 15 bp)</span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold">A (Green)</span>
                <span className="text-rose-400 font-bold">T (Red)</span>
                <span className="text-cyan-400 font-bold">C (Blue)</span>
                <span className="text-amber-400 font-bold">G (Yellow)</span>
              </div>
            </div>

            {/* Mock Peak Waveform Visualizer */}
            <div className="h-28 w-full bg-slate-900 rounded-xl p-3 flex items-end justify-between gap-1 border border-slate-800/80 font-mono text-xs overflow-hidden relative">
              {/* Overlay grid lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-rows-3 opacity-20">
                <div className="border-b border-slate-500"></div>
                <div className="border-b border-slate-500"></div>
              </div>

              {activeClone.tracePreview.split('-').map((base, idx) => {
                const isSilent = base === 'AGA' || base.includes('AGA');
                const isMixed = base.includes('/');
                const isDel = base.includes('X');

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 relative z-10">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isDel 
                          ? 'h-2 bg-rose-500/30' 
                          : isMixed 
                          ? 'h-16 bg-gradient-to-t from-purple-500 to-amber-500' 
                          : isSilent 
                          ? 'h-20 bg-emerald-400 shadow-md shadow-emerald-500/40' 
                          : 'h-16 bg-cyan-400'
                      }`}
                    />
                    <span className={`text-[10px] font-bold ${
                      isSilent ? 'text-emerald-300' : isMixed ? 'text-purple-300' : isDel ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {base}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong>Deconvolution Analysis:</strong> {activeClone.description}
            </div>
          </div>

          {/* Clone Calling Action Buttons */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Assign Biological Zygosity Call:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleCallClone('WT')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  calledClone === 'WT'
                    ? 'bg-slate-800 border-slate-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                1. Unedited WT
              </button>

              <button
                onClick={() => handleCallClone('KO_INDEL')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  calledClone === 'KO_INDEL'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                2. Indel Knockout
              </button>

              <button
                onClick={() => handleCallClone('COMP_HET')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  calledClone === 'COMP_HET'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                3. Compound Het
              </button>

              <button
                onClick={() => handleCallClone('HOMOZYGOUS_KI')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                  calledClone === 'HOMOZYGOUS_KI'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-emerald-400 hover:border-emerald-500'
                }`}
              >
                4. Homozygous KI
              </button>
            </div>
          </div>

          {/* Feedback on Verdict */}
          {calledClone && (
            <div className={`p-4 rounded-xl border text-sm leading-relaxed animate-in fade-in ${
              calledClone === activeClone.status
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800 text-rose-200'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {calledClone === activeClone.status ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Correct Call!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incorrect Zygosity Classification</span>
                  </>
                )}
              </div>
              <p className="text-xs mt-1">
                {calledClone === 'HOMOZYGOUS_KI' && activeClone.status === 'HOMOZYGOUS_KI' && (
                  'Outstanding! You have identified the verified homozygous knock-in clone carrying both the therapeutic correction and the silent PAM block. This line is ready for pluripotency re-validation and directed differentiation into organoids/cardiomyocytes!'
                )}
                {calledClone !== activeClone.status && (
                  `Look closely at the peaks. This clone has status "${activeClone.title}". Check whether both alleles are identical or if frameshift deletions are present.`
                )}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={onRestart}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Virtual Lab</span>
            </button>

            <a
              href="https://assured-qc.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
            >
              <span>Test Real Traces in Assured QC</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

      </div>

    </div>
  );
};
