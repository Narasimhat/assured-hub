import React, { useState } from 'react';
import { Layers, Database, ShieldCheck, CheckSquare, Square, ExternalLink, Calculator } from 'lucide-react';

interface IsscrCheckItem {
  id: string;
  tenetNumber: number;
  title: string;
  standard: string;
  testMethod: string;
}

const ISSCR_TENETS: IsscrCheckItem[] = [
  {
    id: 'tenet-1',
    tenetNumber: 1,
    title: 'Core Pluripotency Markers',
    standard: '≥85% expression of nuclear OCT4, SOX2, and NANOG',
    testMethod: 'Quantitative flow cytometry or quantitative immunofluorescence microscopy',
  },
  {
    id: 'tenet-2',
    tenetNumber: 2,
    title: 'Karyotypic & Genomic Stability',
    standard: 'Normal 46,XX or 46,XY with no recurrent culture-acquired aneuploidies',
    testMethod: 'G-banding (≥20 metaphase spreads) or digital SNP microarray',
  },
  {
    id: 'tenet-3',
    tenetNumber: 3,
    title: 'Sterility & Biosafety',
    standard: 'Absence of mycoplasma, viral pathogens, and endotoxins',
    testMethod: 'PCR mycoplasma detection kit and luminescence assays',
  },
  {
    id: 'tenet-4',
    tenetNumber: 4,
    title: 'Cell Line Identity Verification',
    standard: 'STR DNA fingerprinting 100% matched to parental donor line',
    testMethod: '16-locus Short Tandem Repeat (STR) profiling',
  },
  {
    id: 'tenet-5',
    tenetNumber: 5,
    title: 'Trilineage Differentiation Competence',
    standard: 'Functional capacity to form Ectoderm, Mesoderm, and Endoderm',
    testMethod: 'Directed monolayer differentiation with lineage-specific RT-qPCR',
  },
];

export const IsoCellYieldCalculator: React.FC = () => {
  const [chamberCount, setChamberCount] = useState<number>(256); // IsoCell standard
  const [seedingEfficiency, setSeedingEfficiency] = useState<number>(27); // ~70 of 256 chambers get 1 cell
  const [clonogenicSurvivalRate, setClonogenicSurvivalRate] = useState<number>(65); // 65% empirical benchmark
  const [selectedClonesCount, setSelectedClonesCount] = useState<number>(5);
  const [vialsPerClone, setVialsPerClone] = useState<number>(50);
  const [checkedTenets, setCheckedTenets] = useState<Record<string, boolean>>({
    'tenet-1': true,
    'tenet-2': true,
    'tenet-3': true,
    'tenet-4': true,
    'tenet-5': true,
  });

  const singleCellChambers = Math.round((chamberCount * seedingEfficiency) / 100);
  const survivingClones = Math.round((singleCellChambers * clonogenicSurvivalRate) / 100);

  // Seedbank arithmetic
  const masterVials = Math.round(vialsPerClone * 0.25); // Master Cell Bank (P3-P5)
  const workingVials = vialsPerClone - masterVials; // Working Cell Bank (P6-P8)
  const totalBankVials = selectedClonesCount * vialsPerClone;

  const toggleTenet = (id: string) => {
    setCheckedTenets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allTenetsPassed = ISSCR_TENETS.every(t => checkedTenets[t.id]);

  return (
    <div className="rounded-2xl border border-blue-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            Tier 5 · Core Facility High-Throughput Operations
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">IsoCell 256-Chamber Yield & 50-Vial Seedbank Planner</h3>
          <p className="mt-1 text-sm text-slate-400">
            Automate microfluidic chamber occupancy, 96-well Bambanker clonal expansion, and ISSCR 5-tenet quality release.
          </p>
        </div>
      </div>

      {/* Interactive Microfluidics Yield Simulator */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" />
              Microfluidic Cloning Parameters
            </h4>
            <span className="text-xs font-mono text-slate-400">IsoCell (256 Chambers)</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Single-Cell Chamber Occupancy</span>
              <span className="text-blue-400 font-bold">{singleCellChambers} Chambers ({seedingEfficiency}%)</span>
            </div>
            <input
              type="range"
              min="15"
              max="40"
              step="1"
              value={seedingEfficiency}
              onChange={e => setSeedingEfficiency(parseInt(e.target.value, 10))}
              className="w-full mt-2 accent-blue-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Standard Poisson distribution in 256 microchambers under FC40 fluorocarbon yields ~70 single cells.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Clonogenic Survival Rate (CloneR2 Media)</span>
              <span className="text-emerald-400 font-bold">{clonogenicSurvivalRate}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="1"
              value={clonogenicSurvivalRate}
              onChange={e => setClonogenicSurvivalRate(parseInt(e.target.value, 10))}
              className="w-full mt-2 accent-emerald-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Empirical benchmark is ~65% single-cell survival in StemFlex supplemented with CloneR2.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Expected Viable Clones:</span>
              <span className="text-xl font-bold text-emerald-300">~{survivingClones} Monoclonal Colonies</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Directly transferable to 96-well Bambanker freezing plates for rapid cryo-recovery.
            </p>
          </div>
        </div>

        {/* 50-Vial Seedbank Planner */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Two-Tiered 50-Vial Biobanking Structure
            </h4>
            <span className="text-xs font-mono text-cyan-400">{totalBankVials} Total Vials</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Selected QC-Verified Clones</span>
              <span className="text-cyan-400 font-bold">{selectedClonesCount} Clones</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={selectedClonesCount}
              onChange={e => setSelectedClonesCount(parseInt(e.target.value, 10))}
              className="w-full mt-2 accent-cyan-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">Standard core facility practice: 5-6 validated isogenic clones.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Master Bank (P3-P5)</span>
              <p className="mt-1 text-lg font-bold text-cyan-300">{masterVials} vials / clone</p>
              <span className="text-[10px] text-slate-500">{masterVials * selectedClonesCount} total master vials</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Working Bank (P6-P8)</span>
              <p className="mt-1 text-lg font-bold text-emerald-300">{workingVials} vials / clone</p>
              <span className="text-[10px] text-slate-500">{workingVials * selectedClonesCount} working vials</span>
            </div>
          </div>
        </div>
      </div>

      {/* ISSCR 5-Tenet Release Criteria Checklist */}
      <div className="mt-6 p-5 rounded-2xl border border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ISSCR 5-Tenet Quality Control Release Standards
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Every released cell line must meet all five tenets prior to biobank distribution.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-semibold ${
              allTenetsPassed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {allTenetsPassed ? 'Release Ready' : 'Incomplete QC'}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {ISSCR_TENETS.map(tenet => {
            const isChecked = checkedTenets[tenet.id];
            return (
              <div
                key={tenet.id}
                onClick={() => toggleTenet(tenet.id)}
                className={`cursor-pointer flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  isChecked
                    ? 'border-emerald-800/60 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/60 opacity-60'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      Tenet {tenet.tenetNumber}: {tenet.title}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">({tenet.testMethod})</span>
                  </div>
                  <p className="mt-1 text-slate-300">{tenet.standard}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Ready to track your 96-well clone plates and log trace QC calls in ASSURED Bench?
        </p>
        <a
          href="/studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-colors focus-visible:outline focus-visible:outline-blue-400"
        >
          Open ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
