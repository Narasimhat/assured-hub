import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, GraduationCap, FlaskConical, ArrowRight } from 'lucide-react';
import { PERSONAS, getPersona } from '@assured/protocol';

import { CurriculumSection } from './components/academy/CurriculumSection';
import { PersonaBar, PersonaCards } from './components/academy/PersonaSwitcher';
import { TierStudents } from './components/tiers/TierStudents';
import { TierResearchLab } from './components/tiers/TierResearchLab';
import { TierCoreFacility } from './components/tiers/TierCoreFacility';
import { UnifiedPipeline } from './components/pipeline/UnifiedPipeline';
import { VirtualLab } from './components/simulator/VirtualLab';
import { RareDiseaseHub } from './components/missions/RareDiseaseHub';
import { ToolLaunchpad } from './components/tools/ToolLaunchpad';
import { FrugalLabConfig } from './components/frugal/FrugalLabConfig';
import { HOME_ROUTE, personaIdFromRoute, useHashRoute } from './router';
import { readStoredPersona, storePersona, uiFor } from './data/personas';

/**
 * The Academy shell.
 *
 * Routing is by hash (see src/router.ts) because the same build is served both standalone and under
 * /academy/ in the hub. Before this, App.tsx rendered a landing page and the curriculum only; the
 * workbench, virtual lab, missions, tool catalogue and frugal worksheet were built and smoke-tested
 * but had no route. They now have one.
 */

const learningAreas = [
  { title: 'Learn the foundations', icon: BookOpen, text: 'Understand the concepts behind genome editing, experimental controls, and interpreting evidence.' },
  { title: 'Train with guided examples', icon: FlaskConical, text: 'Build confidence through worked examples and practice scenarios before moving to your own experiments.' },
  { title: 'Teach and assess', icon: GraduationCap, text: 'Support structured teaching with learning objectives, discussion topics, and opportunities to check understanding.' },
];

/** Routes that are not tier pages. Each one mounts a module that already existed. */
const MODULES: Record<string, { title: string; blurb: string; render: () => React.ReactElement }> = {
  '/workbench': {
    title: 'Pipeline workbench',
    blurb: 'Design, order, bench, trace QC and publication draft, across five stages on real preset projects.',
    render: () => <UnifiedPipeline />,
  },
  '/simulator': {
    title: 'Virtual lab',
    blurb: 'A decision game over the bench workflow: confluency, nucleofection, plate, genotyping.',
    render: () => <VirtualLab onAwardMastery={() => undefined} />,
  },
  '/missions': {
    title: 'Rare-disease missions',
    blurb: 'Designs regenerated from the real Design engine and checked against GRCh38, with the retired ones and why they failed.',
    render: () => <RareDiseaseHub onSelectMissionForLab={() => undefined} />,
  },
  '/tools': {
    title: 'Sample data and tools',
    blurb: 'The real files this platform ships: traces, designs, reference records and result tables.',
    render: () => <ToolLaunchpad />,
  },
  '/frugal': {
    title: 'Low-resource lab worksheet',
    blurb: 'What the protocol validated, what a lab must validate for itself, and your own costs.',
    render: () => <FrugalLabConfig />,
  },
};

const TIER_PAGES: Record<string, () => React.ReactElement> = {
  student: () => <TierStudents />,
  lab: () => <TierResearchLab />,
  core: () => <TierCoreFacility />,
};

