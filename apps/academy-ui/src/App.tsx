import React, { useState } from 'react';
import { BookOpen, GraduationCap, FlaskConical, ArrowRight } from 'lucide-react';
import { CurriculumSection } from "./components/academy/CurriculumSection";
import { PersonaSwitcher } from "./components/academy/PersonaSwitcher";
import { LearnerPersonaId } from "./types";

const learningAreas = [
  { title: 'Learn the foundations', icon: BookOpen, text: 'Understand the concepts behind genome editing, experimental controls, and interpreting evidence.' },
  { title: 'Train with guided examples', icon: FlaskConical, text: 'Build confidence through worked examples and practice scenarios before moving to your own experiments.' },
  { title: 'Teach and assess', icon: GraduationCap, text: 'Support structured teaching with learning objectives, discussion topics, and opportunities to check understanding.' },
];

export const App: React.FC = () => {
  const [activePersonaId, setActivePersonaId] = useState<LearnerPersonaId>('research_labs');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800">
        <nav aria-label="Main navigation" className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="font-bold text-lg text-white focus-visible:outline focus-visible:outline-cyan-400">ASSURED</a>
          <div className="flex items-center gap-6 text-sm">
            <span aria-current="page" className="text-emerald-300">Academy</span>
            <a href="/studio/" className="text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-cyan-400">ASSURED Bench</a>
          </div>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
        <p className="text-sm font-semibold tracking-widest uppercase text-emerald-300">Teaching · Training · Learning</p>
        <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight">Assured Academy</h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
          A pedagogical learning space and interactive simulation ecosystem for understanding stem cell genome engineering and building experimental judgment.
        </p>

        {/* Empirical Benchmark Highlights */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 block font-medium">Loci Validated</span>
            <span className="text-2xl font-bold text-emerald-400">32 Loci</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Across 22 hiPSC lines</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 block font-medium">Knockout Score</span>
            <span className="text-2xl font-bold text-cyan-400">79.5 ± 23%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Mean ICE score</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 block font-medium">Knock-In Score</span>
            <span className="text-2xl font-bold text-purple-400">57.5 ± 27%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">CFD-blocked precision</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <span className="text-xs text-slate-400 block font-medium">Clonal Survival</span>
            <span className="text-2xl font-bold text-amber-400">65%</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">IsoCell microfluidics</span>
          </div>
        </div>

        {/* Persona Switcher Section */}
        <PersonaSwitcher
          activePersonaId={activePersonaId}
          onSelectPersona={setActivePersonaId}
        />

        <div className="mt-14 p-5 rounded-2xl border border-emerald-900 bg-emerald-950/30 max-w-3xl">
          <h2 className="font-semibold text-emerald-200">Start learning</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Explore 12 lessons across four curriculum tracks. Each lesson includes explanations, key takeaways, and a quiz.</p>
        </div>
        <section aria-label="Learning areas" className="mt-8 grid md:grid-cols-3 gap-6">
          {learningAreas.map(({ title, icon: Icon, text }) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
              <Icon aria-hidden="true" className="w-7 h-7 text-emerald-300" />
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
            </article>
          ))}
        </section>

        <CurriculumSection />

        <section aria-labelledby="standalone-tools" className="mt-14 border-t border-slate-800 pt-8">
          <h2 id="standalone-tools" className="text-2xl font-semibold">Standalone tools</h2>
          <p className="mt-2 text-slate-400">Explore design and trace analysis separately for demonstrations and practice.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <a href="/design/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-600 focus-visible:outline focus-visible:outline-cyan-400">
              <h3 className="text-lg font-semibold text-cyan-300">Standalone Design →</h3>
              <p className="mt-2 text-sm text-slate-400">Explore guide selection, donor design, and design reports.</p>
            </a>
            <a href="/qc/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-600 focus-visible:outline focus-visible:outline-emerald-400">
              <h3 className="text-lg font-semibold text-emerald-300">Standalone QC →</h3>
              <p className="mt-2 text-sm text-slate-400">Explore Sanger trace analysis and review sequencing results.</p>
            </a>
          </div>
        </section>
        <section className="mt-14 border-t border-slate-800 pt-8">
          <h2 className="text-xl font-semibold">Ready to work on an experiment?</h2>
          <p className="mt-2 text-slate-400">Use ASSURED Bench for design, reagent planning, trace QC, and clone review.</p>
          <a href="/studio/" className="inline-flex items-center gap-2 mt-5 text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-400">Open ASSURED Bench <ArrowRight aria-hidden="true" className="w-4 h-4" /></a>
        </section>
      </main>
      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">ASSURED Academy · Teaching, training, and learning</footer>
    </div>
  );
};

export default App;
