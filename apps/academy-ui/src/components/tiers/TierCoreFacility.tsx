import React from 'react';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList } from '../common/ProvenanceBadge';
import { CoreOperations } from './sections/CoreOperations';

/**
 * Tier 3 - pluripotent stem cell core facilities.
 *
 * The questions a core gets asked are about turnaround, yield and release criteria, so the page is
 * the plate and seedbank planner followed by the ISSCR five tenets as a working checklist.
 */

export const TierCoreFacility: React.FC = () => (
  <div className="space-y-12">
    <PersonaHeader personaId="core" />
    <CoreOperations />
    <SourceList sourceIds={['ISSCR_STANDARDS', 'ASSURED_2023', 'PLATFORM_SPEC']} />
  </div>
);
