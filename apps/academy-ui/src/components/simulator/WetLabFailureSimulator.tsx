import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, RotateCcw, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';

interface StepDecision {
  id: string;
  stepNumber: number;
  title: string;
  category: string;
  question: string;
  benchTip: string;
  options: {
    id: string;
    label: string;
    description: string;
    isOptimal: boolean;
    survivalImpact: number;
    editingImpact: number;
    consequence: string;
  }[];
}

const WET_LAB_STEPS: StepDecision[] = [
  {
    id: 'step-1-matrix',
    stepNumber: 1,
    title: 'Extracellular Matrix Coating & Cold-Chain',
    category: 'Culture Preparation',
    question: 'How do you handle Geltrex dilution and vessel coating prior to plating?',
    benchTip: 'Pre-chill all pipettes and tips at -20°C for ≥20 minutes before touching basement membrane matrix.',
    options: [
      {
        id: 'opt-1-cold',
        label: 'Strict Cold-Chain (-20°C Pre-Chilled Tips, 1:12 Dilution)',
        description: 'Pre-chill pipettes and tips at -20°C for 20 min. Dilute Geltrex 1:12 in ice-cold KO DMEM/F-12 and coat vessels immediately, incubating 1 h at 37°C.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Optimal uniform monolayer coating. Stem cells adhere uniformly with intact E-cadherin junctions and zero premature matrix clumping.',
      },
      {
        id: 'opt-1-warm',
        label: 'Room Temperature Pipetting & Warm Media',
        description: 'Pipette Geltrex using standard room-temperature tips and diluted in room-temperature basal medium.',
        isOptimal: false,
        survivalImpact: -35,
        editingImpact: -20,
        consequence: 'Premature Geltrex polymerization creates uneven macroscopic protein clumps. Attached colonies undergo spontaneous differentiation and lose pluripotency.',
      },
    ],
  },
  {
    id: 'step-2-hypoxia',
    stepNumber: 2,
    title: 'Oxygen Tension & Incubation Microenvironment',
    category: 'Incubation Physics',
    question: 'Which incubator atmospheric condition is configured for hiPSC culture and recovery?',
    benchTip: 'Physiological normoxia for early embryonic cells is 5% O2, not ambient room air.',
    options: [
      {
        id: 'opt-2-hypoxia',
        label: 'Physiological Hypoxia (37°C, 5% CO2, 5% O2)',
        description: 'Maintain cells in a tri-gas incubator with 5% oxygen tension to mimic the in vivo stem cell niche.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Low reactive oxygen species (ROS) production, high self-renewal kinetics, and preservation of genomic stability during DNA repair.',
      },
      {
        id: 'opt-2-normoxia',
        label: 'Standard Atmospheric Air (37°C, 5% CO2, 21% O2)',
        description: 'Culture in a standard cell incubator with ambient 21% oxygen.',
        isOptimal: false,
        survivalImpact: -25,
        editingImpact: -15,
        consequence: 'Elevated ROS induces oxidative double-strand breaks, accelerates karyotypic drift, and activates p53 checkpoints prematurely.',
      },
    ],
  },
  {
    id: 'step-3-confluency',
    stepNumber: 3,
    title: 'Pre-Delivery Passage & Cell Cycle State',
    category: 'Cell Cycle Control',
    question: 'At what confluency and schedule are hiPSCs harvested for nucleofection?',
    benchTip: 'Re-plate on Day -1 so cells enter active S-phase when HDR machinery is most abundant.',
    options: [
      {
        id: 'opt-3-mid',
        label: 'Re-plated Day -1, Harvested at ~50% Confluence',
        description: 'Passage the previous day and harvest at ~50% confluence (~1×10⁶ cells/well) where cells are actively cycling in S/G2 phase.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Cells are in active S-phase when Homology-Directed Repair (HDR) enzymes (Rad51/BRCA2) peak, maximizing precise integration.',
      },
      {
        id: 'opt-3-high',
        label: 'Harvested from Overgrown 95% Confluent Well',
        description: 'Allow cells to reach 95-100% confluence before harvesting to maximize total cell count.',
        isOptimal: false,
        survivalImpact: -20,
        editingImpact: -40,
        consequence: 'Contact inhibition arrests cells in G1/G0 phase where HDR is silenced and error-prone NHEJ dominates, dropping knock-in efficiency.',
      },
    ],
  },
  {
    id: 'step-4-dissociation',
    stepNumber: 4,
    title: 'Single-Cell Dissociation & Anoikis Protection',
    category: 'Cell Health',
    question: 'Which enzymatic dissociation and apoptosis protection protocol is used?',
    benchTip: 'hiPSCs undergo rapid anoikis apoptosis upon single-cell dissociation without Rho-kinase inhibition.',
    options: [
      {
        id: 'opt-4-tryple',
        label: 'Gentle TrypLE with ROCK Inhibitor Supplementation',
        description: 'Incubate with TrypLE for 3-5 min and quench in medium containing ROCK inhibitor to block Rho-ROCK-mediated caspase-3 activation.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Intact single-cell membrane integrity with suppressed anoikis cascade, providing high viability for electroporation.',
      },
      {
        id: 'opt-4-rough',
        label: 'Extended Trypsinization without ROCK Inhibitor',
        description: 'Incubate in warm Trypsin-EDTA for 10 min without protective kinase inhibitors.',
        isOptimal: false,
        survivalImpact: -45,
        editingImpact: -20,
        consequence: 'Severe cell lysis and blebbing. The detached single cells trigger rapid caspase-3 dependent anoikis, reducing viable cells by over 70%.',
      },
    ],
  },
  {
    id: 'step-5-rnp',
    stepNumber: 5,
    title: 'RNP Assembly & Cas9 Stoichiometry',
    category: 'RNP Formulation',
    question: 'How is the CRISPR-Cas9 ribonucleoprotein complex assembled?',
    benchTip: 'HiFi Cas9 V3 requires a 3:1 sgRNA:Cas9 molar ratio and single-use aliquoting to prevent freeze-thaw denaturation.',
    options: [
      {
        id: 'opt-5-hifi',
        label: 'Alt-R HiFi Cas9 V3 + sgRNA (3:1 Molar Ratio, 10 min RT)',
        description: 'Mix synthetic sgRNA with Alt-R HiFi Cas9 V3 at a 3:1 molar ratio (e.g. 60 pmol sgRNA to 20 pmol Cas9) in R buffer for 10 min at RT from single-use aliquots.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: '100% active RNP complex with high specificity, negligible off-target cleavage, and zero protein freeze-thaw degradation.',
      },
      {
        id: 'opt-5-freezethaw',
        label: 'Wild-Type Cas9 Subjected to Multiple Freeze-Thaws (1:1 Ratio)',
        description: 'Repeatedly thawed master tube of wild-type SpCas9 complexed at 1:1 molar ratio.',
        isOptimal: false,
        survivalImpact: -15,
        editingImpact: -50,
        consequence: 'Denatured Cas9 protein exhibits poor cutting efficiency, while wild-type nuclease drives off-target double-strand breaks at homologous genomic sites.',
      },
    ],
  },
  {
    id: 'step-6-ssodn',
    stepNumber: 6,
    title: 'Donor Template Formulation & Addition',
    category: 'Template Design',
    question: 'When and how is the single-stranded donor template (ssODN) added to the reaction?',
    benchTip: 'Add chemically modified ssODN immediately prior to pulse to avoid non-specific binding or premature nuclease degradation.',
    options: [
      {
        id: 'opt-6-fresh',
        label: 'Chemically Modified ssODN (120 pmol) Added Just Before Pulse',
        description: 'Add 120 pmol of chemically end-modified asymmetric ssODN to the pre-assembled RNP in R buffer immediately before drawing into the tip.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'High template stability, resistance to intracellular exonucleases, and high HDR incorporation at the cleaved genomic locus.',
      },
      {
        id: 'opt-6-unprotected',
        label: 'Unmodified ssODN Pre-Mixed 1 Hour in Advance',
        description: 'Incubate plain unmodified ssODN together with RNP for over 1 hour at room temperature.',
        isOptimal: false,
        survivalImpact: -10,
        editingImpact: -30,
        consequence: 'Cellular and residual nucleases chew back the unmodified homology arms, reducing HDR integration efficiency.',
      },
    ],
  },
  {
    id: 'step-7-neon',
    stepNumber: 7,
    title: 'Electroporation Physics (Neon Pulse Parameters)',
    category: 'Delivery Physics',
    question: 'Which pulse parameters are applied to the 0.25×10⁶ cells in the 10 µL Neon tip?',
    benchTip: 'The verified protocol setting is 1200 V, 20-30 ms, 1 pulse. Excessive pulses cause irreversible electroporation.',
    options: [
      {
        id: 'opt-7-standard',
        label: 'Standard Setting: 1,200 V, 20-30 ms, 1 Pulse',
        description: 'Deliver a single transient 1,200 V electrical pulse for 20-30 ms in 10 µL Neon R buffer.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Transient nanometer membrane pore formation allowing rapid RNP entry while maintaining >75% membrane resealing.',
      },
      {
        id: 'opt-7-highvoltage',
        label: 'Aggressive Setting: 1,600 V, 20 ms, 3 Pulses',
        description: 'Deliver three successive high-voltage pulses to maximize DNA entry.',
        isOptimal: false,
        survivalImpact: -60,
        editingImpact: -10,
        consequence: 'Irreversible electroporation and thermal dissipation rupture plasma membranes, causing catastrophic cell death (>85% lysis).',
      },
    ],
  },
  {
    id: 'step-8-recovery',
    stepNumber: 8,
    title: 'Post-Delivery Plating & Recovery Formulation',
    category: 'Post-Pulse Recovery',
    question: 'In which medium are electroporated cells recovered immediately after pulsing?',
    benchTip: 'Transitioning from Essential 8 (E8) to StemFlex or StemMACS supplemented with CloneR2 (1:10) is essential for single-cell survival.',
    options: [
      {
        id: 'opt-8-stemflex',
        label: 'StemFlex / StemMACS PSC-Brew XF + CloneR2 (1:10)',
        description: 'Transfer pulsed cells immediately into pre-equilibrated recovery-optimized medium supplemented with CloneR2.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Reaches the empirical 65% single-cell survival benchmark in microfluidic chambers, supporting colony formation.',
      },
      {
        id: 'opt-8-e8',
        label: 'Standard Essential 8 (E8) Medium without CloneR2',
        description: 'Plate directly in standard unsupplemented E8 maintenance media.',
        isOptimal: false,
        survivalImpact: -50,
        editingImpact: -10,
        consequence: 'Without CloneR2 survival signals, single hiPSCs undergo catastrophic cell death, with survival dropping below 15%.',
      },
    ],
  },
  {
    id: 'step-9-cloning',
    stepNumber: 9,
    title: 'Clonal Isolation & Seedbanking Strategy',
    category: 'Biobanking & QC',
    question: 'How are single cells cloned and preserved for downstream validation?',
    benchTip: 'IsoCell 256-chamber microfluidics provides automated single-cell separation; freeze candidate clones in 96-well Bambanker.',
    options: [
      {
        id: 'opt-9-isocell',
        label: 'IsoCell 256-Chamber Microfluidics + 96-Well Bambanker',
        description: 'Automated single-cell isolation under FC40 fluorocarbon yielding ~46 surviving clones, harvested into 96-well Bambanker freezing plates.',
        isOptimal: true,
        survivalImpact: 0,
        editingImpact: 0,
        consequence: 'Confirmed single-cell monoclonal origin with zero cross-contamination. 5-6 confirmed clones scale to 50-vial seedbanks.',
      },
      {
        id: 'opt-9-bulk',
        label: 'Manual Bulk Colony Picking from Crowded Dishes',
        description: 'Scrape colonies by hand from a crowded 6-well plate after 10 days of outgrowth.',
        isOptimal: false,
        survivalImpact: -15,
        editingImpact: -35,
        consequence: 'High incidence of mosaicism and polyclonal contamination. Clones harbor mixed genotypes and fail downstream validation.',
      },
    ],
  },
];

