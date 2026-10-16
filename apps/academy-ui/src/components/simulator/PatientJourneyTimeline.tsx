import React, { useState } from 'react';
import { Heart, Activity, Dna, Microscope, Sparkles, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react';

interface JourneyStage {
  id: string;
  stageNumber: number;
  title: string;
  timeframe: string;
  summary: string;
  laypersonDetails: string;
  scientificConcept: string;
  clinicalSignificance: string;
}

const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: 'stage-1-draw',
    stageNumber: 1,
    title: 'Routine Blood Draw (PBMC Isolation)',
    timeframe: 'Day 0',
    summary: 'A routine 5-10 mL blood sample is collected from the patient, avoiding invasive skin biopsies.',
    laypersonDetails:
      'Unlike older methods that required surgically removing a piece of skin, we simply take a standard blood draw. From this, we isolate peripheral blood mononuclear cells (PBMCs), the immune cells that circulate in your bloodstream.',
    scientificConcept: 'Ficoll gradient separation yields CD34+ and CD4+ circulating mononuclear cells.',
    clinicalSignificance: 'Minimally invasive, safe for pediatric rare disease patients, and readily accessible.',
  },
  {
    id: 'stage-2-sendai',
    stageNumber: 2,
    title: 'Non-Integrating Sendai RNA Reprogramming',
    timeframe: 'Days 1 - 25',
    summary: 'Blood cells are gently guided back to an embryonic-like stem cell state without altering patient DNA.',
    laypersonDetails:
      'We deliver four natural master signals using Sendai virus. Because Sendai is a harmless RNA virus that lives only in the cell fluid and never enters your chromosomes, it completely washes out as the cells divide. No foreign viral DNA is left in your genome.',
    scientificConcept: 'Transient cytoplasmic delivery of OCT4, SOX2, KLF4, and c-MYC without host genomic integration.',
    clinicalSignificance: 'Eliminates the risk of insertional mutagenesis or oncogene activation seen with older lentiviruses.',
  },
  {
    id: 'stage-3-isogenic',
    stageNumber: 3,
    title: 'Scarless CRISPR-Cas9 Gene Correction',
    timeframe: 'Days 26 - 45',
    summary: 'The exact disease-causing spelling mistake is corrected in the patient stem cells.',
    laypersonDetails:
      'Using precision molecular scissors (CRISPR-Cas9) together with a short DNA repair template, the single faulty genetic letter is corrected back to the healthy sequence. No antibiotic resistance tags or foreign genes are left behind.',
    scientificConcept: 'Homology-directed repair (HDR) using synthetic ribonucleoprotein (RNP) and single-stranded donor DNA.',
    clinicalSignificance: 'Generates perfect "isogenic" sister cells that share 99.999% identical DNA, isolating the disease cause.',
  },
  {
    id: 'stage-4-differentiation',
    stageNumber: 4,
    title: 'Specialized Tissue Differentiation',
    timeframe: 'Days 46 - 75',
    summary: 'The corrected stem cells are grown into the specific tissues affected by the disease (e.g. heart or brain cells).',
    laypersonDetails:
      'Stem cells have the remarkable ability to turn into any cell in the human body. By providing natural biochemical cues, we instruct the corrected cells to grow into beating heart muscle cells, motor neurons, or liver cells.',
    scientificConcept: 'Monolayer guided lineage differentiation mimicking embryonic organogenesis.',
    clinicalSignificance: 'Allows scientists to observe whether the gene correction restored normal cellular function.',
  },
  {
    id: 'stage-5-translation',
    stageNumber: 5,
    title: 'Therapeutic Discovery & Autologous Potential',
    timeframe: 'Days 76+',
    summary: 'Testing drug effectiveness in the dish and paving the way toward future regenerative cell therapies.',
    laypersonDetails:
      'Because these cells carry your exact genetic background, doctors can test hundreds of medications on your own tissue in the lab before prescribing them. In the future, these cells could also serve as transplants to repair damaged organs without immune rejection.',
    scientificConcept: 'Patient-derived functional drug screens and autologous cell and gene therapy (CGT) manufacturing.',
    clinicalSignificance: 'Transforms rare disease clinical development by personalizing therapy without patient risk.',
  },
];

export const PatientJourneyTimeline: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('stage-1-draw');

  const activeStage = JOURNEY_STAGES.find(s => s.id === activeStageId) || JOURNEY_STAGES[0];

  return (
    <div className="rounded-2xl border border-emerald-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            Tier 1 · Patient Advocates & Families
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">The Stem Cell & Gene Editing Journey</h3>
          <p className="mt-1 text-sm text-slate-400">
            Follow the journey from a routine patient blood draw through non-integrating Sendai reprogramming to scarless isogenic disease modeling.
          </p>
        </div>
      </div>

      {/* Horizontal Timeline Tracker */}
      <div className="mt-6 flex items-center justify-between gap-2 overflow-x-auto pb-4 scrollbar-thin">
        {JOURNEY_STAGES.map((stage, idx) => {
          const isSelected = stage.id === activeStageId;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStageId(stage.id)}
              className={`shrink-0 flex flex-col items-center p-3 rounded-xl border text-center transition-all min-w-[140px] ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {stage.stageNumber}
              </span>
              <span className="text-xs font-bold text-white line-clamp-1">{stage.title}</span>
              <span className="text-[10px] text-emerald-400/80 mt-1 font-mono">{stage.timeframe}</span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detailed Card */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Stage {activeStage.stageNumber} · {activeStage.timeframe}
            </span>
            <h4 className="text-lg font-bold text-white mt-0.5">{activeStage.title}</h4>
          </div>
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Patient Centric
          </span>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-medium">{activeStage.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="font-bold text-emerald-300">In Everyday Language:</span>
            <p className="mt-2 text-slate-300 leading-relaxed">{activeStage.laypersonDetails}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="font-bold text-cyan-300">Under the Microscope:</span>
            <p className="mt-2 text-slate-300 leading-relaxed">{activeStage.scientificConcept}</p>
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Clinical Impact: </span>
              {activeStage.clinicalSignificance}
            </div>
          </div>
        </div>

        {/* Ethical Standards Callout */}
        <div className="mt-4 p-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-xs text-slate-300 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-emerald-200">Ethical and Regulatory Standards: </strong>
            All ASSURED-Hub workflows focus exclusively on somatic patient cells and in vitro disease modeling. No germline (heritable) genetic modifications are supported or practiced. Patient autonomy, informed consent, and open data sharing form the bedrock of ethical genome engineering.
          </div>
        </div>
      </div>

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Interested in seeing how scientists plan these experiments on the bench?
        </p>
        <a
          href="../studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors focus-visible:outline focus-visible:outline-emerald-400"
        >
          Explore ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
