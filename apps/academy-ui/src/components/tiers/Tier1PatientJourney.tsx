import React, { useState } from 'react';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList } from '../common/ProvenanceBadge';

/**
 * Tier 1 - laypersons and patient advocates.
 *
 * No numbers, no reagent names a reader cannot look up, and nothing that implies a treatment.
 * The job here is for someone to finish able to ask a researcher a good question.
 */

interface Step {
  id: string;
  label: string;
  weeks: string;
  plain: string;
  detail: string;
  reassurance?: string;
}

const JOURNEY: Step[] = [
  {
    id: 'consent',
    label: 'Consent and the sample',
    weeks: 'Day 0',
    plain: 'A routine blood draw, usually a few millilitres, the same as any clinic blood test.',
    detail:
      'The donor agrees in writing to what the cells may be used for, who may hold them, and whether they can be withdrawn later. A skin biopsy is the older route and is rarely used now when blood will do.',
    reassurance: 'Nothing is done to the donor beyond the blood draw. Everything that follows happens in a dish.',
  },
  {
    id: 'reprogram',
    label: 'Turning blood cells back into stem cells',
    weeks: 'Weeks 1-4',
    plain:
      'Certain white blood cells are given a short burst of four proteins that make a cell behave as it did very early in development. They stop being blood cells and become stem cells.',
    detail:
      'The instructions are delivered by a carrier that works in the cell body and never enters the chromosomes, so it washes out over the following weeks. That matters: older methods inserted themselves into the genome permanently, and the insertion itself could cause problems. These are "induced pluripotent stem cells", or iPSCs.',
    reassurance:
      'These are not embryonic stem cells. They are made from an adult donor’s own blood, and no embryo is involved at any point.',
  },
  {
    id: 'expand',
    label: 'Growing and checking the line',
    weeks: 'Weeks 4-10',
    plain:
      'The new stem cells are grown until there are enough to work with, then checked: are they really the donor’s cells, are they healthy, and can they still turn into any cell type?',
    detail:
      'The checks are not optional housekeeping. A line that has quietly picked up a chromosome change, or that has been swapped with another line, will produce results that look real and are not. Laboratories freeze verified early batches before anything else is done.',
  },
  {
    id: 'edit',
    label: 'Changing one letter',
    weeks: 'Weeks 10-14',
    plain:
      'A guide molecule finds one exact place in the three billion letters of the genome. A protein cuts there. The cell repairs the cut, and a short template supplied alongside tells it how.',
    detail:
      'Two things can be done. The change found in the patient can be corrected back to the common version, or that change can be introduced into healthy cells. Both are done; the second is often more informative, because it starts from a known-healthy background.',
    reassurance:
      'The cells being changed are in a dish, not in a person. Changes made here are never passed to children, because these are not eggs or sperm.',
  },
  {
    id: 'clone',
    label: 'Separating single cells',
    weeks: 'Weeks 14-18',
    plain:
      'Not every cell is changed, and they end up mixed. Individual cells are separated so that each one can grow into its own colony with a single, known genetic makeup.',
    detail:
      'Each colony is then sequenced to find out exactly what happened at the target. Most are discarded. A handful that carry precisely the intended change, and nothing else at that site, are kept and frozen.',
  },
  {
    id: 'compare',
    label: 'The comparison that makes it science',
    weeks: 'Months 5+',
    plain:
      'The edited cells and the unedited cells from the same donor are grown into the cell type the disease affects — heart muscle, neurons, liver — and compared.',
    detail:
      'Because both came from one person, everything else about them is identical. Any difference is down to the one change. Comparing cells from different people instead cannot do this: people differ from each other in thousands of ways, and the difference you are looking for gets lost among them. This pairing is called an isogenic comparison, and it is the whole point.',
    reassurance: 'This is where a result stops being "patients’ cells look different" and becomes "this change causes this effect".',
  },
];

const GLOSSARY: Array<{ term: string; plain: string }> = [
  { term: 'Pluripotent', plain: 'Able to become any cell type in the body. "Pluri" = many, "potent" = capable.' },
  { term: 'iPSC', plain: 'Induced pluripotent stem cell: an adult cell persuaded back into a stem-cell state.' },
  { term: 'Genome', plain: 'The full set of DNA instructions in a cell, about three billion letters.' },
  { term: 'Variant / mutation', plain: 'A difference in those letters compared with the common version. Most are harmless.' },
  { term: 'CRISPR', plain: 'A system for finding one exact place in the genome and cutting it, borrowed from bacteria.' },
  { term: 'Isogenic', plain: 'Two cell lines identical except for the one change being studied.' },
  { term: 'Somatic editing', plain: 'Changing cells in a dish or in a patient’s body. Not inherited.' },
  { term: 'Germline editing', plain: 'Changing eggs, sperm or embryos, so the change passes to children. Not permitted for clinical use.' },
  { term: 'Differentiation', plain: 'Turning a stem cell into a specific cell type, such as a beating heart cell.' },
];