export const WetLabFailureSimulator: React.FC = () => {
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    WET_LAB_STEPS.forEach(step => {
      // Default to optimal for learning baseline
      initial[step.id] = step.options[0].id;
    });
    return initial;
  });

  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const handleSelectOption = (stepId: string, optionId: string) => {
    setSelections(prev => ({ ...prev, [stepId]: optionId }));
  };

  const handleReset = (optimal: boolean) => {
    const next: Record<string, string> = {};
    WET_LAB_STEPS.forEach(step => {
      next[step.id] = optimal ? step.options[0].id : step.options[1].id;
    });
    setSelections(next);
  };

  // Calculate survival score and editing efficiency
  let totalSurvival = 100;
  let totalEditing = 85; // baseline empirical MDC/BIH KO/KI score

  WET_LAB_STEPS.forEach(step => {
    const selectedOptId = selections[step.id];
    const opt = step.options.find(o => o.id === selectedOptId);
    if (opt) {
      totalSurvival += opt.survivalImpact;
      totalEditing += opt.editingImpact;
    }
  });

  totalSurvival = Math.max(5, Math.min(100, totalSurvival));
  totalEditing = Math.max(0, Math.min(100, totalEditing));

  const currentStep = WET_LAB_STEPS[activeStepIdx];
  const allOptimal = WET_LAB_STEPS.every(s => selections[s.id] === s.options[0].id);

  return (
    <div className="rounded-2xl border border-amber-900/60 bg-slate-900 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60">
            Tier 3 · Wet-Lab Protocol Simulator
          </span>
          <h3 className="mt-2 text-2xl font-bold text-white">9-Step Virtual Wet-Lab Decision State Machine</h3>
          <p className="mt-1 text-sm text-slate-400">
            Model how deviations in cold chain, oxygen tension, media transitions, and RNP stoichiometry trigger hiPSC experimental failure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleReset(true)}
            className="px-3 py-1.5 rounded-lg border border-emerald-700 bg-emerald-950/50 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 focus-visible:outline focus-visible:outline-emerald-400"
          >
            Apply Protocol Optimal
          </button>
          <button
            type="button"
            onClick={() => handleReset(false)}
            className="px-3 py-1.5 rounded-lg border border-rose-700 bg-rose-950/50 text-xs font-medium text-rose-300 hover:bg-rose-900/50 focus-visible:outline focus-visible:outline-rose-400"
          >
            Simulate Common Pitfalls
          </button>
        </div>
      </div>

      {/* Real-time Empirical Outcome Indicators */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-medium text-slate-400">Post-Delivery Single-Cell Survival</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${totalSurvival >= 60 ? 'text-emerald-400' : totalSurvival >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {totalSurvival}%
            </span>
            <span className="text-xs text-slate-500">Benchmark: 65% in IsoCell</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${totalSurvival >= 60 ? 'bg-emerald-500' : totalSurvival >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${totalSurvival}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-medium text-slate-400">Target Genomic Editing Score (KO/KI)</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${totalEditing >= 60 ? 'text-emerald-400' : totalEditing >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
              {totalEditing}%
            </span>
            <span className="text-xs text-slate-500">Mean: 79.5% KO / 57.5% KI</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${totalEditing >= 60 ? 'bg-emerald-500' : totalEditing >= 30 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${totalEditing}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-medium text-slate-400">Operational Run Health</p>
          <div className="mt-2 flex items-center gap-2">
            {allOptimal ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <span className="text-sm font-semibold text-emerald-300">Protocol Compliant</span>
              </>
            ) : totalSurvival < 30 ? (
              <>
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                <span className="text-sm font-semibold text-rose-400">Catastrophic Cell Loss</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-amber-300">Sub-Optimal Yield</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {allOptimal ? 'Ready for clonal expansion into 96-well Bambanker.' : 'Check decision deviations below to rescue viability.'}
          </p>
        </div>
      </div>

      {/* Step Selector Tabs */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {WET_LAB_STEPS.map((step, idx) => {
          const isSelected = activeStepIdx === idx;
          const opt = step.options.find(o => o.id === selections[step.id]);
          const isStepOptimal = opt?.isOptimal;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepIdx(idx)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                isSelected
                  ? 'border-amber-500 bg-amber-950/60 text-amber-200'
                  : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isStepOptimal ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
              }`}>
                {step.stepNumber}
              </span>
              <span>{step.category}</span>
            </button>
          );
        })}
      </div>

      {/* Active Step Interactive Decision Panel */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-amber-400">
              Step {currentStep.stepNumber} of 9 · {currentStep.category}
            </span>
            <h4 className="mt-1 text-xl font-bold text-white">{currentStep.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {activeStepIdx > 0 && (
              <button
                type="button"
                onClick={() => setActiveStepIdx(i => i - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              >
                Previous
              </button>
            )}
            {activeStepIdx < WET_LAB_STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveStepIdx(i => i + 1)}
                className="px-3 py-1.5 rounded-lg border border-amber-600 bg-amber-950/50 text-xs text-amber-300 hover:bg-amber-900/50"
              >
                Next Step
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-300 font-medium">{currentStep.question}</p>

        {/* Options Comparison */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {currentStep.options.map(option => {
            const isChosen = selections[currentStep.id] === option.id;

            return (
              <div
                key={option.id}
                onClick={() => handleSelectOption(currentStep.id, option.id)}
                className={`cursor-pointer rounded-xl border p-5 transition-all ${
                  isChosen
                    ? option.isOptimal
                      ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={currentStep.id}
                      checked={isChosen}
                      onChange={() => handleSelectOption(currentStep.id, option.id)}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-sm font-bold text-white">{option.label}</span>
                  </div>
                  {option.isOptimal ? (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Standard
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                      Pitfall
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-400">{option.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs leading-relaxed">
                  <span className="font-semibold text-slate-300">Biological Consequence: </span>
                  <span className={option.isOptimal ? 'text-emerald-300/90' : 'text-rose-300/90'}>
                    {option.consequence}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench Tip Box */}
        <div className="mt-5 p-4 rounded-xl border border-amber-900/40 bg-amber-950/20 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-semibold text-amber-300">Wet-Lab Tip: </span>
            <span className="text-slate-300">{currentStep.benchTip}</span>
          </div>
        </div>
      </div>

      {/* Action to Bench */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Ready to formulate these RNP and delivery parameters on the real bench?
        </p>
        <a
          href="/studio/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 transition-colors focus-visible:outline focus-visible:outline-amber-400"
        >
          Open ASSURED Bench <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
