import React, { useState } from 'react';
import { BookOpen, GraduationCap, FlaskConical, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { CurriculumSection } from "./components/academy/CurriculumSection";
import { PersonaSwitcher } from "./components/academy/PersonaSwitcher";
import { CrisprVisualExplainer } from "./components/academy/CrisprVisualExplainer";
import { CrisprpediaGlossary } from "./components/academy/GlossaryText";
import { LearnerPersonaId } from "./types";

const learningAreas = [
  { title: 'Visual storytelling (Science × Art)', icon: Sparkles, text: 'Step through custom molecular illustrations that make PAM scanning, RNP assembly, and asymmetric HDR templates intuitive at a glance.' },
  { title: 'Dual-level depth & live simulators', icon: FlaskConical, text: 'Switch effortlessly between everyday analogies and bench-ready biophysical mechanisms across three learner tiers.' },
  { title: 'Interactive vocabulary & mastery', icon: GraduationCap, text: 'Click any dashed-underline term for instant definitions without losing your reading flow, then test your judgment with scenario quizzes.' },
];

export const App: React.FC = () => {
  const [activePersonaId, setActivePersonaId] = useState<LearnerPersonaId>('students');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md">
        <nav aria-label="Main navigation" className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a href="/" className="font-extrabold text-lg text-white tracking-tight focus-visible:outline focus-visible:outline-cyan-400">
              ASSURED
            </a>
            <span className="text-slate-700">/</span>
            <span aria-current="page" className="text-emerald-400 font-bold text-sm">
              Academy · Visual Guide to Stem Cell CRISPR
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs sm:text-sm">
            <a href="#visual-explainer" className="text-slate-300 hover:text-emerald-300 transition-colors">1. What is CRISPR?</a>
            <a href="#persona-simulators" className="text-slate-300 hover:text-cyan-300 transition-colors">2. Learning Tiers</a>
            <a href="#curriculum-tracks" className="text-slate-300 hover:text-purple-300 transition-colors">3. 12 Lessons</a>
            <a href="#crisprpedia-glossary" className="text-slate-300 hover:text-amber-300 transition-colors">4. Glossary</a>
            <a
              href="/studio/"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 font-bold transition-colors focus-visible:outline focus-visible:outline-cyan-400"
            >
              ASSURED Bench →
            </a>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
        {/* Editorial Hero Header inspired by IGI CRISPRpedia */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Visual Guide · Inspired by Open-Access CRISPR Pedagogy</span>
          </div>
          <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            What is <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400">Stem Cell CRISPR</span>—and How Does It Work?
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-300">
            Whether you are exploring DNA editing for the first time in class, designing an isogenic disease model for your PhD, or scaling 96-well automated cloning in a core facility, ASSURED Academy pairs <strong className="text-white">illustrated step-by-step molecular stories</strong> with <strong className="text-white">interactive wet-lab simulators</strong>.
          </p>
        </div>

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

        {/* Chapter 1: IGI-Style Interactive Visual Explainer */}
        <div id="visual-explainer" className="scroll-mt-20">
          <CrisprVisualExplainer />
        </div>

        {/* Chapter 2: Three-Tier Learner Architecture & Interactive Simulators */}
        <div id="persona-simulators" className="scroll-mt-20">
          <PersonaSwitcher
            activePersonaId={activePersonaId}
            onSelectPersona={setActivePersonaId}
          />
        </div>

        {/* Pedagogical Design Pillars */}
        <section aria-label="Learning areas" className="mt-14 grid md:grid-cols-3 gap-6">
          {learningAreas.map(({ title, icon: Icon, text }) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <Icon aria-hidden="true" className="w-7 h-7 text-emerald-300" />
              <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
            </article>
          ))}
        </section>

        {/* Chapter 3: 12-Lesson Structured Curriculum with Inline Glossary Popups */}
        <div id="curriculum-tracks" className="scroll-mt-20 mt-14">
          <div className="p-5 rounded-2xl border border-emerald-900 bg-emerald-950/30 max-w-3xl mb-6">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Chapter 3 · Deep-Dive Curriculum</span>
            </div>
            <h2 className="text-xl font-bold text-white">12 Interactive Lessons Across 4 Tracks</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
              Every lesson includes clickable <span className="underline decoration-dotted decoration-emerald-400 text-emerald-300">dashed-underline vocabulary terms</span>, bench tips, and a mastery quiz.
            </p>
          </div>
          <CurriculumSection />
        </div>

        {/* Chapter 4: Interactive CRISPRpedia Glossary */}
        <div id="crisprpedia-glossary" className="scroll-mt-20">
          <CrisprpediaGlossary />
        </div>

        {/* Standalone Tools & ASSURED Bench Bridge */}
        <section aria-labelledby="standalone-tools" className="mt-16 border-t border-slate-800 pt-10">
          <h2 id="standalone-tools" className="text-2xl font-bold text-white">Standalone Practice Tools</h2>
          <p className="mt-2 text-slate-400">Explore guide/donor design and Sanger chromatogram deconvolution separately for classroom demonstrations and lab practice.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <a href="/design/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-600 transition-colors focus-visible:outline focus-visible:outline-cyan-400">
              <h3 className="text-lg font-semibold text-cyan-300">Standalone Design →</h3>
              <p className="mt-2 text-sm text-slate-400">Explore guide selection, silent PAM blocking mutations, ssODN donor design, and design reports.</p>
            </a>
            <a href="/qc/" className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-emerald-600 transition-colors focus-visible:outline focus-visible:outline-emerald-400">
              <h3 className="text-lg font-semibold text-emerald-300">Standalone QC →</h3>
              <p className="mt-2 text-sm text-slate-400">Explore Sanger trace deconvolution, indel spectrum scoring, and clone zygosity classification.</p>
            </a>
          </div>
        </section>

        <section className="mt-14 border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold text-white">Ready to run your own wet-lab experiment?</h2>
          <p className="mt-2 text-slate-400">Switch to ASSURED Bench for end-to-end guide design, reagent planning, trace QC, and 96-well clone review.</p>
          <a href="/studio/" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors focus-visible:outline focus-visible:outline-cyan-400">
            Open ASSURED Bench <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </a>
        </section>
      </main>
      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        ASSURED Academy · Visual Stem Cell CRISPR Education · School &amp; College Students · Research Labs · Core Facilities
      </footer>
    </div>
  );
};

export default App;
