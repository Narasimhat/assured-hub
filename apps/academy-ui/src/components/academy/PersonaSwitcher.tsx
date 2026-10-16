import React, { useState } from 'react';
import { 
  GraduationCap, 
  Microscope, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Dna,
  FlaskConical,
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { LEARNER_PERSONAS } from '../../data/personas';
import { LearnerPersonaId } from '../../types';
import { PatientJourneyTimeline } from '../simulator/PatientJourneyTimeline';
import { Sorcs1DesignSandbox } from '../simulator/Sorcs1DesignSandbox';
import { WetLabFailureSimulator } from '../simulator/WetLabFailureSimulator';
import { DonorIccPowerSimulator } from '../simulator/DonorIccPowerSimulator';
import { IsoCellYieldCalculator } from '../simulator/IsoCellYieldCalculator';
import { OffTargetDecisionMatrix } from '../simulator/OffTargetDecisionMatrix';

interface PersonaSwitcherProps {
  activePersonaId: LearnerPersonaId;
  onSelectPersona: (personaId: LearnerPersonaId) => void;
}

export const PersonaSwitcher: React.FC<PersonaSwitcherProps> = ({
  activePersonaId,
  onSelectPersona,
}) => {
  const [showSimulator, setShowSimulator] = useState<boolean>(true);
  const [tier1SubView, setTier1SubView] = useState<'sandbox' | 'journey'>('sandbox');
  const [tier2SubView, setTier2SubView] = useState<'state_machine' | 'icc_power'>('state_machine');
  const [tier3SubView, setTier3SubView] = useState<'isocell' | 'off_target'>('isocell');

  const activePersona = LEARNER_PERSONAS.find(p => p.id === activePersonaId) || LEARNER_PERSONAS[0];

  const getPersonaIcon = (id: LearnerPersonaId) => {
    switch (id) {
      case 'students':
        return <GraduationCap className="w-6 h-6 text-cyan-300" />;
      case 'research_labs':
        return <Microscope className="w-6 h-6 text-amber-300" />;
      case 'core_facilities':
        return <Layers className="w-6 h-6 text-blue-300" />;
      default:
        return <GraduationCap className="w-6 h-6 text-cyan-300" />;
    }
  };

  const renderSimulator = () => {
    switch (activePersona.id) {
      case 'students':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setTier1SubView('sandbox')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier1SubView === 'sandbox'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                SorCS1 RefSeq Architecture & Cut Distance
              </button>
              <button
                type="button"
                onClick={() => setTier1SubView('journey')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier1SubView === 'journey'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sendai Reprogramming & Patient Journey
              </button>
            </div>
            {tier1SubView === 'sandbox' ? <Sorcs1DesignSandbox /> : <PatientJourneyTimeline />}
          </div>
        );

      case 'research_labs':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setTier2SubView('state_machine')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier2SubView === 'state_machine'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                9-Step Virtual Wet-Lab State Machine
              </button>
              <button
                type="button"
                onClick={() => setTier2SubView('icc_power')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier2SubView === 'icc_power'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                51-Donor ICC Power & CRISPR-MiX Rescuer
              </button>
            </div>
            {tier2SubView === 'state_machine' ? <WetLabFailureSimulator /> : <DonorIccPowerSimulator />}
          </div>
        );

      case 'core_facilities':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setTier3SubView('isocell')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier3SubView === 'isocell'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IsoCell Microfluidics & 50-Vial Seedbank
              </button>
              <button
                type="button"
                onClick={() => setTier3SubView('off_target')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tier3SubView === 'off_target'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Orthogonal Off-Target Cleavage Matrix
              </button>
            </div>
            {tier3SubView === 'isocell' ? <IsoCellYieldCalculator /> : <OffTargetDecisionMatrix />}
          </div>
        );

      default:
        return <WetLabFailureSimulator />;
    }
  };

  return (
    <section aria-labelledby="personas-heading" className="mt-14 scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
            Three Focused Learning Tiers
          </span>
          <h2 id="personas-heading" className="mt-1 text-3xl font-bold text-white">
            Targeted Domain Curricula & Simulators
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Specialized curricula and interactive bioinformatic engines structured for Students, Research Labs, and Core Facilities.
        </p>
      </div>

      {/* Three Focused Persona Selector Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {LEARNER_PERSONAS.map(persona => {
          const isSelected = persona.id === activePersonaId;
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => {
                onSelectPersona(persona.id);
                setShowSimulator(true);
              }}
              className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/30 ring-1 ring-emerald-400 shadow-xl shadow-emerald-950/40'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tier {persona.tier}
                  </span>
                  {getPersonaIcon(persona.id)}
                </div>
                <h3 className="mt-3 text-lg font-bold text-white leading-snug">
                  {persona.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                  {persona.subtitle}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-300">
                  {persona.badge}
                </span>
                <span className="text-[11px] text-slate-400">Select Track →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Persona Overview Banner */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Tier {activePersona.tier}
              </span>
              <span className="text-xs text-slate-400">Audience: {activePersona.targetAudience}</span>
            </div>
            <h3 className="mt-2 text-2xl font-bold text-white">{activePersona.title}</h3>
            <p className="mt-1 text-sm text-slate-300 font-medium">{activePersona.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowSimulator(s => !s)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {showSimulator ? (
              <>
                Hide Interactive Sandbox <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Open Interactive Sandbox <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">{activePersona.coreObjective}</p>

        {/* Key Competencies Chips */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300">Key Competencies in this Track:</span>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {activePersona.keyCompetencies.map((comp, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{comp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Interactive Simulator Section */}
      {showSimulator && (
        <div className="mt-6">
          {renderSimulator()}
        </div>
      )}
    </section>
  );
};
