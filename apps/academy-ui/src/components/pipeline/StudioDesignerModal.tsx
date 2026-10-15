import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Dna, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Scissors, 
  Layers, 
  ExternalLink,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { AssuredProject, TargetLocus } from '../../types/pipeline';
import { 
  runStudioInSilicoDesign, 
  fetchEnsemblGeneModel, 
  StudioDesignRequest, 
  EnsemblGeneResult 
} from '../../services/studioDesignService';
import { DEFAULT_BENCH } from '../../data/benchDefaults';

interface StudioDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AssuredProject;
  onApplyDesign: (newProject: AssuredProject) => void;
}

const DEFAULT_GENOMIC_SEQS: Record<string, { seq: string; pos: number; ref: string; alt: string; aa: string; disease: string }> = {
  APOE: {
    seq: 'CTGGGCGCGGACATGGAGGACGTGTGCGGCCGCCTGGTGCAGTACCGCGGCGAGGTGCAGGCCATGCTCGGCCAGAGCACCGAGGAGCTGCGGGTGCGCCTCGCCTCCCACCTGCGCAAGCTGCGTAAGCGGCTCCTCCGCGATGCCGATGACCTGCAGAAGCGCCTGGCAGTGTACCAGGCCGGGGCCCGCGAGGGCGCCGAGCGCGGCCTCAGCGCCATCCGCGAGCGCCTGGGGCCCCTGGTGGAACAGGGCCGCGTGCGGGCC',
    pos: 154,
    ref: 'C',
    alt: 'T',
    aa: 'p.Arg176Cys',
    disease: 'Type III Hyperlipoproteinemia'
  },
  MYD88: {
    seq: 'ATGGCTGCAGGAGGTCCCGGCGCGGGGTCTGCGGCCCCGGTCTCCTCCACATCCTCCCTTCCCCTGGCTGCTCTCAACATGCGAGTGCGGCGCCGCCTGTCTCTGTTCTTGAACGTGCGGACACAGGTGGCGGCCGACTGGACCGCGCTGGCGGAGGAGATGGACTTTGAGTACTTGGAGATCCGGCAACTGGAGACACAAGCGGACCCCACTGGCAGGCTGCTGGACGCCTGGCAGGGACGCCCTGGCGCCTCTGTAGGCCGACTGCTCGA',
    pos: 70,
    ref: 'C',
    alt: 'T',
    aa: 'Frameshift Knockout',
    disease: 'Innate Immune Deficiency'
  },
  HBB: {
    seq: 'ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACCATGGTGCATCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGG',
    pos: 70,
    ref: 'A',
    alt: 'T',
    aa: 'p.Glu7Val (HbS)',
    disease: 'Sickle Cell Disease'
  },
  TP53: {
    seq: 'ATGTTTTGCCAACTGGCCAAGACCTGCCCTGTGCAGCTGTGGGTTGATTCCACACCCCCGCCCGGCACCCGCGTCCGCGCCATGGCCATCTACAAGCAGTCACAGCACATGACGGAGGTTGTGAGGCGCTGCCCCCACCATGAGCGCTGCTCAGATAGCGATGGTCTGGCCCCTCCTCAGCATCTTATCCGAGTGGAAGGAAATTTGCGTGTGGAGTATTTGGATGACAGAAACACTTTTCGACATAGTGTGGTGGTGCCCTATGAGCCGC',
    pos: 125,
    ref: 'C',
    alt: 'T',
    aa: 'p.Arg248Trp',
    disease: 'Li-Fraumeni Syndrome'
  }
};

