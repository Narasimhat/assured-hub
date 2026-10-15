import React from 'react';
import { BookOpen, GraduationCap, FlaskConical, ArrowRight } from 'lucide-react';

const learningAreas = [
  { title: 'Learn the foundations', icon: BookOpen, text: 'Understand the concepts behind genome editing, experimental controls, and interpreting evidence.' },
  { title: 'Train with guided examples', icon: FlaskConical, text: 'Build confidence through worked examples and practice scenarios before moving to your own experiments.' },
  { title: 'Teach and assess', icon: GraduationCap, text: 'Support structured teaching with learning objectives, discussion topics, and opportunities to check understanding.' },
];

export const App: React.FC = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
    <header className="border-b border-slate-800">
      <nav aria-label="Main navigation" className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <a href="../" className="font-bold text-lg text-white focus-visible:outline focus-visible:outline-cyan-400">ASSURED</a>
        <div className="flex items-center gap-6 text-sm">
          <span aria-current="page" className="text-emerald-300">Academy</span>
          <a href="../studio/" className="text-slate-300 hover:text-white focus-visible:outline focus-visible:outline-cyan-400">Genome Studio</a>
        </div>
      </nav>
    </header>
    <main className="max-w-6xl mx-auto px-6 py-14 sm:py-20">
      <p className="text-sm font-semibold tracking-widest uppercase text-emerald-300">Teaching · Training · Learning</p>
      <h1 className="mt-5 text-4xl sm:text-6xl font-bold tracking-tight">Assured Academy</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">A learning space for understanding genome editing and building experimental judgment.</p>
      <div className="mt-10 p-5 rounded-2xl border border-emerald-900 bg-emerald-950/30 max-w-2xl">
        <h2 className="font-semibold text-emerald-200">Learning overview</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">Academy's curriculum and training activities are being reorganized around the learning areas below. This page is an overview for now.</p>
      </div>
      <section aria-label="Learning areas" className="mt-12 grid md:grid-cols-3 gap-6">
        {learningAreas.map(({ title, icon: Icon, text }) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-7">
            <Icon aria-hidden="true" className="w-7 h-7 text-emerald-300" />
            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{text}</p>
          </article>
        ))}
      </section>
      <section className="mt-14 border-t border-slate-800 pt-8">
        <h2 className="text-xl font-semibold">Ready to work on an experiment?</h2>
        <p className="mt-2 text-slate-400">Use Genome Studio for design, reagent planning, trace QC, and clone review.</p>
        <a href="../studio/" className="inline-flex items-center gap-2 mt-5 text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-cyan-400">Open Genome Studio <ArrowRight aria-hidden="true" className="w-4 h-4" /></a>
      </section>
    </main>
    <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">ASSURED Academy · Teaching, training, and learning</footer>
  </div>
);

export default App;
