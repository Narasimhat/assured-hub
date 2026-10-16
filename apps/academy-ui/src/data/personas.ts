import { PERSONAS, type Persona } from '@assured/protocol';
import { CURRICULUM_TRACKS } from './curriculum';

/**
 * UI metadata for the six learner tiers. The tier list itself lives in @assured/protocol so that a
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
  public: {
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-700',
    accentBg: 'bg-sky-950/40',
    recognise: 'You or someone close to you has a genetic diagnosis, and you want to understand what researchers are actually doing with it.',
    trackIds: ['track-1'],
    modules: [],
    duration: '25 min',
  },
  student: {
    accentText: 'text-emerald-300',
    accentBorder: 'border-emerald-700',
    accentBg: 'bg-emerald-950/40',
    recognise: 'You have had the lectures and now have to choose, for a real gene, where to cut and why.',
    trackIds: ['track-1', 'track-2', 'track-4'],
    modules: ['/workbench'],
    duration: '60 min',
  },
  bench: {
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-700',
    accentBg: 'bg-amber-950/40',
    recognise: 'You run the cells. You want the plate to work the first time and you want to know which step cost you the last one.',
    trackIds: ['track-3', 'track-1'],
    modules: ['/simulator', '/workbench'],
    duration: '45 min',
  },
  scientist: {
    accentText: 'text-violet-300',
    accentBorder: 'border-violet-700',
    accentBg: 'bg-violet-950/40',
    recognise: 'You design the study, defend it in review, and have to decide whether more donors or an isogenic pair is the better spend.',
    trackIds: ['track-2', 'track-4'],
    modules: ['/missions', '/workbench'],
    duration: '50 min',
  },
  core: {
    accentText: 'text-cyan-300',
    accentBorder: 'border-cyan-700',
    accentBg: 'bg-cyan-950/40',
    recognise: 'You run this as a service for other groups, and the questions you get asked are about turnaround, yield and release criteria.',
    trackIds: ['track-3', 'track-1'],
    modules: ['/frugal', '/tools'],
    duration: '40 min',
  },
  cgt: {
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-700',
    accentBg: 'bg-rose-950/40',
    recognise: 'You are taking an edited line toward a filing, and every claim you make has to be backed by a validated assay.',
    trackIds: ['track-4'],
    modules: ['/tools'],
    duration: '45 min',
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