const ETHICS = [
  {
    heading: 'Research in a dish is not a treatment',
    body:
      'Work on this platform makes models of disease. A model explains what a variant does. Turning that into a therapy is a separate, much longer road with its own regulators and clinical trials.',
  },
  {
    heading: 'Somatic and germline are not the same conversation',
    body:
      'Editing cells in a dish, or cells returned to one patient, affects that person only. Editing an embryo would affect every future descendant. International guidance treats the second as off the table for clinical use, and the distinction is not a technicality.',
  },
  {
    heading: 'Consent covers more than the blood draw',
    body:
      'A donated sample may become a cell line that outlives the study, is shared with other laboratories, and is used for work nobody had thought of yet. Good consent says so plainly and says what can still be withdrawn.',
  },
  {
    heading: 'The genome is identifying',
    body:
      'A cell line carries the donor’s complete genetic information. It is handled as personal data, not as an anonymous reagent.',
  },
];

export const Tier1PatientJourney: React.FC = () => {
  const [openStep, setOpenStep] = useState<string | null>(JOURNEY[0].id);

  return (
    <div className="space-y-12">
      <PersonaHeader personaId="public">
        <p className="mt-6 max-w-3xl rounded-xl border border-sky-900 bg-sky-950/30 p-4 text-sm leading-relaxed text-sky-100">
          Every technical word on this page is explained where it is first used and again in the glossary at the bottom.
          If something here is unclear, that is a problem with the page, not with you.
        </p>
      </PersonaHeader>

      <section aria-labelledby="journey-heading">
        <h2 id="journey-heading" className="text-2xl font-semibold text-white">
          From a blood draw to a disease model
        </h2>
        <p className="mt-2 max-w-3xl text-slate-400">
          Six steps, roughly six months. Open any step to read what is actually happening.
        </p>

        <ol className="mt-8 space-y-4">
          {JOURNEY.map((step, index) => {
            const open = openStep === step.id;
            return (
              <li key={step.id} className="relative pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-sky-700 bg-sky-950 text-xs font-semibold text-sky-300"
                >
                  {index + 1}
                </span>
                {index < JOURNEY.length - 1 && <span aria-hidden="true" className="absolute left-[13px] top-12 h-[calc(100%-1rem)] w-px bg-slate-800" />}
                <article className={`rounded-2xl border p-5 ${open ? 'border-sky-800 bg-sky-950/20' : 'border-slate-800 bg-slate-900'}`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenStep(open ? null : step.id)}
                    className="flex w-full items-start justify-between gap-4 text-left focus-visible:outline focus-visible:outline-cyan-400"
                  >
                    <span>
                      <span className="block text-base font-semibold text-white">{step.label}</span>
                      <span className="mt-1 block text-xs uppercase tracking-widest text-slate-500">{step.weeks}</span>
                    </span>
                    <span aria-hidden="true" className="mt-1 text-slate-500">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{step.plain}</p>
                  {open && (
                    <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                      <p className="text-sm leading-relaxed text-slate-400">{step.detail}</p>
                      {step.reassurance && (
                        <p className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm leading-relaxed text-emerald-100">
                          {step.reassurance}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="ethics-heading">
        <h2 id="ethics-heading" className="text-2xl font-semibold text-white">
          What is and is not being done
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {ETHICS.map((item) => (
            <article key={item.heading} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-base font-semibold text-white">{item.heading}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="glossary-heading">
        <h2 id="glossary-heading" className="text-2xl font-semibold text-white">
          Glossary
        </h2>
        <dl className="mt-6 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
          {GLOSSARY.map((entry) => (
            <div key={entry.term} className="grid gap-1 p-5 sm:grid-cols-[200px_1fr] sm:gap-6">
              <dt className="font-semibold text-sky-300">{entry.term}</dt>
              <dd className="text-sm leading-relaxed text-slate-400">{entry.plain}</dd>
            </div>
          ))}
        </dl>
      </section>

      <SourceList sourceIds={['ASSURED_2023', 'ISSCR_STANDARDS']} heading="Where this comes from" />
    </div>
  );
};
