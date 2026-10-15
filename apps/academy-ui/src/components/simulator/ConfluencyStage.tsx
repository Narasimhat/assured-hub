import React from 'react';
import { Microscope, AlertTriangle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

interface ConfluencyStageProps {
  confluency: number;
  setConfluency: (val: number) => void;
  onProceed: () => void;
}

export const ConfluencyStage: React.FC<ConfluencyStageProps> = ({
  confluency,
  setConfluency,
  onProceed
}) => {
  // The paper passages from a well at about 50% confluence; it defines no tolerance, so 40-60% is this exercise's choice.
  const isOptimal = confluency >= 40 && confluency <= 60;
  const isUnder = confluency < 40;
  const isOver = confluency > 60;

  return (
    <div className="space-y-6">
      
      {/* Intro Mission Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Microscope className="w-4 h-4" />
          <span>Stage 1: Culture state before the Day -1 re-plating</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Inspect hiPSC Colonies Under Phase-Contrast Microscopy
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In the protocol, cells for a nucleofection are collected from a well at about <strong>50% confluence</strong>, which usually gives about 1 &times; 10&#8310; cells. They are re-plated at 2 &times; 10&#8309; cells per well on Day -1 and electroporated on Day 0. Re-plating synchronises the cell cycle so that more cells are in S-phase, when HDR is most active. The paper gives no tolerance around 50%; this exercise treats 40 to 60% as close.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Virtual Microscope Viewfinder (7 cols) */}
        <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[340px]">
          {/* Eyepiece circular crosshair overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-72 h-72 rounded-full border border-cyan-500/20 shadow-[0_0_80px_rgba(6,182,212,0.15)] flex items-center justify-center">
              <div className="w-full h-[1px] bg-cyan-500/10 absolute"></div>
              <div className="h-full w-[1px] bg-cyan-500/10 absolute"></div>
              <div className="w-48 h-48 rounded-full border border-dashed border-cyan-500/20"></div>
            </div>
          </div>

          {/* Stem Cell Colony Simulation Grid */}
          <div className="relative z-10 w-64 h-64 rounded-full overflow-hidden bg-slate-900/90 border-2 border-slate-700 flex flex-wrap items-center justify-center p-3 gap-2">
            {Array.from({ length: Math.round(confluency / 5) }).map((_, i) => {
              const size = 20 + ((i * 7) % 25);
              const isDiff = isOver && i % 3 === 0;

              return (
                <div
                  key={i}
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: isDiff ? '35% 65% 60% 40%' : '50%',
                  }}
                  className={`transition-all duration-300 shadow-sm ${
                    isDiff
                      ? 'bg-amber-700/60 border border-amber-500/50 blur-[0.5px]'
                      : isOptimal
                      ? 'bg-emerald-500/70 border border-emerald-300/80 shadow-emerald-500/20'
                      : 'bg-cyan-600/50 border border-cyan-400/40'
                  }`}
                  title={isDiff ? 'Spontaneous differentiation' : 'Undifferentiated colony'}
                />
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">Microscope: 10x Phase</span>
            <span className="text-slate-600">•</span>
            <span className={`font-bold ${isOptimal ? 'text-emerald-400' : isOver ? 'text-amber-400' : 'text-cyan-400'}`}>
              Estimated Confluency: {confluency}%
            </span>
          </div>
        </div>

        {/* Controls & Feedback (5 cols) */}
        <div className="md:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Culture Confluency Slider</span>
                <span className="text-cyan-400 font-mono text-sm">{confluency}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="90"
                value={confluency}
                onChange={(e) => setConfluency(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>25% (sparse)</span>
                <span className="text-emerald-400 font-bold">50% (protocol)</span>
                <span>90% (dense)</span>
              </div>
            </div>

            {/* Diagnostic Alert Box */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              isOptimal
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : isUnder
                ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-200'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {isOptimal ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Close to the protocol (about 50%)</span>
                  </>
                ) : isUnder ? (
                  <>
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Below the protocol (under 40%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Above the protocol (over 60%)</span>
                  </>
                )}
              </div>
              <p className="mt-1">
                {isOptimal && 'Close to the density the protocol passages from. One well at this density usually gives enough cells for one nucleofection plus an untransfected control, but count the cells before you start, as the paper advises.'}
                {isUnder && 'Below the protocol\'s density. One well may not give the ~1 \u00d7 10\u2076 cells the protocol expects, so you may need more wells.'}
                {isOver && 'Above the protocol\'s density. The protocol does not test other densities for this step; it does warn elsewhere against letting cultures overgrow, so plan to passage earlier.'}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onProceed}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              isOptimal
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 shadow-emerald-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>Harvest Cells for Electroporation (Stage 2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
