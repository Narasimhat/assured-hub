import React, { useState } from 'react';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList } from '../common/ProvenanceBadge';
import { WetLabSimulator } from './sections/WetLabSimulator';
import { PowerAndCrisprMix } from './sections/PowerAndCrisprMix';
import { OffTargetMatrix } from './sections/OffTargetMatrix';

/**
 * Tier 2 - research labs: PhD students, postdocs and PIs.
 *
 * One tier, because in a research lab these are not separate people's problems. The PhD student who
 * runs the plate is usually the one who will defend the design in a thesis committee, and the PI who
 * designs the study is the one who gets asked for off-target evidence in review.
 *
 * Three sections, in the order the questions arrive: execute the plate, design the comparison,
 * evidence the specificity. Tabs rather than one long page, because the three are consulted at
 * different times rather than read in sequence.
 */

type SectionId = 'bench' | 'design' | 'specificity';

const SECTIONS: Array<{ id: SectionId; label: string; question: string }> = [
  { id: 'bench', label: 'Run the plate', question: 'Which of my choices at the bench cost me clones?' },
  { id: 'design', label: 'Design the comparison', question: 'Is this study able to attribute the phenotype to the variant?' },
  { id: 'specificity', label: 'Evidence the specificity', question: 'What off-target evidence will I be asked for, and which assay gives it?' },
];

export const TierResearchLab: React.FC = () => {
  const [active, setActive] = useState<SectionId>('bench');

  return (
    <div className="space-y-12">
      <PersonaHeader personaId="lab" />

      <nav aria-label="Section" className="flex flex-wrap gap-3">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-pressed={active === section.id}
            onClick={() => setActive(section.id)}
            className={`flex-1 min-w-[240px] rounded-2xl border p-5 text-left transition-colors focus-visible:outline focus-visible:outline-cyan-400 ${
              active === section.id ? 'border-violet-700 bg-violet-950/30' : 'border-slate-800 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <span className={`block text-sm font-semibold ${active === section.id ? 'text-violet-200' : 'text-slate-200'}`}>{section.label}</span>
            <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">{section.question}</span>
          </button>
        ))}
      </nav>

      <div>
        {active === 'bench' && <WetLabSimulator />}
        {active === 'design' && <PowerAndCrisprMix />}
        {active === 'specificity' && <OffTargetMatrix />}
      </div>

      <SourceList sourceIds={['ASSURED_2023', 'CRISPR_MIX_2026', 'FDA_2024_GENOME_EDITING', 'ICH_Q2R2', 'PLATFORM_SPEC', 'NOT_SOURCED']} />
    </div>
  );
};
