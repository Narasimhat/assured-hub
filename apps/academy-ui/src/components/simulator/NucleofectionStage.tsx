import React, { useState } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  Dna
} from 'lucide-react';
import { VirtualLabState } from '../../types';
import { NEON_CONDITIONS } from '../../data/benchDefaults';

interface NucleofectionStageProps {
  labState: VirtualLabState;
  updateLabState: (updates: Partial<VirtualLabState>) => void;
  onProceed: () => void;
}

export const NucleofectionStage: React.FC<NucleofectionStageProps> = ({
  labState,
  updateLabState,
  onProceed
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [pulseCompleted, setPulseCompleted] = useState(labState.hasRunElectroporation);

  const handlePulse = () => {
    setIsPulsing(true);
    setTimeout(() => {
      setIsPulsing(false);
      setPulseCompleted(true);
      updateLabState({ hasRunElectroporation: true });
    }, 1200);
  };

  const handleResetPulse = () => {
    setPulseCompleted(false);
    updateLabState({ hasRunElectroporation: false });
  };

  // The only checks are against the published protocol. The game does not predict viability or efficiency.
  const usedCloneR2 = labState.usedCloneR2;
  const isProgramProtocol = labState.electroporationProgram === 'protocol';
  const followsProtocol = usedCloneR2 && isProgramProtocol;
  const protocolPulse = `${NEON_CONDITIONS.voltage}, ${NEON_CONDITIONS.pulseWidth}, ${NEON_CONDITIONS.pulses} pulse`;

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <Zap className="w-4 h-4" />
          <span>Stage 2: RNP Assembly & Nucleofection Pulse</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Assemble the RNP, electroporate, and recover the cells
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Mix Cas9 and the gRNAs with R buffer as in Table 7 of the protocol (15 \u00b5L), add the Alt-R HDR modified ssODN for knock-ins, electroporate with the Neon system, and recover in StemFlex/CloneR2.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Parameters Form (6 cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Reaction Formulation
            </h4>

            {/* RNP Molar Ratio */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-200">RNP mix (Table 7).</strong> For a two-guide knock-in: Cas9 1 &micro;L, gRNA 2 + 2 &micro;L, ssODN 3 &micro;L (12.5 &micro;M), R buffer 7 &micro;L, 15 &micro;L in total. The mix calculator is in Stage 3 of the pipeline.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200 flex justify-between">
                <span>Neon pulse setting</span>
                <span className="text-cyan-400 font-mono">{labState.electroporationProgram}</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={pulseCompleted}
                  onClick={() => updateLabState({ electroporationProgram: 'protocol' })}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    labState.electroporationProgram === 'protocol'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Protocol setting</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Neon {NEON_CONDITIONS.tip} tip: {protocolPulse}</div>
                </button>
                <button
                  disabled={pulseCompleted}
                  onClick={() => updateLabState({ electroporationProgram: 'other' })}
                  className={`p-3 text-left rounded-xl border text-xs transition-all ${
                    labState.electroporationProgram === 'other'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="font-bold">Another setting</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Not from the protocol; this game does not predict its outcome</div>
                </button>
              </div>
            </div>

            {/* CloneR2 recovery toggle */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">CloneR2 in the recovery medium (StemFlex/CloneR2)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Used after electroporation and during single-cell cloning</span>
                </div>
                <input
                  type="checkbox"
                  disabled={pulseCompleted}
                  checked={labState.usedCloneR2}
                  onChange={(e) => updateLabState({ usedCloneR2: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-amber-300/80">
                The protocol recovers cells in StemFlex supplemented with CloneR2, which it says promotes clonal survival and colony formation from single cells. This game does not predict how much survival changes without it.
              </p>
            </div>

            {/* ssODN Architecture Display */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-2 text-slate-400">
              <Dna className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>ssODN: <strong className="text-cyan-400">asymmetric 36/91 nt arms</strong>, plus <strong className="text-emerald-400">blocking changes</strong> where the edit does not already disrupt the PAM</span>
            </div>

            {/* Action Trigger */}
            {!pulseCompleted ? (
              <button
                disabled={isPulsing}
                onClick={handlePulse}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isPulsing 
                    ? 'bg-amber-400 text-slate-950 animate-pulse' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isPulsing ? 'Delivering the pulse...' : 'Deliver electroporation pulse'}</span>
              </button>
            ) : (
              <button
                onClick={handleResetPulse}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reconfigure & Retest Pulse</span>
              </button>
            )}

          </div>
        </div>

        {/* Pulse Chamber Visualizer & Diagnostics (6 cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden min-h-[300px] flex flex-col items-center justify-center">
            
            {/* Cuvette Glow Graphic */}
            <div className="relative my-4">
              <div className={`w-28 h-40 rounded-xl border-4 transition-all duration-300 flex flex-col items-center justify-end p-2 ${
                isPulsing 
                  ? 'border-cyan-300 bg-cyan-400/30 shadow-[0_0_60px_rgba(34,211,238,0.8)] scale-105' 
                  : pulseCompleted 
                  ? 'border-slate-700 bg-slate-900/80' 
                  : 'border-slate-800 bg-slate-900/40'
              }`}>
                {/* Cuvette Aluminum Electrodes */}
                <div className="absolute top-2 left-1 bottom-2 w-2 bg-slate-400 rounded-sm"></div>
                <div className="absolute top-2 right-1 bottom-2 w-2 bg-slate-400 rounded-sm"></div>
                
                {/* Cell suspension fluid */}
                <div className={`w-full rounded-b-lg transition-all duration-500 ${
                  isPulsing 
                    ? 'h-24 bg-cyan-400/80 animate-ping' 
                    : pulseCompleted 
                    ? followsProtocol ? 'h-24 bg-emerald-500/40' : 'h-24 bg-amber-500/40'
                    : 'h-24 bg-cyan-600/30'
                }`} />
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {isPulsing ? 'Pulse in progress' : pulseCompleted ? 'Pulse delivered' : 'Awaiting electroporation'}
            </div>
          </div>

          {/* Results Analysis */}
          {pulseCompleted && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in">
              {!followsProtocol ? (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Differs from the protocol</span>
                  </div>
                  <p className="leading-relaxed">
                    {!isProgramProtocol && `The protocol uses the Neon ${NEON_CONDITIONS.tip} tip at ${protocolPulse}. `}
                    {!usedCloneR2 && 'The protocol recovers cells in StemFlex/CloneR2. '}
                    This game does not predict what the change does to viability or editing; change the setting to match the protocol, or test the alternative at the bench with an untransfected control.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Matches the protocol</span>
                  </div>
                  <p className="leading-relaxed">
                    Neon {NEON_CONDITIONS.tip} tip at {protocolPulse}, with recovery in StemFlex/CloneR2. Check editing in the bulk population before you invest in cloning, as the protocol advises.
                  </p>
                </div>
              )}

              {followsProtocol && (
                <button
                  onClick={onProceed}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <span>Advance to 96-well cloning (Stage 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
