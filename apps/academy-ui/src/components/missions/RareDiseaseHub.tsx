import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, FlaskConical, Copy, Check, ShieldCheck, AlertTriangle, Dna } from 'lucide-react';
import { RARE_DISEASE_MISSIONS, UNVERIFIED_MISSIONS } from '../../data/rareDiseases';
import { RareDiseaseMission } from '../../types';

interface RareDiseaseHubProps {
  onSelectMissionForLab: (mission: RareDiseaseMission) => void;
}

export const RareDiseaseHub: React.FC<RareDiseaseHubProps> = ({ onSelectMissionForLab }) => {
  const [selectedMissionId, setSelectedMissionId] = useState(RARE_DISEASE_MISSIONS[0].id);
  const [copiedSeq, setCopiedSeq] = useState<string | null>(null);

  const activeMission = RARE_DISEASE_MISSIONS.find(m => m.id === selectedMissionId) || RARE_DISEASE_MISSIONS[0];
  const v = activeMission.verification;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSeq(id);
    setTimeout(() => setCopiedSeq(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-800/60 shadow-2xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 border border-purple-800 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Design missions</span>
          </span>
          <span className="text-xs text-slate-400">Built on real reference sequence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Verified design missions</h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Two designs built on RefSeqGene records and checked against GRCh38. Look at where each guide cuts, copy the ssODN, and, for APOE, practise reading real Sanger traces in the pipeline. Each mission shows how many offline checks it passes. Genome-wide specificity has not been assessed for any of them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Targets</h3>

          {RARE_DISEASE_MISSIONS.map(m => {
            const isSelected = m.id === selectedMissionId;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedMissionId(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-white text-sm">{m.gene}</span>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">{m.strategy}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200">{m.diseaseName}</h4>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">{m.proteinChange} &bull; {m.inheritance}</p>
              </div>
            );
          })}

          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Removed from the verified set</span>
            </h3>
            {UNVERIFIED_MISSIONS.map(u => (
              <div key={u.id} className="text-[11px] text-slate-400 leading-relaxed">
                <div className="font-bold text-slate-300">{u.gene}: {u.claimed}</div>
                <div>{u.reason}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider block">Target: {activeMission.genomicCoord}</span>
              <h2 className="text-2xl font-black text-white mt-1">{activeMission.diseaseName}</h2>
              <p className="text-sm text-slate-400 font-mono mt-0.5">
                Gene: <strong className="text-white">{activeMission.gene}</strong> | Variant: <strong className="text-cyan-400">{activeMission.proteinChange}</strong> ({activeMission.refAllele} &gt; {activeMission.altAllele})
              </p>
            </div>
            <button
              onClick={() => onSelectMissionForLab(activeMission)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
              title="Opens the virtual lab, a decision game that does not use this mission's data"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Open the virtual lab</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs leading-relaxed">
            <span className="font-bold text-slate-300 uppercase tracking-wider block text-[11px]">Biology</span>
            <p className="text-slate-300">{activeMission.phenotypeDescription}</p>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 text-xs leading-relaxed ${v.failed.length === 0 ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-amber-950/20 border-amber-800/50'}`}>
            <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px] ${v.failed.length === 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
              {v.failed.length === 0 ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{v.passed} of {v.total} checks against {v.assembly} pass</span>
            </span>
            {v.failed.length > 0 && <p className="text-amber-200/90">Not passing: {v.failed.join('; ')}.</p>}
            <p className="text-slate-400">{activeMission.curationNotes}</p>
            <p className="text-[11px] text-slate-500">{v.note}.</p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Guide RNAs ({activeMission.recommendedGuides.length})</span>
            <div className="space-y-2">
              {activeMission.recommendedGuides.map((g, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                  <div>
                    <span className="font-bold text-cyan-400 mr-2">{g.name}</span>
                    <span className="text-slate-300 tracking-wider">{g.sequence}</span>
                    <span className="text-amber-400 font-bold ml-2">[{g.pam}]</span>
                    <span className="text-slate-500 ml-2">{g.strand} strand</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Cut {g.cutDist} bp from the edit</span>
                    <button onClick={() => handleCopy(g.sequence, `guide-${idx}`)} className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors" title="Copy guide sequence">
                      {copiedSeq === `guide-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {activeMission.recommendedGuides.length < 2 && (
              <p className="text-[11px] text-amber-300/90">This design has one guide. The lab convention is two guides per edit, so finding a second is part of the exercise.</p>
            )}
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Asymmetric ssODN donors ({activeMission.ssodns.length})</span>
            {activeMission.ssodns.map((d) => (
              <div key={d.name} className="space-y-2 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-white">{d.name}</span>
                  <button onClick={() => handleCopy(d.sequence, d.name)} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                    {copiedSeq === d.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSeq === d.name ? 'Copied' : 'Copy sequence'}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {d.totalLength} nt &bull; ordered as the {d.strand} strand (non-PAM strand of {d.forGuide}) &bull; {d.pamDistalArm} nt PAM-distal and {d.pamProximalArm} nt PAM-proximal arm
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300 break-all leading-relaxed">{d.sequence}</div>
                <div className="text-[11px] text-slate-400"><Dna className="w-3 h-3 inline mr-1 text-rose-400" />Intended edit: {d.intendedEditDescription}. Blocking changes: {d.blockingChanges}.</div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-200">
              <span className="font-bold block mb-1">Blocking changes in the design</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-300/90">
                {activeMission.silentChanges.map((change, idx) => (<li key={idx}>{change}</li>))}
              </ul>
            </div>
            {activeMission.traceProjectId && (
              <p className="text-[11px] text-slate-400">Real Sanger traces for this mission are in the Workbench tab (project &quot;APOE p.Arg176Cys&quot;) and under Training datasets.</p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <a href="https://assured-crispr-design.vercel.app" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all">
              <span>Open the Assured CRISPR Design tool</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a href="https://assured-qc.vercel.app" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md shadow-purple-500/20 transition-all">
              <span>Analyse traces in Assured QC</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
