import React from 'react';
import { PERSONAS } from '@assured/protocol';
import { uiFor } from '../../data/personas';

/**
 * The tier chooser. Six cards on the landing page, a compact row once a tier is open.
 * Changing tier changes which material is shown and how deeply it is explained; it does not hide
 * anything, and any tier can open any other tier's module.
 */

export const PersonaCards: React.FC<{ activeId: string | null; onChoose: (id: string) => void }> = ({ activeId, onChoose }) => (
  <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
    {PERSONAS.map((persona) => {
      const ui = uiFor(persona.id);
      const active = persona.id === activeId;
      return (
        <li key={persona.id}>
          <button
            type="button"
            aria-pressed={active}
            onClick={() => onChoose(persona.id)}
            className={`h-full w-full rounded-2xl border p-6 text-left transition-colors focus-visible:outline focus-visible:outline-cyan-400 ${
              active ? `${ui.accentBorder} ${ui.accentBg}` : 'border-slate-800 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <p className={`text-xs font-semibold uppercase tracking-widest ${ui.accentText}`}>Tier {persona.tier}</p>
            <h3 className="mt-2 text-lg font-semibold text-white">{persona.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{ui.recognise}</p>
            <p className="mt-4 text-sm text-slate-300">{persona.module}</p>
            <p className="mt-2 text-xs text-slate-500">{ui.duration}</p>
          </button>
        </li>
      );
    })}
  </ul>
);

export const PersonaBar: React.FC<{ activeId: string; onChoose: (id: string) => void }> = ({ activeId, onChoose }) => (
  <nav aria-label="Learner tier" className="flex flex-wrap gap-2">
    {PERSONAS.map((persona) => {
      const ui = uiFor(persona.id);
      const active = persona.id === activeId;
      return (
        <button
          key={persona.id}
          type="button"
          aria-pressed={active}
          onClick={() => onChoose(persona.id)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-cyan-400 ${
            active ? `${ui.accentBorder} ${ui.accentBg} ${ui.accentText}` : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
          }`}
        >
          <span className="sr-only">Tier {persona.tier}: </span>
          {persona.short}
        </button>
      );
    })}
  </nav>
);

/** The heading block every tier page opens with. */
export const PersonaHeader: React.FC<{ personaId: string; children?: React.ReactNode }> = ({ personaId, children }) => {
  const persona = PERSONAS.find((p) => p.id === personaId);
  if (!persona) return null;
  const ui = uiFor(persona.id);
  return (
    <header className="border-b border-slate-800 pb-8">
      <p className={`text-xs font-semibold uppercase tracking-widest ${ui.accentText}`}>
        Tier {persona.tier} &middot; {persona.name}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{persona.module}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">{persona.objective}</p>
      <ul className="mt-6 flex flex-wrap gap-2" aria-label="What this module covers">
        {persona.teaches.map((topic) => (
          <li key={topic} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-400">
            {topic}
          </li>
        ))}
      </ul>
      {children}
    </header>
  );
};
