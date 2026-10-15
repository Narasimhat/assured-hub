import React, { useState } from 'react';
import { FlaskConical, Calculator, Calendar, ArrowRight, Clock, Info, CheckSquare } from 'lucide-react';
import { AssuredProject, CloningMethod, RnpCondition } from '../../types/pipeline';
import { RNP_TABLE, RNP_TOTAL_UL, NEON_CONDITIONS, conditionFor } from '../../data/benchDefaults';
import { ProtocolModal } from './ProtocolModal';

interface Stage3BenchProps {
  project: AssuredProject;
  onUpdateProject: (updated: AssuredProject) => void;
  onProceed: () => void;
}

const CITATION = 'Ludwik et al., STAR Protocols 2023, doi 10.1016/j.xpro.2023.102406';

const fmt = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export const Stage3Bench: React.FC<Stage3BenchProps> = ({ project, onUpdateProject, onProceed }) => {
  const bench = project.bench;
  const isKnockout = project.target.targetType === 'KNOCKOUT' || !project.target.donor?.sequence;
  const guideCount = project.target.guides.length;
  const [reactions, setReactions] = useState(bench.reactions || 1);
  const [condition, setCondition] = useState<RnpCondition>(bench.condition ?? conditionFor(Math.max(guideCount, 2), isKnockout));
  const [cloning, setCloning] = useState<CloningMethod>(bench.cloningMethod);
  const [efficiency, setEfficiency] = useState(50);
  const [wanted, setWanted] = useState(15);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  const mix = RNP_TABLE[condition];
  const scaled = (v: number | null) => (v === null ? null : fmt(v * reactions));
  const toScreen = Math.ceil(wanted / (efficiency / 100));
  const conditionIsAssumed = bench.condition === undefined;

  const handleUpdate = () => {
    onUpdateProject({ ...project, bench: { ...bench, reactions, condition, cloningMethod: cloning, isBenchCompleted: true, valuesSource: 'user-entered' } });
    onProceed();
  };

  const rows: { label: string; value: string | null; note?: string }[] = [
    { label: 'Cas9 nuclease', value: scaled(mix.cas9) },
    { label: 'gRNA 1', value: scaled(mix.gRNA1) },
    { label: 'gRNA 2', value: scaled(mix.gRNA2), note: 'not used' },
    { label: 'ssODN, Alt-R HDR modified, 12.5 \u00b5M', value: scaled(mix.ssodn), note: 'not used (knockout)' },
    { label: 'R buffer', value: scaled(mix.rBuffer) },
  ];

  const roadmap = [
    { day: 'Before', title: 'hiPSC culture and CRISPR components', time: '1 week + 1\u20132 weeks', desc: 'Culture the line as described in the paper and order or synthesise gRNAs, Cas9 and the ssODN while you check the target for SNPs in the guide and primer sites.' },
    { day: 'Day \u22121', title: 'Plate cells for nucleofection', time: '0.5\u20131 h', desc: 'Re-plating synchronises the cell cycle so more cells are in S-phase, when HDR is most active. Plate 2 \u00d7 10\u2075 cells in each of 2 wells of a 6-well plate: one well for the nucleofection and one as the untransfected control. One ~50% confluent well usually gives ~1 \u00d7 10\u2076 cells.' },
    { day: 'Day 0', title: 'Deliver the CRISPR components', time: '3\u20134 h', desc: `Mix Cas9 and gRNAs with R buffer (Table 7, ${RNP_TOTAL_UL} \u00b5L total) and incubate 10\u201320 min at room temperature. For knock-ins add 3 \u00b5L of 12.5 \u00b5M Alt-R HDR modified ssODN immediately before transfection. Neon ${NEON_CONDITIONS.tip} tip: ${NEON_CONDITIONS.voltage}, ${NEON_CONDITIONS.pulseWidth}, ${NEON_CONDITIONS.pulses} pulse. Recover in StemFlex/CloneR2.` },
    { day: '72 h', title: 'Check editing in the bulk population', time: '24 h', desc: 'Harvest cells 72 h after transfection, isolate gDNA, and compare the edited and unedited Sanger traces with a deconvolution tool (the paper describes Synthego ICE and mentions TIDE). The estimate sets how many clones to screen.' },
    { day: '~2 weeks', title: 'Single-cell clone isolation', time: '2 weeks', desc: 'The paper uses the isoCell platform (256 wells per plate, ~40% outgrowth, ~100 clones) and notes that limiting dilution and clone picking can be used instead. Move colonies to mirror 96-well plates when they cover about a quarter of a grid chamber.' },
    { day: 'Screening', title: 'PCR and Sanger sequencing of clones', time: '24\u201348 h', desc: 'Crude whole-cell lysates are enough for PCR. Analyse the traces of every clone against the unedited control (Stage 4).' },
    { day: 'After', title: 'Freeze clones and make seed banks', time: '1 h + 1 week', desc: 'Freeze the mirror plate of each accepted clone, then expand and bank it.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <FlaskConical className="w-4 h-4" />
            <span>Stage 3: Bench companion for the ASSURED protocol</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Source: {CITATION}</span>
        </div>
        <h2 className="text-2xl font-black text-white">Executing the wet-lab protocol for {project.target.gene}</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Volumes, electroporation settings and timings below are taken from the published protocol. Check them against the paper and your institution&apos;s procedures before you work at the bench.
          </p>
          <button
            onClick={() => setShowProtocolModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Interactive Protocol & Checklist</span>
          </button>
        </div>
        {bench.valuesSource === 'protocol-defaults' && (
          <p className="text-[11px] text-amber-300/90">The values below are protocol defaults for this preset, not values recorded at the bench. Confirm them yourself to record your own.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
              <Calculator className="w-4 h-4" />
              <span>RNP mix calculator (Table 7)</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 flex justify-between">
                  <span>Number of reactions:</span>
                  <span className="text-cyan-400 font-mono font-bold">{reactions}</span>
                </label>
                <input type="range" min="1" max="6" value={reactions} onChange={(e) => setReactions(Number(e.target.value))} className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer mt-1" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block">Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value as RnpCondition)} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
                  {(Object.keys(RNP_TABLE) as RnpCondition[]).map((c) => (
                    <option key={c} value={c}>{RNP_TABLE[c].label}</option>
                  ))}
                </select>
                {conditionIsAssumed && <span className="text-[10px] text-slate-500">The guide count of the lab run was not recorded; the two-guide convention is preselected.</span>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block">Single-cell cloning</label>
                <select value={cloning} onChange={(e) => setCloning(e.target.value as CloningMethod)} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
                  <option value="isocell">isoCell platform (described in the paper)</option>
                  <option value="limiting-dilution">Limiting dilution (named as an alternative)</option>
                  <option value="clone-picking">Clone picking (named as an alternative)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                Pipetting table ({reactions} {reactions === 1 ? 'mix' : 'mixes'} of {RNP_TOTAL_UL} &micro;L)
              </span>
              {rows.map((r) => (
                <div key={r.label} className="flex justify-between py-1 border-b border-slate-800 last:border-b-0">
                  <span className="text-slate-300">{r.label}:</span>
                  <span className={`font-bold ${r.value === null ? 'text-slate-500 line-through' : 'text-cyan-400'}`}>{r.value === null ? r.note : `${r.value} \u00b5L`}</span>
                </div>
              ))}
              <p className="text-[10px] text-slate-500 font-sans pt-1">Simple multiples of the per-mix volumes in Table 7; the paper does not give an overage rule.</p>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Electroporation (Neon, 10 &micro;L kit):</strong> tip {NEON_CONDITIONS.tip}, {NEON_CONDITIONS.voltage}, {NEON_CONDITIONS.pulseWidth}, {NEON_CONDITIONS.pulses} pulse. Other electroporation or nucleofection systems need their own optimisation.
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Info className="w-4 h-4" />
              <span>How many clones to screen?</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="text-slate-300">Editing efficiency in bulk (%)
                <input type="number" min={1} max={100} value={efficiency} onChange={(e) => setEfficiency(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200" />
              </label>
              <label className="text-slate-300">Edited clones wanted
                <input type="number" min={1} max={200} value={wanted} onChange={(e) => setWanted(Math.min(200, Math.max(1, Number(e.target.value) || 1)))} className="w-full mt-1 p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200" />
              </label>
            </div>
            <p className="text-xs text-slate-300">Screen about <strong className="text-emerald-400 font-mono">{toScreen}</strong> clones. The paper&apos;s examples: at 50% efficiency 30 clones give 15 edited clones; at 5% it takes 300.</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Roadmap from the protocol</span>
            </div>
            <div className="space-y-3">
              {roadmap.map((step) => (
                <div key={step.day + step.title} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-20 shrink-0 font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-1 rounded text-center border border-slate-800">{step.day}</div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{step.title}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono shrink-0">
                        <Clock className="w-3 h-3" />
                        {step.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdate}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all mt-4"
            >
              <span>Bench protocol completed: go to Sanger QC (Stage 4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProtocolModal
        isOpen={showProtocolModal}
        onClose={() => setShowProtocolModal(false)}
        project={project}
      />
    </div>
  );
};