export const App: React.FC = () => {
  const [route, go] = useHashRoute();
  const [persona, setPersona] = useState<string | null>(readStoredPersona);

  const routePersona = personaIdFromRoute(route);
  useEffect(() => {
    if (routePersona && getPersona(routePersona)) {
      setPersona(routePersona);
      storePersona(routePersona);
    }
  }, [routePersona]);

  const choosePersona = useCallback(
    (id: string) => {
      setPersona(id);
      storePersona(id);
      const target = getPersona(id);
      if (target) go(target.route);
    },
    [go],
  );

  const activePersona = routePersona && getPersona(routePersona) ? routePersona : persona;
  const module = MODULES[route];
  const isHome = route === HOME_ROUTE || (!routePersona && !module);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <header className="border-b border-slate-800">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <a href="../" className="text-lg font-bold text-white focus-visible:outline focus-visible:outline-cyan-400">
            ASSURED
          </a>
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <a
              href={`#${HOME_ROUTE}`}
              aria-current={isHome ? 'page' : undefined}
              className={isHome ? 'text-emerald-300' : 'text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-cyan-400'}
            >
              Academy
            </a>
            {Object.entries(MODULES).map(([path, info]) => (
              <a
                key={path}
                href={`#${path}`}
                aria-current={route === path ? 'page' : undefined}
                className={route === path ? 'text-emerald-300' : 'text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-cyan-400'}
              >
                {info.title}
              </a>
            ))}
            <a href="../studio/" className="text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-cyan-400">
              ASSURED Bench
            </a>
          </div>
        </nav>
      </header>

      {!isHome && (
        <div className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3">
            <a href={`#${HOME_ROUTE}`} className="text-sm text-slate-400 hover:text-white focus-visible:outline focus-visible:outline-cyan-400">
              &larr; All tiers
            </a>
            <PersonaBar activeId={activePersona ?? 'student'} onChoose={choosePersona} />
          </div>
        </div>
      )}

      <main id="academy-main" tabIndex={-1} className="mx-auto max-w-6xl px-6 py-14 focus:outline-none sm:py-16">
        {isHome && <Home activePersona={activePersona} onChoose={choosePersona} onOpenModule={go} />}

        {routePersona && TIER_PAGES[routePersona] && (
          <>
            {TIER_PAGES[routePersona]()}
            <TierFooter personaId={routePersona} onOpenModule={go} />
          </>
        )}

        {routePersona && !TIER_PAGES[routePersona] && (
          <section aria-labelledby="missing-heading">
            <h1 id="missing-heading" className="text-2xl font-semibold">
              No such tier
            </h1>
            <p className="mt-3 text-slate-400">
              <a href={`#${HOME_ROUTE}`} className="text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-400">
                Choose a tier
              </a>
              .
            </p>
          </section>
        )}

        {module && (
          <section aria-labelledby="module-heading">
            <header className="border-b border-slate-800 pb-6">
              <h1 id="module-heading" className="text-3xl font-bold tracking-tight">
                {module.title}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-400">{module.blurb}</p>
            </header>
            <div className="mt-10">{module.render()}</div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        ASSURED Academy &middot; Teaching, training, and learning
      </footer>
    </div>
  );
};

const Home: React.FC<{ activePersona: string | null; onChoose: (id: string) => void; onOpenModule: (route: string) => void }> = ({
  activePersona,
  onChoose,
  onOpenModule,
}) => (
  <>
    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">Teaching &middot; Training &middot; Learning</p>
    <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">Assured Academy</h1>
    <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
      A learning space for understanding genome editing in human pluripotent stem cells, and for building the judgement
      that makes an experiment work.
    </p>

    <section aria-labelledby="tiers-heading" className="mt-12">
      <h2 id="tiers-heading" className="text-3xl font-semibold">
        Start where you are
      </h2>
      <p className="mt-3 max-w-3xl text-slate-400">
        Three tiers. Each one has its own module and its own depth of explanation, and you can move between them at
        any time &mdash; nothing is hidden from anyone.
      </p>
      <PersonaCards activeId={activePersona} onChoose={onChoose} />
    </section>

    <section aria-label="Learning areas" className="mt-14 grid gap-6 md:grid-cols-3">
      {learningAreas.map(({ title, icon: Icon, text }) => (
        <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
          <Icon aria-hidden="true" className="h-7 w-7 text-emerald-300" />
          <h2 className="mt-5 text-xl font-semibold">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
        </article>
      ))}
    </section>

    <CurriculumSection />

    <section aria-labelledby="modules-heading" className="mt-14 border-t border-slate-800 pt-8">
      <h2 id="modules-heading" className="text-2xl font-semibold">
        Practice modules
      </h2>
      <p className="mt-2 text-slate-400">Worked examples built on real designs, real traces and the real Design engine.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {Object.entries(MODULES).map(([path, info]) => (
          <button
            key={path}
            type="button"
            onClick={() => onOpenModule(path)}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-600 focus-visible:outline focus-visible:outline-cyan-400"
          >
            <h3 className="text-lg font-semibold text-cyan-300">{info.title} &rarr;</h3>
            <p className="mt-2 text-sm text-slate-400">{info.blurb}</p>
          </button>
        ))}
      </div>
    </section>

    <section aria-labelledby="standalone-tools" className="mt-14 border-t border-slate-800 pt-8">
      <h2 id="standalone-tools" className="text-2xl font-semibold">
        Standalone tools
      </h2>
      <p className="mt-2 text-slate-400">Explore design and trace analysis separately for demonstrations and practice.</p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <a href="../design/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-600 focus-visible:outline focus-visible:outline-cyan-400">
          <h3 className="text-lg font-semibold text-cyan-300">Standalone Design &rarr;</h3>
          <p className="mt-2 text-sm text-slate-400">Explore guide selection, donor design, and design reports.</p>
        </a>
        <a href="../qc/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-600 focus-visible:outline focus-visible:outline-emerald-400">
          <h3 className="text-lg font-semibold text-emerald-300">Standalone QC &rarr;</h3>
          <p className="mt-2 text-sm text-slate-400">Explore Sanger trace analysis and review sequencing results.</p>
        </a>
      </div>
    </section>

    <section className="mt-14 border-t border-slate-800 pt-8">
      <h2 className="text-xl font-semibold">Ready to work on an experiment?</h2>
      <p className="mt-2 text-slate-400">Use ASSURED Bench for design, reagent planning, trace QC, and clone review.</p>
      <a href="../studio/" className="mt-5 inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-400">
        Open ASSURED Bench <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </a>
    </section>
  </>
);

/** Lessons and practice modules chosen for the tier, shown under every tier page. */
const TierFooter: React.FC<{ personaId: string; onOpenModule: (route: string) => void }> = ({ personaId, onOpenModule }) => {
  const ui = uiFor(personaId);
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) return null;

  return (
    <div className="mt-16 border-t border-slate-800 pt-12">
      {ui.trackIds.length > 0 && (
        <CurriculumSection
          trackIds={ui.trackIds}
          heading="Lessons for this tier"
          intro={`The curriculum tracks that go with ${persona.module}. Every lesson ends with a quiz.`}
        />
      )}

      {ui.modules.length > 0 && (
        <section aria-labelledby="tier-modules" className="mt-12">
          <h2 id="tier-modules" className="text-2xl font-semibold">
            Practice next
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {ui.modules
              .filter((path) => MODULES[path])
              .map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => onOpenModule(path)}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-cyan-600 focus-visible:outline focus-visible:outline-cyan-400"
                >
                  <h3 className="text-lg font-semibold text-cyan-300">{MODULES[path].title} &rarr;</h3>
                  <p className="mt-2 text-sm text-slate-400">{MODULES[path].blurb}</p>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
