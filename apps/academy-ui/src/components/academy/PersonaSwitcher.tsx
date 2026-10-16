import React, { useState } from 'react';
import { 
  HeartHandshake, 
  GraduationCap, 
  FlaskConical, 
  Microscope, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp
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

  const activePersona = LEARNER_PERSONAS.find(p => p.id === activePersonaId) || LEARNER_PERSONAS[0];

  const getPersonaIcon = (id: LearnerPersonaId) => {
    switch (id) {
      case 'layperson':
        return <HeartHandshake className="w-5 h-5 text-emerald-300" />;
      case 'student':
        return <GraduationCap className="w-5 h-5 text-cyan-300" />;
      case 'technician':
        return <FlaskConical className="w-5 h-5 text-amber-300" />;
      case 'scientist':
        return <Microscope className="w-5 h-5 text-purple-300" />;
      case 'core_facility':
        return <Layers className="w-5 h-5 text-blue-300" />;
      case 'cgt_industry':
        return <ShieldCheck className="w-5 h-5 text-rose-300" />;
      default:
        return <GraduationCap className="w-5 h-5 text-emerald-300" />;
    }
  };

  const renderSimulator = () => {
    switch (activePersona.id) {
      case 'layperson':
        return <PatientJourneyTimeline />;
      case 'student':
        return <Sorcs1DesignSandbox />;
      case 'technician':
        return <WetLabFailureSimulator />;
      case 'scientist':
        return <DonorIccPowerSimulator />;
      case 'core_facility':
        return <IsoCellYieldCalculator />;
      case 'cgt_industry':
        return <OffTargetDecisionMatrix />;
      default:
        return <WetLabFailureSimulator />;
    }
  };

  return (
    <section aria-labelledby="personas-heading" className="mt-14 scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-400">
            Role-Based Pedagogical Architecture
          </span>
          <h2 id="personas-heading" className="mt-1 text-3xl font-bold text-white">
            Six Learner Personas & Domain Simulators
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-md">
          Tailored learning tracks and interactive wet-lab sandboxes engineered for every stakeholder in stem cell engineering.
        </p>
      </div>

      {/* Six-Tier Persona Selector Buttons */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-950/40 ring-1 ring-emerald-400 shadow-lg shadow-emerald-950/50'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tier {persona.tier}
                  </span>
                  {getPersonaIcon(persona.id)}
                </div>
                <h3 className="mt-2 text-xs font-bold text-white leading-tight line-clamp-2">
                  {persona.title}
                </h3>
              </div>
              <span className="mt-3 inline-block text-[10px] text-slate-400 truncate">
                {persona.badge}
              </span>
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
          <span className="text-xs font-semibold text-slate-300">Core Curriculum Competencies:</span>
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

      {/* Dedicated Interactive Simulator Card */}
      {showSimulator && (
        <div className="mt-6">
          {renderSimulator()}
        </div>
      )}
    </section>
  );
};
