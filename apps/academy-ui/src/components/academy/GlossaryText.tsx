import React, { useState } from 'react';
import { BookOpen, Sparkles, Microscope, X, Search } from 'lucide-react';
import { IGI_GLOSSARY, GlossaryEntry } from '../../data/glossary';

interface GlossaryTextProps {
  text: string;
}

// Build a lookup of alias -> entry, sorted longest-first so multi-word terms match before short ones
const ALIAS_PAIRS: { pattern: string; entry: GlossaryEntry }[] = IGI_GLOSSARY.flatMap(entry =>
  entry.aliases.map(alias => ({ pattern: alias, entry }))
).sort((a, b) => b.pattern.length - a.pattern.length);

export const GlossaryText: React.FC<GlossaryTextProps> = ({ text }) => {
  const [activeEntry, setActiveEntry] = useState<GlossaryEntry | null>(null);

  // Tokenize text around first match of each glossary entry
  const matchedEntryIds = new Set<string>();
  const escapedPatterns = ALIAS_PAIRS.map(p => p.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedPatterns.join('|')})\\b`, 'g');

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const start = match.index;
    const found = ALIAS_PAIRS.find(p => p.pattern.toLowerCase() === word.toLowerCase());

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    if (found && !matchedEntryIds.has(found.entry.id)) {
      matchedEntryIds.add(found.entry.id);
      const entry = found.entry;
      parts.push(
        <button
          key={`${entry.id}-${start}`}
          type="button"
          onClick={() => setActiveEntry(prev => (prev?.id === entry.id ? null : entry))}
          title={`Click for CRISPRpedia definition: ${entry.term}`}
          className="inline border-b-2 border-dashed border-emerald-400/80 text-emerald-200 hover:text-white hover:border-emerald-300 font-medium px-0.5 rounded-sm transition-colors focus-visible:outline focus-visible:outline-cyan-400"
        >
          {word}
        </button>
      );
    } else {
      parts.push(word);
    }

    lastIndex = start + word.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <span className="inline">
      {parts}
      {activeEntry && (
        <span
          role="region"
          aria-label={`Definition of ${activeEntry.term}`}
          className="block my-3 p-4 rounded-xl border border-emerald-600/60 bg-slate-950 shadow-xl text-left"
        >
          <span className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                {activeEntry.category}
              </span>
              <strong className="text-sm font-bold text-white">{activeEntry.term}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveEntry(null)}
              aria-label="Close definition"
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
          <span className="grid sm:grid-cols-2 gap-3 mt-3 text-xs">
            <span className="block p-3 rounded-lg bg-emerald-950/25 border border-emerald-900/50">
              <strong className="block text-emerald-300 mb-1">In Everyday Language (CRISPR Made Simple):</strong>
              <span className="text-slate-200 leading-relaxed">{activeEntry.simpleAnalogy}</span>
            </span>
            <span className="block p-3 rounded-lg bg-cyan-950/25 border border-cyan-900/50">
              <strong className="block text-cyan-300 mb-1">Scientific Mechanism (CRISPRpedia):</strong>
              <span className="text-slate-200 leading-relaxed">{activeEntry.scientificDefinition}</span>
            </span>
          </span>
          <span className="block mt-2.5 text-[11px] text-slate-400">
            <strong className="text-slate-300">Why it matters in stem cells: </strong>
            {activeEntry.whyItMatters}
          </span>
        </span>
      )}
    </span>
  );
};

export const CrisprpediaGlossary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewStyle, setViewStyle] = useState<'both' | 'simple' | 'scientific'>('both');

  const categories = ['All', 'CRISPR Mechanism', 'Stem Cell Biology', 'Donor & Design', 'Sequencing & QC'];

  const filteredEntries = IGI_GLOSSARY.filter(entry => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      entry.term.toLowerCase().includes(q) ||
      entry.simpleAnalogy.toLowerCase().includes(q) ||
      entry.scientificDefinition.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="crisprpedia-glossary" aria-labelledby="glossary-heading" className="mt-16 scroll-mt-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <BookOpen className="w-4 h-4" />
              Interactive Vocabulary &amp; Visual Dictionary
            </span>
            <h2 id="glossary-heading" className="mt-1 text-2xl sm:text-3xl font-bold text-white">
              ASSURED CRISPRpedia Glossary
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Throughout Academy lessons, click any <span className="border-b-2 border-dashed border-emerald-400 text-emerald-200 px-1">dashed-underline term</span> for an instant popup definition, or explore the complete dual-level dictionary below.
            </p>
          </div>

          {/* Reading Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewStyle('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewStyle === 'simple'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Made Simple
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('scientific')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewStyle === 'scientific'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Technical
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewStyle === 'both'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        </div>

        {/* Category Filters & Search */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedCategory === cat
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter terms (e.g., PAM, HDR, RNP)..."
              aria-label="Filter glossary terms"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Glossary Cards Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map(entry => (
            <article
              key={entry.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-white">{entry.term}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                    {entry.category}
                  </span>
                </div>

                {(viewStyle === 'both' || viewStyle === 'simple') && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Everyday Analogy:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{entry.simpleAnalogy}</p>
                  </div>
                )}

                {(viewStyle === 'both' || viewStyle === 'scientific') && (
                  <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                      <Microscope className="w-3.5 h-3.5" />
                      <span>Molecular Definition:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{entry.scientificDefinition}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                <strong className="text-slate-200">Bench Impact: </strong>
                {entry.whyItMatters}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
