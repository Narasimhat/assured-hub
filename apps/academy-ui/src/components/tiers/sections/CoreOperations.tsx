import React, { useMemo, useState } from 'react';
import { ISOCELL, projectCloneYield, planSeedbank } from '@assured/protocol';
import { StatedValue, TeachingModelNotice } from '../../common/ProvenanceBadge';

/**
 * Yield planning and the ISSCR five tenets as a working checklist, for the core-facility tier.
 *
 * The checklist state is kept in localStorage so a facility can work through it across visits,
 * and the page says plainly that a tick here is a note to self, not a release record.
 */

interface CheckItem {
  id: string;
  text: string;
  when: 'baseline' | 'post-edit' | 'both';
}

interface Tenet {
  id: string;
  number: number;
  title: string;
  purpose: string;
  items: CheckItem[];
}

const TENETS: Tenet[] = [
  {
    id: 'basic',
    number: 1,
    title: 'Basic characterisation',
    purpose: 'Establish that the line is what the records say it is, and that nothing is growing in it that should not be.',
    items: [
      { id: 'str', text: 'STR profile matches the parental line and the donor record', when: 'both' },
      { id: 'myco', text: 'Mycoplasma negative', when: 'both' },
      { id: 'sterility', text: 'Sterility: no bacterial or fungal growth', when: 'both' },
      { id: 'provenance', text: 'Provenance and consent documentation on file, with permitted uses recorded', when: 'baseline' },
      { id: 'naming', text: 'Line registered with a unique, resolvable identifier used in every downstream record', when: 'baseline' },
    ],
  },
  {
    id: 'pluripotency',
    number: 2,
    title: 'Pluripotency and the undifferentiated state',
    purpose: 'Show the cells are still pluripotent after everything that has been done to them.',
    items: [
      { id: 'markers', text: 'OCT3/4, SOX2 and NANOG by flow cytometry or immunofluorescence', when: 'both' },
      { id: 'surface', text: 'Surface antigens: SSEA-4 and TRA-1-60', when: 'both' },
      { id: 'trilineage', text: 'Trilineage differentiation: ectoderm, mesoderm, endoderm', when: 'both' },
      { id: 'morphology', text: 'Morphology logged: tight borders, high nuclear-to-cytoplasm ratio, no differentiated halo', when: 'both' },
    ],
  },
  {
    id: 'genomic',
    number: 3,
    title: 'Genomic characterisation',
    purpose: 'Catch what culture and editing change in the genome, on top of the intended edit.',
    items: [
      { id: 'karyotype', text: 'G-banding karyotype normal (46,XX or 46,XY)', when: 'both' },
      { id: 'snp-array', text: 'SNP array for sub-chromosomal copy-number change, including recurrent culture-acquired gains', when: 'both' },
      { id: 'on-target', text: 'On-target locus sequenced: the intended edit, and nothing else at the site', when: 'post-edit' },
      { id: 'off-target', text: 'Predicted off-target sites sequenced, with the nomination method recorded', when: 'post-edit' },
      { id: 'xci', text: 'Female lines: XIST expression and allele-specific expression checked for XCI erosion', when: 'both' },
      { id: 'passage', text: 'Passage number recorded at every characterisation point', when: 'both' },
    ],
  },
  {
    id: 'models',
    number: 4,
    title: 'Stem cell-based model systems',
    purpose: 'Make the derived model reproducible by someone who was not there.',
    items: [
      { id: 'protocol', text: 'Differentiation protocol version and all reagent lots recorded', when: 'post-edit' },
      { id: 'identity', text: 'Derived cell type identified by marker expression, not by appearance', when: 'post-edit' },
      { id: 'isogenic', text: 'Isogenic control carried through the same differentiation, in the same batch', when: 'post-edit' },
      { id: 'maturity', text: 'Maturation state stated, with the days in culture it corresponds to', when: 'post-edit' },
    ],
  },
  {
    id: 'reporting',
    number: 5,
    title: 'Reporting',
    purpose: 'Make the record good enough that a reader can tell what was and was not done.',
    items: [
      { id: 'registry', text: 'Line deposited or registered with its identifier published', when: 'post-edit' },
      { id: 'qc-reported', text: 'Which QC was done, when, and at what passage, reported alongside the results', when: 'post-edit' },
      { id: 'negatives', text: 'Clones that failed and the reason they failed, retained in the record', when: 'post-edit' },
      { id: 'availability', text: 'Availability and transfer terms stated', when: 'post-edit' },
    ],
  },
];

