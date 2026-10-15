import React, { useState } from 'react';
import { Grid, Eye, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { VirtualLabState } from '../../types';

interface Plate96ScreenProps {
  labState: VirtualLabState;
  updateLabState: (updates: Partial<VirtualLabState>) => void;
  onProceed: () => void;
}

// Generate realistic simulated 96-well distribution
// Row A-H, Col 1-12
const generateWells = (method: 'limiting-dilution' | 'single-cell-dispenser') => {
  const rows = ['A','B','C','D','E','F','G','H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);
  const wells: Record<string, { type: 'monoclonal' | 'doublet' | 'empty'; colonySize: number }> = {};

  rows.forEach((r, rIdx) => {
    cols.forEach((c) => {
      const id = `${r}${c}`;
      const seed = (rIdx * 12 + c) * 17;
      
      if (method === 'single-cell-dispenser') {
        // High efficiency: 80% monoclonal, 5% doublet, 15% empty
        const rand = (seed % 100);
        if (rand < 75) {
          wells[id] = { type: 'monoclonal', colonySize: 60 + (seed % 30) };
        } else if (rand < 82) {
          wells[id] = { type: 'doublet', colonySize: 85 };
        } else {
          wells[id] = { type: 'empty', colonySize: 0 };
        }
      } else {
        // Limiting dilution (Poisson at 0.5 cells/well): ~32% single cells, 4% doublets, ~64% empty
        const rand = (seed % 100);
        if (rand < 34) {
          wells[id] = { type: 'monoclonal', colonySize: 55 + (seed % 35) };
        } else if (rand < 39) {
          wells[id] = { type: 'doublet', colonySize: 90 };
        } else {
          wells[id] = { type: 'empty', colonySize: 0 };
        }
      }
    });
  });

  return wells;
};

export const Plate96Screen: React.FC<Plate96ScreenProps> = ({
  labState,
  updateLabState,
  onProceed
}) => {
  const [wellsData, setWellsData] = useState(() => generateWells(labState.cloningMethod));
  const [inspectedWell, setInspectedWell] = useState<string>('B3');

  const rows = ['A','B','C','D','E','F','G','H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleMethodChange = (m: 'limiting-dilution' | 'single-cell-dispenser') => {
    updateLabState({ cloningMethod: m, selectedWells: [] });
    setWellsData(generateWells(m));
  };

  const handleToggleWell = (id: string) => {
    const well = wellsData[id];
    if (well.type === 'empty') return;

    setInspectedWell(id);
    const current = labState.selectedWells;
    if (current.includes(id)) {
      updateLabState({ selectedWells: current.filter(w => w !== id) });
    } else {
      if (current.length >= 8) return; // max 8 clones
      updateLabState({ selectedWells: [...current, id] });
    }
  };

  const currentInspected = wellsData[inspectedWell] || { type: 'empty', colonySize: 0 };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Grid className="w-4 h-4" />
          <span>Stage 3: Monoclonal Sub-Cloning & 96-Well Screen</span>
        </div>
        <h3 className="text-lg font-bold text-white">
          Screen Clones on Day 10 & Pick Colonies for QC
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Human iPSCs must be expanded from a single founding cell to guarantee isogenic purity. Compare automated dispensing with frugal limiting dilution (0.5 cells/well) and inspect colony morphology to exclude doublets.
        </p>
      </div>

      {/* Cloning Strategy Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Single-Cell Methodology:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMethodChange('limiting-dilution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                labState.cloningMethod === 'limiting-dilution'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Frugal Serial Limiting Dilution (0.5 cells/well)
            </button>
            <button
              onClick={() => handleMethodChange('single-cell-dispenser')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                labState.cloningMethod === 'single-cell-dispenser'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Automated Single-Cell Dispenser (Core Facility)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Selected: <strong className="text-cyan-400">{labState.selectedWells.length} / 8</strong> Clones Picked
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 96-Well Plate Grid (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-950 border border-slate-800 overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Column Headers (1-12) */}
            <div className="grid grid-cols-13 gap-1 mb-1 text-center text-[10px] font-mono text-slate-500">
              <div className="w-5"></div>
              {cols.map(c => (
                <div key={c} className="font-bold">{c}</div>
              ))}
            </div>

            {/* Rows (A-H) */}
            {rows.map(r => (
              <div key={r} className="grid grid-cols-13 gap-1 mb-1 items-center">
                <div className="w-5 text-[10px] font-mono font-bold text-slate-500 text-center">{r}</div>
                {cols.map(c => {
                  const id = `${r}${c}`;
                  const well = wellsData[id];
                  const isSelected = labState.selectedWells.includes(id);
                  const isInspect = inspectedWell === id;

                  let wellColor = "bg-slate-900/60 border-slate-800 text-slate-700";
                  if (well.type === 'monoclonal') {
                    wellColor = "bg-emerald-950/40 border-emerald-800/80 hover:border-emerald-500 cursor-pointer";
                  } else if (well.type === 'doublet') {
                    wellColor = "bg-amber-950/40 border-amber-800/80 hover:border-amber-500 cursor-pointer";
                  }

                  if (isSelected) {
                    wellColor = "bg-cyan-500 border-cyan-300 shadow-md shadow-cyan-500/40 scale-105";
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => handleToggleWell(id)}
                      onMouseEnter={() => setInspectedWell(id)}
                      className={`h-8 rounded-full border flex items-center justify-center relative transition-all ${wellColor} ${isInspect ? 'ring-2 ring-white/50' : ''}`}
                    >
                      {well.type === 'monoclonal' && !isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      )}
                      {well.type === 'doublet' && !isSelected && (
                        <div className="flex gap-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </div>
                      )}
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-900">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Monoclonal Colony</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span>Doublet (2 Cells Merged)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 inline-block border border-slate-700"></span>
                <span>Empty Well</span>
              </span>
            </div>
            <div className="text-[11px] text-cyan-400 font-medium">
              Click well to pick for sequencing
            </div>
          </div>
        </div>

        {/* Well Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Well Inspector
              </h4>
              <span className="font-mono text-sm font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Well {inspectedWell}
              </span>
            </div>

            {/* Microscopic Camera Mock */}
            <div className="w-full h-44 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-32 h-32 rounded-full border border-dashed border-cyan-400"></div>
              </div>

              {currentInspected.type === 'monoclonal' ? (
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/40 border-2 border-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <div className="w-14 h-14 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 block">Single Round Colony</span>
                </div>
              ) : currentInspected.type === 'doublet' ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-14 h-14 rounded-full bg-amber-500/40 border-2 border-amber-400" />
                    <div className="w-12 h-12 rounded-full bg-amber-500/40 border-2 border-amber-400 -ml-4" />
                  </div>
                  <span className="text-xs font-bold text-amber-400 block">Merged Doublet Colony</span>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-600">
                  <span>No colony outgrowth detected</span>
                </div>
              )}
            </div>

            {/* Well Diagnostics */}
            <div className="text-xs space-y-2">
              {currentInspected.type === 'monoclonal' && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-emerald-200">
                  <strong>Recommended Candidate:</strong> High circularity, phase-bright margins. Free from adjacent satellite colonies. Pick for genotyping!
                </div>
              )}
              {currentInspected.type === 'doublet' && (
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-200">
                  <strong>Warning - Polyclonal Risk:</strong> Two cells deposited in close proximity have fused. Sanger traces will show mixed mosaic peaks. Do not pick.
                </div>
              )}
              {currentInspected.type === 'empty' && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-500">
                  Well empty. Wells can stay empty when cells are seeded at low density, and a mix of colonies means a clone was not single-cell derived.
                </div>
              )}
            </div>

            {/* Proceed to Genotyping */}
            <button
              disabled={labState.selectedWells.length === 0}
              onClick={onProceed}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 disabled:opacity-40 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>Screen Picked Clones in QC (Stage 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
