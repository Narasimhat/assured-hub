import React, { useState, useMemo } from 'react';
import { X, Printer, CheckSquare, Square, FlaskConical, Beaker, Clock } from 'lucide-react';
import { AssuredProject } from '../../types/pipeline';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AssuredProject;
}

const CELL_PLATFORMS = {
  ipsc: {
    name: 'Human Induced Pluripotent Stem Cells (iPSC)',
    solution: 'P3 Primary Cell Solution (or Neon R Buffer)',
    program: 'B-016 stem program or 10 µL Neon Tip (1100V, 20ms, 2 pulses)',
    density: '200,000 cells / reaction',
    medium: 'mTeSR Plus / Essential 8 + CloneR or RevitaCell (10 µM)',
    recovery: '32°C transient incubation for 24h (boosts HDR knock-in up to 2-fold)'
  },
  hek293: {
    name: 'HEK293T / Immortalized Cell Line',
    solution: 'SF Cell Line Solution',
    program: 'CM-130 cell line program',
    density: '250,000 cells / reaction',
    medium: 'DMEM + 10% FBS + 1% Pen/Strep',
    recovery: 'Standard 37°C incubation'
  },
  tcells: {
    name: 'Primary Human T-Cells / PBMCs',
    solution: 'P3 Primary Cell Solution',
    program: 'EO-115 primary T-cell program',
    density: '1,000,000 cells / reaction',
    medium: 'X-VIVO 15 + 5% Human AB Serum + IL-2 (100 U/mL)',
    recovery: '37°C incubation'
  },
  k562: {
    name: 'K562 / Suspension Hematopoietic Cells',
    solution: 'SF Cell Line Solution',
    program: 'FF-120 suspension program',
    density: '500,000 cells / reaction',
    medium: 'RPMI-1640 + 10% FBS',
    recovery: '37°C incubation'
  }
};

