import React, { useState } from 'react';
import { 
  Dna, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Info, 
  ExternalLink,
  PlusCircle,
  Scissors,
  Wand2,
  X
} from 'lucide-react';
import { AssuredProject } from '../../types/pipeline';
import { runTeachingDesign, DesignRequest } from '../../utils/designEngine';
import { locateGuide } from '../../utils/guideLayout';
import { DEFAULT_BENCH } from '../../data/benchDefaults';
import { DESIGN_EXAMPLES } from '../../data/generated/examples.generated';
import { GelSimulator } from './GelSimulator';
import { StudioDesignerModal } from './StudioDesignerModal';

interface Stage1DesignProps {
  project: AssuredProject;
  onUpdateProject: (updated: AssuredProject) => void;
  onProceed: () => void;
}

export const Stage1Design: React.FC<Stage1DesignProps> = ({
  project,
  onUpdateProject,
  onProceed
}) => {
  const [activeGuideId, setActiveGuideId] = useState(project.target.guides[0]?.id || 'g1');
  const [showSilentBlocks, setShowSilentBlocks] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);

  // Custom Design Form State
  const [customGene, setCustomGene] = useState('');
  const [customDisease, setCustomDisease] = useState('');
  const [customMode, setCustomMode] = useState<'SNP_KNOCKIN' | 'KNOCKOUT'>('SNP_KNOCKIN');
  const [customSeq, setCustomSeq] = useState('');
  const [customEditPos, setCustomEditPos] = useState(0);
  const [customAltBase, setCustomAltBase] = useState('T');
  const [designError, setDesignError] = useState<string | null>(null);

  const target = project.target;
  const isKnockout = target.targetType === 'KNOCKOUT' || !target.donor?.sequence;
  // Undefined when the project records no guide sequences (the MYD88 run).
  const activeGuide = target.guides.find(g => g.id === activeGuideId) || target.guides[0];
  const placement = activeGuide ? locateGuide(target.targetSequence5to3, activeGuide) : null;
  const donors = target.donors && target.donors.length > 0 ? target.donors : (target.donor && target.donor.sequence ? [target.donor] : []);

  const handleRunCustomDesign = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setDesignError(null);
      const req: DesignRequest = {
        gene: customGene.trim().toUpperCase(),
        diseaseName: customDisease.trim(),
        sequence: customSeq.trim(),
        mode: customMode,
        editPosition: Number(customEditPos),
        altBase: customAltBase
      };

      const newTarget = runTeachingDesign(req);
      const newProject: AssuredProject = {
        ...project,
        id: `custom-${newTarget.gene.toLowerCase()}-${Date.now()}`,
        title: `${newTarget.gene} ${customMode === 'KNOCKOUT' ? 'knockout' : 'SNP knock-in'}: teaching sketch`,
        createdAt: new Date().toISOString().split('T')[0],
        currentStage: 1,
        target: newTarget,
        bench: { ...DEFAULT_BENCH },
        clones: [],
        provenance: ['Teaching sketch on a pasted sequence: not the Assured CRISPR Design engine, and nothing was checked against a genome.'],
        verification: undefined
      };

      onUpdateProject(newProject);
      setShowCustomModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'The teaching sketch could not run';
      setDesignError(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Stage Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Dna className="w-4 h-4" />
            <span>Stage 1: Guided ASSURED CRISPR Design</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
              isKnockout 
                ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {isKnockout ? '✂️ Frameshift Knockout Mode' : '🧬 Precision SNP Knock-In Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStudioModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold transition-all shadow-md shadow-purple-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assured Studio Engine</span>
            </button>
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Try your own window (teaching sketch)</span>
            </button>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {target.assembly} • {target.chromosome}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-white">
          {target.gene}: {target.diseaseName} ({target.aminoAcidChange})
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          {isKnockout ? (
            <span>
              In <strong>Knockout Mode</strong>, Cas9 RNP complexes cut an early coding exon, and error-prone repair produces frameshift indels without any donor template.
            </span>
          ) : (
            <span>
              In <strong>Knock-In Mode</strong>, this lab uses two guides and an <strong>asymmetric single-stranded donor (ssODN)</strong>: 36 nt of homology on the PAM-distal side of the cut, 91 nt on the PAM-proximal side, with the non-PAM strand as template. Where the edit does not already disrupt the PAM, the protocol adds silent changes in the PAM or the last five seed bases so the repaired allele is not cut again (Ludwik et al., 2023, steps 23 and 24).
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Interactive Sequence Track (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Visual Genomic DNA & Guide Track */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase tracking-wider">
                Target Genomic Locus ({target.genomicCoordinate})
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block"></span>
                  <span>gRNA Binding</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
                  <span>PAM{activeGuide ? ` (${activeGuide.pam})` : ''}</span>
                </span>
                {!isKnockout && (
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
                    <span>Target SNP</span>
                  </span>
                )}
              </div>
            </div>

            {/* DNA Strands Graphic: the active guide, its PAM, its cut and the target base are highlighted from the sequence itself */}
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-x-auto space-y-2">
              <div className="flex items-start gap-3 text-slate-400">
                <span className="w-24 shrink-0 font-bold text-slate-500">Sense 5'-3':</span>
                <span className="text-slate-200 tracking-wider break-all leading-6">
                  {target.targetSequence5to3.split('').map((base, i) => {
                    const isEdit = !isKnockout && i === target.windowCentreIndex;
                    const inGuide = !!placement && i >= placement.start && i < placement.start + 20;
                    const inPam = !!placement && i >= placement.pamStart && i < placement.pamStart + 3;
                    const atCut = !!placement && i === placement.cut;
                    const cls = isEdit ? 'bg-rose-500 text-white rounded-sm' : inPam ? 'bg-amber-900/70 text-amber-200' : inGuide ? 'bg-cyan-950 text-cyan-300' : '';
                    return <span key={i} className={`${cls} ${atCut ? 'border-l-2 border-red-400' : ''}`}>{base}</span>;
                  })}
                </span>
              </div>
              <div className="flex items-start gap-3 text-slate-400">
                <span className="w-24 shrink-0 font-bold text-slate-500">Complement:</span>
                <span className="text-slate-500 tracking-wider break-all leading-6">{target.complementSequence3to5}</span>
              </div>

              <div className="pt-2 flex items-start gap-3 text-[11px] text-cyan-400">
                <span className="w-24 shrink-0 font-bold text-cyan-500">Active guide:</span>
                {activeGuide ? (
                  <span>
                    Cut is <strong>{activeGuide.cutDistanceToEdit} bp</strong> from the {isKnockout ? 'chosen position' : 'target base'} | strand <strong>{activeGuide.strand}</strong> | PAM <strong>{activeGuide.pam}</strong>
                    {activeGuide.strand === '-' && ' | shown on the sense strand, where the guide reads as its reverse complement'}
                    {!placement && ' | this guide sequence does not occur in the displayed window'}
                  </span>
                ) : (
                  <span className="text-slate-400">No guide sequences were recorded for this project.</span>
                )}
              </div>
            </div>
          </div>

          {/* Architecture: ssODN donors (knock-in) or NHEJ disruption (knockout), read from the design */}
          {!isKnockout ? (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">ASSURED asymmetric ssODN architecture</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{donors.length === 0 ? 'No donor in this design' : `${donors.length} donor${donors.length > 1 ? 's' : ''}, ${donors[0].totalLength} nt each`}</h4>
              </div>

              {donors.map((d) => (
                <div key={d.name} className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-bold text-white">{d.name}{d.forGuide ? ` (matched to ${d.forGuide})` : ''}</div>
                  <div className="flex h-5 w-full rounded-lg overflow-hidden text-[10px] font-bold text-slate-950 text-center">
                    <div style={{ width: `${(d.arm5Length / d.totalLength) * 100}%` }} className="bg-cyan-400 flex items-center justify-center">5' arm ({d.arm5Length} nt)</div>
                    <div className="w-0.5 bg-red-500" title="cut site" />
                    <div style={{ width: `${(d.arm3Length / d.totalLength) * 100}%` }} className="bg-emerald-400 flex items-center justify-center">3' arm ({d.arm3Length} nt)</div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ordered as the {d.strand} strand, the non-PAM strand of its guide. The cut falls at the red line: {d.pamDistalArm ?? '?'} nt of homology on the PAM-distal side and {d.pamProximalArm ?? '?'} nt on the PAM-proximal side, as the protocol specifies.
                  </p>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300 break-all leading-relaxed">{d.sequence}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /><span>Intended edit</span></span>
                      <span className="text-slate-300 block">{d.intendedEditDescription}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /><span>Blocking changes</span></span>
                      <span className="text-slate-300 block">{showSilentBlocks ? d.blockingChanges : 'hidden'}</span>
                      <span className="text-[10px] text-slate-500 block">Stop Cas9 from re-cutting the repaired allele</span>
                    </div>
                  </div>
                </div>
              ))}

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input type="checkbox" checked={showSilentBlocks} onChange={(e) => setShowSilentBlocks(e.target.checked)} className="w-4 h-4 accent-cyan-500 rounded" />
                <span>Show blocking changes</span>
              </label>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                The paper specifies an Alt-R HDR modified ssODN but not its chemistry, so no end modifications are drawn. Reading-frame effects are shown only where the design itself lists them, and nothing here has been checked beyond the data in this project.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Knockout by non-homologous end joining</h4>
                  <span className="text-xs text-slate-400">One or two Cas9 cuts and no donor; Stage 4 reads the resulting indels from the traces.</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 text-slate-300">
                <p className="leading-relaxed">
                  Error-prone repair leaves insertions or deletions at the cut. An indel whose length is not a multiple of three shifts the reading frame if it lies in coding sequence. Whether that removes the protein has to be shown by a functional test; a trace cannot show it.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Dual Guide Selector & Lock In (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Guide RNAs ({target.guides.length})
            </h4>

            {target.guides.map(g => {
              const isSelected = g.id === activeGuideId;

              return (
                <div
                  key={g.id}
                  onClick={() => setActiveGuideId(g.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500 shadow-lg shadow-cyan-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white">{g.name}</span>
                    <span className="font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded text-[10px]">
                      {g.strand} strand
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-300 my-1 tracking-wider">
                    {g.sequence} <span className="text-amber-400 font-bold">[{g.pam}]</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Cut distance: <strong className="text-white">{g.cutDistanceToEdit} bp</strong></span>
                    <span>{g.efficiencyScore !== undefined ? <>Heuristic rank score: <strong className="text-emerald-400">{g.efficiencyScore}/100</strong></> : 'No score computed'}</span>
                  </div>
                </div>
              );
            })}

            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                The lab convention is two guides per edit. The paper notes that each extra guide adds off-target risk and, for knock-ins, can need extra blocking changes in the donor, so the number of guides should be chosen with care (Ludwik et al., 2023).
              </span>
            </div>

            {/* External Tool Reference */}
            <div className="pt-2 text-center">
              <a
                href="https://assured-crispr-design.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center justify-center gap-1 transition-colors"
              >
                <span>For a real design, use the standalone Assured CRISPR Design</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Where this design comes from and what was checked */}
            {(project.provenance || project.verification || target.notes) && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">Provenance and checks</span>
                {project.verification && (
                  <p>
                    <strong className="text-slate-200">{project.verification.passed} of {project.verification.total}</strong> offline checks against {project.verification.assembly} pass ({project.verification.note}).
                    {project.verification.failed.length > 0 && <> Not passing: {project.verification.failed.join('; ')}.</>}
                  </p>
                )}
                {project.provenance && <ul className="list-disc list-inside space-y-0.5">{project.provenance.map((p, i) => <li key={i}>{p}</li>)}</ul>}
                {target.notes && <ul className="list-disc list-inside space-y-0.5">{target.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
              </div>
            )}

            {/* Lock In Button */}
            <button
              onClick={onProceed}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all mt-4"
            >
              <span>Lock Design & Proceed to Order (Stage 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* In-Silico PCR Agarose Gel Simulator */}
      <GelSimulator project={project} />

      {/* Modal: teaching sketch on a pasted window */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white">Try your own window (teaching sketch)</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-200/90 leading-relaxed space-y-2">
              <p>
                This is a teaching sketch, not the Assured CRISPR Design engine. It ranks NGG sites by their distance to the target, lays out the 36/91 donor on the right side of each cut, and stops there. It does not check specificity, reading frame, SNPs or primers, and it does not design blocking changes.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">Load a verified example:</span>
                {DESIGN_EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setCustomGene(ex.gene); setCustomDisease(ex.diseaseName); setCustomMode(ex.mode); setCustomSeq(ex.sequence);
                      setCustomEditPos(ex.editPosition); setCustomAltBase(ex.altBase); setDesignError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunCustomDesign} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Gene Symbol</label>
                  <input
                    type="text"
                    value={customGene}
                    onChange={(e) => setCustomGene(e.target.value)}
                    required
                    placeholder="e.g. MYD88, APOE, BRCA1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Disease / Phenotype</label>
                  <input
                    type="text"
                    value={customDisease}
                    onChange={(e) => setCustomDisease(e.target.value)}
                    required
                    placeholder="e.g. Rare variant modeling"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Design Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomMode('KNOCKOUT')}
                    className={`py-2 px-3 rounded-xl border font-bold text-left transition-all ${
                      customMode === 'KNOCKOUT'
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ✂️ Gene Knockout (Frameshift InDel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomMode('SNP_KNOCKIN')}
                    className={`py-2 px-3 rounded-xl border font-bold text-left transition-all ${
                      customMode === 'SNP_KNOCKIN'
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🧬 Precision SNP Knock-In (Asym ssODN)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300">Sequence window (5'-3')</label>
                  <span className="text-[10px] text-slate-500">{customSeq.length} bp</span>
                </div>
                <textarea
                  rows={4}
                  value={customSeq}
                  onChange={(e) => setCustomSeq(e.target.value.toUpperCase())}
                  required
                  placeholder="Paste 150 to 500 nt, 5' to 3'. A knock-in donor needs 127 nt around the cut."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono text-xs focus:border-cyan-500 focus:outline-none break-all"
                />
              </div>

              {(
                <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">{customMode === 'SNP_KNOCKIN' ? 'Target base position (0-index)' : 'Position to cut near (0-index)'}</label>
                    <input
                      type="number"
                      min={0}
                      max={customSeq.length - 1}
                      value={customEditPos}
                      onChange={(e) => setCustomEditPos(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  {customMode === 'SNP_KNOCKIN' && (<div>
                    <label className="font-bold text-slate-300 block mb-1">New base</label>
                    <select
                      value={customAltBase}
                      onChange={(e) => setCustomAltBase(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                    >
                      <option value="A">A (Adenine)</option>
                      <option value="T">T (Thymine)</option>
                      <option value="C">C (Cytosine)</option>
                      <option value="G">G (Guanine)</option>
                    </select>
                  </div>)}
                </div>
              )}

              {designError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                  {designError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  Run teaching sketch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudioDesignerModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        project={project}
        onApplyDesign={onUpdateProject}
      />
    </div>
  );
};
