import { PERSONAS, type Persona } from '@assured/protocol';
import { CURRICULUM_TRACKS } from './curriculum';

/**
 * UI metadata for the three learner tiers. The tier list itself lives in @assured/protocol so that a
 * tier cannot exist in the UI and not in the domain layer; this file adds only presentation and the
 * mapping from a tier to the material it should see.
 */

export interface PersonaUi {
  /** Tailwind classes for the tier's accent. Kept as whole class names so Tailwind can see them. */
  accentText: string;
  accentBorder: string;
  accentBg: string;
  /** One line a learner recognises themselves in. */
  recognise: string;
  /** Curriculum track ids this tier should start with, in order. */
  trackIds: string[];
  /** Routes of the existing workbench modules this tier gets, in order. */
  modules: string[];
  /** How long the tier's own module takes, roughly. */
  duration: string;
}

export const PERSONA_UI: Record<string, PersonaUi> = {
  student: {
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-700',
    accentBg: 'bg-emerald-950/40',
    recognise:
      'You are meeting this for the first time, at school or on a degree, and you want to get from "what is a stem cell" to choosing where to cut a real gene.',
    trackIds: ['track-1', 'track-2', 'track-4'],
    modules: ['/workbench'],
    duration: '75 min',
  },
  lab: {
    accentText: 'text-violet-300',
    accentBorder: 'border-violet-700',
    accentBg: 'bg-violet-950/40',
    recognise:
      'You run the cells, design the study, or both. You want the plate to work the first time and the comparison to survive review.',
    trackIds: ['track-3', 'track-2', 'track-4'],
    modules: ['/simulator', '/missions', '/workbench'],
    duration: '90 min',
  },
  core: {
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-700',
    accentBg: 'bg-cyan-950/40',
    recognise:
      'You run this as a service for other groups, and the questions you get asked are about turnaround, yield and release criteria.',
    trackIds: ['track-3', 'track-1'],
    modules: ['/frugal', '/tools'],
    duration: '40 min',
  },
};

export const PERSONA_LIST: Persona[] = [...PERSONAS];

export function uiFor(personaId: string): PersonaUi {
  return PERSONA_UI[personaId] ?? PERSONA_UI.student;
}

export function tracksFor(personaId: string) {
  const ids = uiFor(personaId).trackIds;
  return ids
    .map((id) => CURRICULUM_TRACKS.find((track) => track.id === id))
    .filter((track): track is (typeof CURRICULUM_TRACKS)[number] => Boolean(track));
}

/** Stored tier choice, so a returning learner lands where they left off. */
const STORAGE_KEY = 'assured_persona';

export function readStoredPersona(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && PERSONAS.some((p) => p.id === value) ? value : null;
  } catch {
    return null;
  }
}

export function storePersona(personaId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, personaId);
  } catch {
    /* progress is session-only; the UI says so elsewhere */
  }
}
