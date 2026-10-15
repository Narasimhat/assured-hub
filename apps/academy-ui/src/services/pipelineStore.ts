import { AssuredProject } from '../types/pipeline';
import { PRESET_PROJECTS } from '../data/generated/presets.generated';

export { PRESET_PROJECTS };

// The key is versioned. v2 held hand-typed presets (guides, ssODNs, primers and clone calls that did not match the
// real data), so a returning visitor must not keep loading them from localStorage.
const STORAGE_KEY = 'assured_workbench_projects_v3';
const RETIRED_KEYS = ['assured_workbench_projects_v2'];

const looksLikeProject = (p: unknown): p is AssuredProject => {
  const o = p as Partial<AssuredProject> | null;
  return !!o && typeof o.id === 'string' && !!o.target && Array.isArray(o.target.guides) && !!o.bench && Array.isArray(o.clones);
};

export const getStoredProjects = (): AssuredProject[] => {
  try {
    RETIRED_KEYS.forEach((k) => localStorage.removeItem(k));
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(looksLikeProject)) return parsed;
    }
  } catch (e) {
    console.error('Error loading projects from storage', e);
  }
  return PRESET_PROJECTS;
};

export const saveProjectsToStorage = (projects: AssuredProject[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving projects to storage', e);
  }
};
