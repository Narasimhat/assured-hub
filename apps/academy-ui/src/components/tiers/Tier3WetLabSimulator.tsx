import React, { useMemo, useState } from 'react';
import {
  CULTURE_DEVIATIONS,
  ISOCELL,
  NUCLEASE,
  PROTOCOLS,
  pulseSummary,
  scoreRun,
  MODEL_PROVENANCE,
  type RunResult,
  type Severity,
} from '@assured/protocol';
import { PersonaHeader } from '../academy/PersonaSwitcher';
import { SourceList, TeachingModelNotice, StatedValue } from '../common/ProvenanceBadge';
import { benchHandoffUrl } from '../../services/benchBridge';

/**
 * Tier 3 - bench users. A nine-step state machine over the ASSURED and CRISPR-MiX bench workflow.
 *
 * Every choice the learner makes is either the protocol's or a named deviation. The outcome is
 * computed by @assured/protocol's scoreRun, which starts from the protocol's own pool scores and
 * IsoCell survival and applies labelled teaching penalties. Nothing is random: the same choices
 * always give the same plate, so a learner can change one thing and see what that one thing cost.
 */

type ProtocolId = 'assured' | 'crispr-mix';
type EditKind = 'knockout' | 'knockin';

interface Step {
  id: string;
  title: string;
  prompt: string;
  /** null for the protocol/edit-kind setup steps, which are not scored deviations. */
  deviationKey: string | null;
}

const STEPS: Step[] = [
  { id: 'protocol', title: 'Choose the protocol', prompt: 'Which published workflow are you running?', deviationKey: null },
  { id: 'edit', title: 'Choose the edit', prompt: 'A knockout and a knock-in do not start from the same efficiency.', deviationKey: null },
  { id: 'incubator', title: 'Set up the incubator', prompt: 'Which oxygen tension are the cells held at before and after editing?', deviationKey: 'normoxia' },
  { id: 'coating', title: 'Coat the plates', prompt: 'How are the matrix, the pipettes and the tubes handled?', deviationKey: 'warmGeltrex' },
  { id: 'media', title: 'Switch the medium', prompt: 'What are the cells in through editing and recovery?', deviationKey: 'noRecoveryMedium' },
  { id: 'nuclease', title: 'Thaw the nuclease', prompt: 'Which Cas9 tube goes into the RNP?', deviationKey: 'refrozenCas9' },
  { id: 'design', title: 'Check the design', prompt: 'The design you deliver changes the plate as much as the technique does.', deviationKey: null },
  { id: 'pulse', title: 'Electroporate', prompt: 'Which pulse programme?', deviationKey: 'wrongPulse' },
  { id: 'cloning', title: 'Clone single cells', prompt: 'What is in the medium when single cells are seeded?', deviationKey: 'noCloneR2' },
];

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: 'border-rose-800 bg-rose-950/25 text-rose-200',
  major: 'border-amber-800 bg-amber-950/25 text-amber-200',
  minor: 'border-sky-800 bg-sky-950/25 text-sky-200',
};

const VERDICT_STYLE: Record<string, string> = {
  good: 'border-emerald-700 bg-emerald-950/30',
  acceptable: 'border-sky-700 bg-sky-950/30',
  marginal: 'border-amber-700 bg-amber-950/30',
  failed: 'border-rose-700 bg-rose-950/30',
};