export const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, project }) => {
  const [platformKey, setPlatformKey] = useState<keyof typeof CELL_PLATFORMS>('ipsc');
  const [numReactions, setNumReactions] = useState(2);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const platform = CELL_PLATFORMS[platformKey];
  const isKnockout = project.target.targetType === 'KNOCKOUT' || !project.target.donor?.sequence;
  const gene = project.target.gene || 'Target Locus';

  const rxnCount = Math.max(1, numReactions || 1);
  const excessFactor = 1.15;
  const totalVolumeMultiplier = rxnCount * excessFactor;

  const rnpRecipe = useMemo(() => {
    const items = [
      {
        reagent: 'Cas9 Nuclease (61 µM / 10 mg/mL)',
        stock: '61 µM',
        singleRxnVol: 0.8,
        finalAmount: '50 pmol (8 µg)'
      }
    ];

    if (isKnockout) {
      items.push(
        {
          reagent: 'gRNA 1 (Synthetic sgRNA)',
          stock: '100 µM',
          singleRxnVol: 0.6,
          finalAmount: '60 pmol'
        },
        {
          reagent: 'gRNA 2 (Synthetic sgRNA)',
          stock: '100 µM',
          singleRxnVol: 0.6,
          finalAmount: '60 pmol'
        }
      );
    } else {
      items.push({
        reagent: 'Guide RNA (Synthetic sgRNA)',
        stock: '100 µM',
        singleRxnVol: 1.2,
        finalAmount: '120 pmol (2.4x molar excess)'
      });
      items.push({
        reagent: 'ssODN Donor Repair Template',
        stock: '100 µM',
        singleRxnVol: 1.0,
        finalAmount: '100 pmol'
      });
    }

    return items;
  }, [isKnockout]);

  const toggleStep = (stepId: string) => {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black text-white">CRISPR Wet-Lab Protocol Checklist</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                STAR Protocols
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Standard operating procedure for <strong>{gene}</strong> genome editing in <strong>{platform.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
              title="Print checklist"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Checklist</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Host Cell Platform</label>
            <select
              value={platformKey}
              onChange={(e) => setPlatformKey(e.target.value as keyof typeof CELL_PLATFORMS)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ipsc">Human iPSCs (Stem Cells)</option>
              <option value="hek293">HEK293T (Immortalized)</option>
              <option value="tcells">Primary Human T-Cells</option>
              <option value="k562">K562 (Hematopoietic)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Reactions ({rxnCount} + 15% excess)</label>
            <input
              type="number"
              min={1}
              max={96}
              value={numReactions}
              onChange={(e) => setNumReactions(parseInt(e.target.value, 10) || 1)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono"
            />
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 flex flex-col justify-center">
            <div>Buffer: <strong className="text-cyan-400">{platform.solution}</strong></div>
            <div>Electroporation: <strong className="text-cyan-400">{platform.program}</strong></div>
            <div>Cell Density: <strong>{platform.density}</strong></div>
          </div>
        </div>

        {/* Master Mix Pipetting Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Beaker className="w-4 h-4" />
            <span>1. RNP Electroporation Master Mix ({rxnCount} rxns)</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Reagent</th>
                  <th className="p-2.5">Stock</th>
                  <th className="p-2.5">1x Volume</th>
                  <th className="p-2.5">Master Mix ({rxnCount}x)</th>
                  <th className="p-2.5">Final Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {rnpRecipe.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-2.5 font-sans font-bold text-white">{item.reagent}</td>
                    <td className="p-2.5 text-slate-400">{item.stock}</td>
                    <td className="p-2.5 text-cyan-400 font-bold">{item.singleRxnVol.toFixed(1)} µL</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{(item.singleRxnVol * totalVolumeMultiplier).toFixed(1)} µL</td>
                    <td className="p-2.5 font-sans text-slate-400">{item.finalAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step-by-Step Bench Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Clock className="w-4 h-4" />
            <span>2. Step-by-Step Operating Protocol</span>
          </div>

          <div className="space-y-2">
            {[
              { id: 's1', day: 'Day 0', title: 'Cell Harvest & Nucleofection', desc: `Pellet ${platform.density} at 200 x g for 5 min. Resuspend in ${platform.solution}. Add RNP mix and pulse on ${platform.program}. Immediately rescue cells in 80 µL pre-warmed medium.` },
              { id: 's2', day: 'Day 1', title: 'Post-Electroporation Recovery', desc: `${platform.recovery}. Refresh medium without survival supplement.` },
              { id: 's3', day: 'Day 3', title: 'Bulk Population Edit Check', desc: 'Harvest 10,000 cells. Lyse in QuickExtract. Run Sanger sequencing to evaluate pool cut/HDR efficiency before single-cell cloning.' },
              { id: 's4', day: 'Days 4-12', title: 'Single-Cell Cloning & Expansion', desc: 'Plate single cells into 96-well culture plates (0.5 cells/well or FACS single-cell sorting into 100 µL conditioned medium with CloneR/survival factor). Expand for 10-14 days until discrete colonies emerge.' },
              { id: 's5', day: 'Day 14', title: 'Colony Direct PCR & Gel Screening', desc: 'Pick 1/4 of each colony for PCR with Assured primers. Run 2% agarose gel and compare against the In-Silico Gel Simulator.' },
              { id: 's6', day: 'Day 15', title: 'Sanger Trace QC & Clone Prioritization', desc: 'Submit candidate amplicons to Sanger sequencing. Load returned .ab1 files into Stage 4 (QC) for automated deconvolution and clone ranking.' }
            ].map(step => (
              <div
                key={step.id}
                onClick={() => toggleStep(step.id)}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  checkedSteps.has(step.id) ? 'bg-emerald-950/20 border-emerald-800/60' : 'bg-slate-950 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="mt-0.5 text-emerald-400">
                  {checkedSteps.has(step.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-500" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{step.day}: {step.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