const STORAGE_KEY = 'assured_isscr_checklist';

function readChecked(): Record<string, boolean> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
}

export const CoreOperations: React.FC = () => {
  const [poolScorePercent, setPoolScorePercent] = useState(40);
  const [survivalPercent, setSurvivalPercent] = useState(Math.round(ISOCELL.survivalRate.value * 100));
  const [clonesNeeded, setClonesNeeded] = useState(5);
  const [vialsPerClone, setVialsPerClone] = useState(ISOCELL.seedbank.vialsPerBank.value);
  const [checked, setChecked] = useState<Record<string, boolean>>(readChecked);
  const [storageNotice, setStorageNotice] = useState('');

  const yieldResult = useMemo(
    () => projectCloneYield({ poolScore: poolScorePercent / 100, survivalRate: survivalPercent / 100, clonesNeeded }),
    [poolScorePercent, survivalPercent, clonesNeeded],
  );
  const bank = useMemo(() => planSeedbank({ clonesToBank: clonesNeeded, vialsPerClone }), [clonesNeeded, vialsPerClone]);

  const allItems = TENETS.flatMap((tenet) => tenet.items);
  const doneCount = allItems.filter((item) => checked[item.id]).length;

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = { ...current, [id]: !current[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        setStorageNotice('Ticks are kept for this visit only; this browser will not store them.');
      }
      return next;
    });
  };

  return (
    <div className="space-y-14">

      <section aria-labelledby="yield-heading">
        <h2 id="yield-heading" className="text-2xl font-semibold text-white">
          Plate planning: how many plates does this project need?
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-300">
          A requesting group arrives with a pool score and a number of clones they need. This works out whether one plate
          covers it, which is the question that decides the quote.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <Slider id="pool" label="Pool score from the bulk trace" value={poolScorePercent} min={1} max={100} suffix="%" onChange={setPoolScorePercent} />
            <Slider id="survival" label="Clone survival on your plates" value={survivalPercent} min={5} max={95} suffix="%" onChange={setSurvivalPercent} />
            <Slider id="needed" label="Verified clones the project needs" value={clonesNeeded} min={1} max={12} suffix="" onChange={setClonesNeeded} />
            <Slider id="vials" label="Vials per clone in the bank" value={vialsPerClone} min={10} max={100} suffix=" vials" onChange={setVialsPerClone} />
            <p className="border-t border-slate-800 pt-4 text-xs leading-relaxed text-slate-500">
              Survival defaults to the protocol&rsquo;s <StatedValue stated={ISOCELL.survivalRate} showBadge={false} />. Replace it with
              your own as soon as you have run plates; it is the number most specific to a facility.
            </p>
          </div>

          <div aria-live="polite" className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Tile label="Single-cell chambers" value={yieldResult.singleCellChambers} sub={`of ${yieldResult.chambers} chambers`} />
              <Tile label="Surviving clones" value={yieldResult.survivors} sub={`at ${survivalPercent}% survival`} />
              <Tile label="Edited clones to screen" value={yieldResult.editedClones} sub={`at a ${poolScorePercent}% pool score`} tone={yieldResult.meetsTarget ? 'good' : 'bad'} />
              <Tile label="Homozygous, upper-bound sketch" value={yieldResult.homozygousClones} sub="pool score squared" />
            </div>

            <div className={`rounded-2xl border p-5 ${yieldResult.meetsTarget ? 'border-emerald-700 bg-emerald-950/25' : 'border-amber-700 bg-amber-950/25'}`}>
              <p className="text-sm leading-relaxed text-slate-100">
                {yieldResult.meetsTarget
                  ? `One plate should give the ${clonesNeeded} verified clones this project needs, with margin for the ones that fail characterisation.`
                  : yieldResult.platesForTarget
                    ? `One plate is not enough: budget about ${yieldResult.platesForTarget} plates, or send the group back to raise the pool score before cloning.`
                    : 'Nothing is edited in this pool. Cloning it would spend a plate to find out what the bulk trace already said.'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Seedbank</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {bank.clonesToBank} clones &times; {bank.vialsPerClone} vials = <span className="font-mono text-cyan-300">{bank.totalVials} vials</span>, about{' '}
                {bank.freezeRuns} freezing runs. Cryopreservation in {ISOCELL.cryopreservation.medium}, {ISOCELL.cryopreservation.format} format.
              </p>
              <p className="mt-2 text-sm text-slate-400">{bank.note}</p>
            </div>

            <ul className="space-y-2">
              {yieldResult.caveats.map((caveat) => (
                <li key={caveat} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs leading-relaxed text-slate-400">
                  {caveat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="isscr-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="isscr-heading" className="text-2xl font-semibold text-white">
            ISSCR five tenets, as a working checklist
          </h2>
          <p role="status" className="text-sm text-cyan-300">
            {doneCount} of {allItems.length} ticked
          </p>
        </div>
        {storageNotice && (
          <p role="status" className="mt-3 text-sm text-amber-300">
            {storageNotice}
          </p>
        )}
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          A tick here is a note to yourself in this browser. It is not a release record, it is not auditable, and it does
          not travel with a line. Keep the real record wherever your facility keeps the real record.
        </p>

        <div className="mt-8 space-y-6">
          {TENETS.map((tenet) => {
            const tenetDone = tenet.items.filter((item) => checked[item.id]).length;
            return (
              <section key={tenet.id} aria-labelledby={`tenet-${tenet.id}`} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 id={`tenet-${tenet.id}`} className="text-lg font-semibold text-white">
                    <span className="text-cyan-300">{tenet.number}.</span> {tenet.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {tenetDone}/{tenet.items.length}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{tenet.purpose}</p>
                <ul className="mt-5 space-y-2">
                  {tenet.items.map((item) => (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 p-3 hover:border-slate-600">
                        <input type="checkbox" checked={Boolean(checked[item.id])} onChange={() => toggle(item.id)} className="mt-1 h-4 w-4 accent-cyan-500" />
                        <span className="flex-1 text-sm leading-relaxed text-slate-300">{item.text}</span>
                        <span className="shrink-0 rounded border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">
                          {item.when === 'both' ? 'baseline + post-edit' : item.when}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </section>

      <TeachingModelNotice>
        The clone-yield arithmetic treats a pool score as a per-clone probability and squares it for homozygosity. Both
        are planning approximations, not biology. They are useful for sizing a job and wrong for predicting one.
      </TeachingModelNotice>

    </div>
  );
};

const Slider: React.FC<{ id: string; label: string; value: number; min: number; max: number; suffix: string; onChange: (v: number) => void }> = ({
  id,
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-200">
      {label}:{' '}
      <span className="font-mono text-cyan-300">
        {value}
        {suffix}
      </span>
    </label>
    <input id={id} type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-cyan-500" />
  </div>
);

const Tile: React.FC<{ label: string; value: number; sub: string; tone?: 'good' | 'bad' }> = ({ label, value, sub, tone }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`mt-2 font-mono text-3xl font-semibold ${tone === 'bad' ? 'text-amber-300' : tone === 'good' ? 'text-emerald-300' : 'text-slate-100'}`}>{value}</p>
    <p className="mt-1 text-xs text-slate-500">{sub}</p>
  </div>
);