export const Tier3WetLabSimulator: React.FC = () => {
  const [protocolId, setProtocolId] = useState<ProtocolId>('assured');
  const [editKind, setEditKind] = useState<EditKind>('knockin');
  const [deviations, setDeviations] = useState<Record<string, boolean>>({});
  const [guideCount, setGuideCount] = useState(2);
  const [cutToEditBp, setCutToEditBp] = useState(4);
  const [donorBlocksAllGuides, setDonorBlocksAllGuides] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const chosenDeviations = useMemo(() => Object.keys(deviations).filter((key) => deviations[key]), [deviations]);

  const result: RunResult = useMemo(
    () => scoreRun({ editKind, deviations: chosenDeviations, guideCount, cutToEditBp, donorBlocksAllGuides }),
    [editKind, chosenDeviations, guideCount, cutToEditBp, donorBlocksAllGuides],
  );

  const perfect: RunResult = useMemo(
    () => scoreRun({ editKind, deviations: [], guideCount: 2, cutToEditBp: 0, donorBlocksAllGuides: true }),
    [editKind],
  );

  const setDeviation = (key: string, value: boolean) => {
    setDeviations((current) => ({ ...current, [key]: value }));
    setSubmitted(false);
  };

  const reset = () => {
    setDeviations({});
    setGuideCount(2);
    setCutToEditBp(4);
    setDonorBlocksAllGuides(true);
    setSubmitted(false);
  };

  const benchLink = benchHandoffUrl({
    name: `Academy bench run (${PROTOCOLS[protocolId].name}, ${editKind})`,
    gene: 'APOE',
    editType: editKind === 'knockout' ? 'ko' : 'pm',
    mutation: editKind === 'knockin' ? 'R176C' : undefined,
  });

  return (
    <div className="space-y-12">
      <PersonaHeader personaId="bench" />

      <TeachingModelNotice>
        The penalties this simulator applies are teaching defaults, chosen so the ranking of mistakes is right and the
        mechanism is memorable. They are <strong>not measured effect sizes</strong>, and this is not a prediction of your
        plate. What is taken from the protocol is the starting point: the mean pool scores and the IsoCell survival rate.
        The same warning is on <code className="font-mono text-xs">apps/academy-core/src/simulator/params.js</code>.
      </TeachingModelNotice>

      <section aria-labelledby="run-heading" className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div>
          <h2 id="run-heading" className="text-2xl font-semibold text-white">
            Set up the run
          </h2>
          <p className="mt-2 text-slate-400">Nine steps. Every answer is either what the protocol says or a deviation that is named.</p>

          <ol className="mt-8 space-y-6">
            {STEPS.map((step, index) => {
              const deviation = step.deviationKey ? CULTURE_DEVIATIONS.find((d) => d.key === step.deviationKey) : null;
              const chosenWrong = step.deviationKey ? Boolean(deviations[step.deviationKey]) : false;

              return (
                <li key={step.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                    Step {index + 1} &middot; {step.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{step.prompt}</p>

                  {step.id === 'protocol' && (
                    <div className="mt-4 space-y-3" role="radiogroup" aria-label="Protocol">
                      {(Object.keys(PROTOCOLS) as ProtocolId[]).map((id) => (
                        <label key={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 hover:border-slate-500">
                          <input
                            type="radio"
                            name="protocol"
                            checked={protocolId === id}
                            onChange={() => {
                              setProtocolId(id);
                              setSubmitted(false);
                            }}
                            className="mt-1 accent-amber-500"
                          />
                          <span>
                            <span className="block text-sm font-medium text-slate-100">{PROTOCOLS[id].name}</span>
                            <span className="mt-1 block text-xs leading-relaxed text-slate-400">{PROTOCOLS[id].purpose}</span>
                            <span className="mt-1 block font-mono text-xs text-amber-300">{pulseSummary(id)}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {step.id === 'edit' && (
                    <div className="mt-4 flex flex-wrap gap-3" role="radiogroup" aria-label="Edit kind">
                      {(['knockout', 'knockin'] as EditKind[]).map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          role="radio"
                          aria-checked={editKind === kind}
                          onClick={() => {
                            setEditKind(kind);
                            setSubmitted(false);
                          }}
                          className={`rounded-xl border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-cyan-400 ${
                            editKind === kind ? 'border-amber-600 bg-amber-950/40 text-amber-200' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {kind === 'knockout' ? 'Knockout' : 'SNP knock-in'}
                        </button>
                      ))}
                    </div>
                  )}

                  {step.id === 'design' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="sim-guides" className="block text-sm text-slate-300">
                          Guides delivered
                        </label>
                        <select
                          id="sim-guides"
                          value={guideCount}
                          onChange={(event) => {
                            setGuideCount(Number(event.target.value));
                            setSubmitted(false);
                          }}
                          className="mt-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-cyan-400"
                        >
                          <option value={1}>1 guide</option>
                          <option value={2}>2 guides</option>
                        </select>
                      </div>
                      {editKind === 'knockin' && (
                        <>
                          <div>
                            <label htmlFor="sim-cut" className="block text-sm text-slate-300">
                              Cut to edit distance: <span className="font-mono text-amber-300">{cutToEditBp} bp</span>
                            </label>
                            <input
                              id="sim-cut"
                              type="range"
                              min={0}
                              max={30}
                              value={cutToEditBp}
                              onChange={(event) => {
                                setCutToEditBp(Number(event.target.value));
                                setSubmitted(false);
                              }}
                              className="mt-2 w-full accent-amber-500"
                            />
                          </div>
                          <label className="flex items-start gap-3 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={donorBlocksAllGuides}
                              onChange={(event) => {
                                setDonorBlocksAllGuides(event.target.checked);
                                setSubmitted(false);
                              }}
                              className="mt-1 accent-amber-500"
                            />
                            ssODN carries silent blocking changes for every guide
                          </label>
                        </>
                      )}
                    </div>
                  )}

                  {deviation && (
                    <div className="mt-4 space-y-2" role="radiogroup" aria-label={deviation.question}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 hover:border-slate-500">
                        <input
                          type="radio"
                          name={deviation.key}
                          checked={!chosenWrong}
                          onChange={() => setDeviation(deviation.key, false)}
                          className="mt-1 accent-emerald-500"
                        />
                        <span className="text-sm leading-relaxed text-slate-200">
                          {deviation.key === 'wrongPulse' ? `${PROTOCOLS[protocolId].name}: ${pulseSummary(protocolId)}` : deviation.correct}
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 hover:border-slate-500">
                        <input
                          type="radio"
                          name={deviation.key}
                          checked={chosenWrong}
                          onChange={() => setDeviation(deviation.key, true)}
                          className="mt-1 accent-rose-500"
                        />
                        <span className="text-sm leading-relaxed text-slate-300">
                          {deviation.key === 'wrongPulse'
                            ? `${PROTOCOLS[protocolId === 'assured' ? 'crispr-mix' : 'assured'].name}: ${pulseSummary(protocolId === 'assured' ? 'crispr-mix' : 'assured')}`
                            : deviation.deviation}
                        </span>
                      </label>
                      {step.id === 'nuclease' && (
                        <p className="pt-1 text-xs leading-relaxed text-slate-500">
                          {NUCLEASE.name}. Stock <StatedValue stated={NUCLEASE.stockConcentration} showBadge={false} />, stored as{' '}
                          <StatedValue stated={NUCLEASE.aliquotVolume} showBadge={false} /> single-use aliquots.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="rounded-xl border border-amber-600 bg-amber-950/50 px-5 py-2.5 text-sm font-medium text-amber-200 hover:border-amber-400 focus-visible:outline focus-visible:outline-cyan-400"
            >
              Run the plate
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-slate-500 focus-visible:outline focus-visible:outline-cyan-400"
            >
              Reset to protocol conditions
            </button>
          </div>
        </div>

        <aside aria-label="Predicted outcome" aria-live="polite" className="xl:sticky xl:top-6 xl:self-start">
          <div className={`rounded-2xl border p-6 ${VERDICT_STYLE[result.verdict.level]}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Predicted outcome</p>

            <dl className="mt-5 space-y-4">
              <Metric
                label={editKind === 'knockout' ? 'KO score (bulk pool)' : 'KI score (bulk pool)'}
                value={`${result.poolScorePercent}%`}
                baseline={`protocol mean ${perfect.poolScorePercent}%`}
                bad={result.poolScorePercent < perfect.poolScorePercent}
              />
              <Metric
                label="Surviving clones from one IsoCell plate"
                value={`${result.survivingClones}`}
                baseline={`benchmark ~${result.benchmarkClones}`}
                bad={!result.meetsBenchmark}
              />
              <Metric
                label="Edited clones to screen"
                value={`${result.editedClones}`}
                baseline={`${result.singleCellChambers} single-cell chambers loaded`}
                bad={result.editedClones < 5}
              />
            </dl>

            <p className="mt-5 border-t border-slate-700/60 pt-4 text-sm leading-relaxed text-slate-200">{result.verdict.text}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{MODEL_PROVENANCE}</p>
          </div>

          {submitted && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                {result.findings.length === 0 ? 'Nothing to fix' : `${result.findings.length} thing${result.findings.length === 1 ? '' : 's'} cost you clones`}
              </h3>
              {result.findings.length === 0 && (
                <p className="rounded-xl border border-emerald-800 bg-emerald-950/20 p-4 text-sm leading-relaxed text-emerald-100">
                  Protocol conditions throughout. Change one answer and come back to see what that single change costs.
                </p>
              )}
              {result.findings.map((finding) => (
                <article key={finding.key} className={`rounded-xl border p-4 ${SEVERITY_STYLE[finding.severity]}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest">{finding.severity}</p>
                  <p className="mt-1 text-sm font-medium text-white">{finding.label}</p>
                  <p className="mt-2 text-xs text-slate-300">
                    You chose: <span className="text-slate-100">{finding.chose}</span>
                  </p>
                  {finding.shouldBe && (
                    <p className="text-xs text-slate-300">
                      Protocol: <span className="text-slate-100">{finding.shouldBe}</span>
                    </p>
                  )}
                  <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-relaxed text-slate-300">{finding.mechanism}</p>
                  <p className="mt-2 font-mono text-[11px] text-slate-400">
                    editing &times;{finding.editingFactor} &middot; survival &times;{finding.survivalFactor}
                  </p>
                </article>
              ))}
            </div>
          )}
        </aside>
      </section>

      <section aria-labelledby="isocell-heading">
        <h2 id="isocell-heading" className="text-2xl font-semibold text-white">
          Why cloning rescues a modest pool
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Chambers on the plate', stated: ISOCELL.chambersPerPlate },
            { label: 'Holding exactly one cell', stated: ISOCELL.singleCellChambers },
            { label: 'Surviving clones', stated: ISOCELL.survivingClones },
            { label: 'Verified clones banked per project', stated: ISOCELL.seedbank.clonesPerProject },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="mt-2">
                <StatedValue stated={item.stated} />
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-slate-300">{ISOCELL.claim}</p>
      </section>

      <section aria-labelledby="bench-heading" className="rounded-2xl border border-cyan-900 bg-cyan-950/20 p-6">
        <h2 id="bench-heading" className="text-xl font-semibold text-white">
          Take it to the real calculators
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
          This page scores decisions. ASSURED Bench does the arithmetic you will actually pipette from: the reaction mix,
          the order sheet and the trace analysis.
        </p>
        <a
          href={benchLink}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-700 bg-cyan-950/60 px-4 py-2.5 text-sm font-medium text-cyan-200 hover:border-cyan-500 focus-visible:outline focus-visible:outline-cyan-400"
        >
          Open this run in ASSURED Bench <span aria-hidden="true">&rarr;</span>
        </a>
      </section>

      <SourceList sourceIds={['ASSURED_2023', 'CRISPR_MIX_2026', 'PLATFORM_SPEC']} />
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; baseline: string; bad: boolean }> = ({ label, value, baseline, bad }) => (
  <div>
    <dt className="text-xs uppercase tracking-widest text-slate-400">{label}</dt>
    <dd className={`mt-1 font-mono text-3xl font-semibold ${bad ? 'text-rose-300' : 'text-emerald-300'}`}>{value}</dd>
    <dd className="text-xs text-slate-500">{baseline}</dd>
  </div>
);