export const StudioDesignerModal: React.FC<StudioDesignerModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyDesign
}) => {
  const [geneInput, setGeneInput] = useState(project.target.gene || 'APOE');
  const [diseaseInput, setDiseaseInput] = useState(project.target.diseaseName || 'Cardiovascular / Metabolic Risk');
  const [mode, setMode] = useState<'SNP_KNOCKIN' | 'KNOCKOUT'>('SNP_KNOCKIN');
  const [genomicSeq, setGenomicSeq] = useState(
    DEFAULT_GENOMIC_SEQS[project.target.gene]?.seq || DEFAULT_GENOMIC_SEQS.APOE.seq
  );
  const [editPos, setEditPos] = useState(154);
  const [refBase, setRefBase] = useState('C');
  const [altBase, setAltBase] = useState('T');
  const [aaChange, setAaChange] = useState('p.Arg176Cys');

  const [isFetchingEnsembl, setIsFetchingEnsembl] = useState(false);
  const [ensemblMeta, setEnsemblMeta] = useState<EnsemblGeneResult | null>(null);
  const [computedTarget, setComputedTarget] = useState<TargetLocus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchEnsembl = async () => {
    if (!geneInput.trim()) return;
    setIsFetchingEnsembl(true);
    setErrorMessage(null);
    try {
      const meta = await fetchEnsemblGeneModel(geneInput);
      setEnsemblMeta(meta);
      setDiseaseInput(meta.description.split('[')[0].trim() || diseaseInput);
      if (meta.sequence && meta.sequence.length >= 100) {
        setGenomicSeq(meta.sequence.slice(0, 500));
        setEditPos(Math.floor(Math.min(250, meta.sequence.length / 2)));
      } else if (DEFAULT_GENOMIC_SEQS[meta.symbol]) {
        const def = DEFAULT_GENOMIC_SEQS[meta.symbol];
        setGenomicSeq(def.seq);
        setEditPos(def.pos);
        setRefBase(def.ref);
        setAltBase(def.alt);
        setAaChange(def.aa);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to query Ensembl.');
      if (DEFAULT_GENOMIC_SEQS[geneInput.toUpperCase()]) {
        const def = DEFAULT_GENOMIC_SEQS[geneInput.toUpperCase()];
        setGenomicSeq(def.seq);
        setEditPos(def.pos);
        setRefBase(def.ref);
        setAltBase(def.alt);
        setAaChange(def.aa);
      }
    } finally {
      setIsFetchingEnsembl(false);
    }
  };

  const handleSelectPreset = (gKey: string) => {
    const p = DEFAULT_GENOMIC_SEQS[gKey];
    if (!p) return;
    setGeneInput(gKey);
    setGenomicSeq(p.seq);
    setEditPos(p.pos);
    setRefBase(p.ref);
    setAltBase(p.alt);
    setAaChange(p.aa);
    setDiseaseInput(p.disease);
    setMode(gKey === 'MYD88' ? 'KNOCKOUT' : 'SNP_KNOCKIN');
    setComputedTarget(null);
    setErrorMessage(null);
  };

  const handleRunDesign = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const req: StudioDesignRequest = {
        gene: geneInput.trim().toUpperCase(),
        diseaseName: diseaseInput.trim(),
        mode,
        sequence: genomicSeq.trim(),
        editPosition: Number(editPos),
        refBase: refBase.trim().toUpperCase(),
        altBase: altBase.trim().toUpperCase(),
        aminoAcidChange: aaChange.trim(),
        chromosome: ensemblMeta?.chromosome || 'chr19',
        assembly: 'GRCh38'
      };

      const target = runStudioInSilicoDesign(req);
      setComputedTarget(target);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Design engine error.');
    }
  };

  const handleApplyToWorkbench = () => {
    if (!computedTarget) return;

    const updatedProject: AssuredProject = {
      ...project,
      id: `studio-${computedTarget.gene.toLowerCase()}-${Date.now()}`,
      title: `${computedTarget.gene} ${mode === 'KNOCKOUT' ? 'Knockout' : 'SNP Knock-In'}: Assured Studio Production Design`,
      createdAt: new Date().toISOString().split('T')[0],
      currentStage: 1,
      target: computedTarget,
      bench: { ...DEFAULT_BENCH },
      clones: [],
      provenance: [
        'Assured Studio In-Silico Design Engine: Dual SpCas9 guides, 36/91 asymmetric ssODN, CFD blocking mutations, thermodynamic PCR screening primers.'
      ],
      verification: undefined
    };

    onApplyDesign(updatedProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Assured Studio In-Silico CRISPR Designer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-950 text-purple-300 border border-purple-800">
                  Production Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                STAR Protocols validated SpCas9 dual-guide search, CFD blocking mutations, and asymmetric donor synthesis.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
              Quick Loci:
            </span>
            {Object.keys(DEFAULT_GENOMIC_SEQS).map(gKey => (
              <button
                key={gKey}
                type="button"
                onClick={() => handleSelectPreset(gKey)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                  geneInput === gKey
                    ? 'bg-purple-900/60 text-purple-200 border-purple-500 shadow-sm shadow-purple-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {gKey}
              </button>
            ))}
          </div>

          <form onSubmit={handleRunDesign} className="space-y-5">
            
            {/* Gene & Ensembl Search */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Gene Symbol
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={geneInput}
                    onChange={(e) => setGeneInput(e.target.value.toUpperCase())}
                    placeholder="e.g. APOE, MYD88, TP53"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleFetchEnsembl}
                    disabled={isFetchingEnsembl}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors whitespace-nowrap border border-slate-700"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isFetchingEnsembl ? 'Querying...' : 'Ensembl'}</span>
                  </button>
                </div>
              </div>

              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Editing Strategy
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('SNP_KNOCKIN')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      mode === 'SNP_KNOCKIN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🧬 Knock-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('KNOCKOUT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      mode === 'KNOCKOUT'
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    ✂️ Knockout
                  </button>
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Disease / Phenotype
                </label>
                <input
                  type="text"
                  value={diseaseInput}
                  onChange={(e) => setDiseaseInput(e.target.value)}
                  placeholder="Phenotype description"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Sequence & Mutation Coordinates */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Genomic Target Sequence (5&apos; to 3&apos;)
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {genomicSeq.length} bp window
                </span>
              </div>
              <textarea
                value={genomicSeq}
                onChange={(e) => setGenomicSeq(e.target.value.toUpperCase().replace(/[^ACGTN]/g, ''))}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none tracking-wider resize-none"
                placeholder="Paste human genomic target sequence window..."
                required
              />
            </div>

            {/* SNP Edit Parameters */}
            {mode === 'SNP_KNOCKIN' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Edit Index (0-based)</label>
                  <input
                    type="number"
                    value={editPos}
                    onChange={(e) => setEditPos(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Wild-Type Base</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={refBase}
                    onChange={(e) => setRefBase(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Intended Edit Base</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={altBase}
                    onChange={(e) => setAltBase(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-rose-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Protein Change</label>
                  <input
                    type="text"
                    value={aaChange}
                    onChange={(e) => setAaChange(e.target.value)}
                    placeholder="e.g. p.Arg176Cys"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Run Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Run In-Silico CRISPR Engine</span>
              </button>
            </div>
          </form>

          {/* Design Output Preview */}
          {computedTarget && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-xs text-white">
                    Production Design Calculated ({computedTarget.gene})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-purple-400">
                  {computedTarget.guides.length} SpCas9 Guides Selected
                </span>
              </div>

              {/* Guides */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Selected SpCas9 Guide RNAs (Dual-Guide Pool)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {computedTarget.guides.map((g, idx) => (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">Guide {idx + 1} ({g.strand} strand)</span>
                        <span className="font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded text-[10px]">
                          PAM: {g.pam}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-300 break-all select-all">
                        {g.sequence}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Cut distance: {g.cutDistanceToEdit} bp</span>
                        <span className="text-emerald-400 font-bold">CFD Score: {g.efficiencyScore}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asymmetric Donor */}
              {computedTarget.donor && computedTarget.donor.sequence && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      Asymmetric ssODN Template ({computedTarget.donor.totalLength} nt)
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      36 nt distal / 91 nt proximal
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-300 break-all select-all border border-slate-800">
                    {computedTarget.donor.sequence}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="font-bold text-slate-300">Blocking logic:</span> {computedTarget.donor.blockingChanges}
                  </div>
                </div>
              )}

              {/* Screening Primers */}
              {computedTarget.primers && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Forward Primer</div>
                    <div className="font-mono text-[11px] text-slate-300">{computedTarget.primers.forwardPrimer.sequence}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tm: {computedTarget.primers.forwardPrimer.tm}°C</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Reverse Primer</div>
                    <div className="font-mono text-[11px] text-slate-300">{computedTarget.primers.reversePrimer.sequence}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tm: {computedTarget.primers.reversePrimer.tm}°C • Amplicon: {computedTarget.primers.ampliconSizeBp} bp</div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Ready to load this in-silico CRISPR design into the Workbench?
                </span>
                <button
                  type="button"
                  onClick={handleApplyToWorkbench}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Design to Workbench</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
