import React from 'react';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList } from '../common/ProvenanceBadge';
import { PatientJourney } from './sections/PatientJourney';
import { ExonSandbox } from './sections/ExonSandbox';

/**
 * Tier 1 - school and college students.
 *
 * Two halves, in order. First the plain-language account of what a stem cell model is and why anyone
 * makes one, which is where a school pupil has to start and which a first-year undergraduate still
 * benefits from. Then the design sandbox, which is the first thing that needs a gene in front of it.
 *
 * A reader who only wants the first half can stop at the divider; nothing in the second half is
 * needed to understand the first.
 */

export const TierStudents: React.FC = () => (
  <div className="space-y-16">
    <PersonaHeader personaId="student" />

    <section aria-labelledby="part-one">
      <h2 id="part-one" className="sr-only">
        Part one: what a stem cell model is
      </h2>
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Part one &middot; No sequence yet</p>
      <h3 className="mt-2 text-3xl font-semibold text-white">What is being made, and why</h3>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">
        Before any gene appears, the point of the whole exercise: turning a patient&rsquo;s blood into cells that carry
        their genetics, changing one letter, and comparing the two.
      </p>
      <div className="mt-8">
        <PatientJourney />
      </div>
    </section>

    <div className="border-t border-slate-800" />

    <section aria-labelledby="part-two">
      <h2 id="part-two" className="sr-only">
        Part two: choosing where to cut
      </h2>
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Part two &middot; Now with a gene</p>
      <h3 className="mt-2 text-3xl font-semibold text-white">Choosing where to cut</h3>
      <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">
        A gene is not one uninterrupted stretch of coding sequence, and not every part of it is present in every
        transcript. Where you cut decides whether the edit does what you meant.
      </p>
      <div className="mt-8">
        <ExonSandbox />
      </div>
    </section>

    <SourceList sourceIds={['ASSURED_2023', 'ISSCR_STANDARDS']} heading="Where this comes from" />
  </div>
);
