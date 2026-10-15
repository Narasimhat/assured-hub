import type { GuideRNA } from '../types/pipeline';

const COMP: Record<string, string> = { A: 'T', C: 'G', G: 'C', T: 'A' };
const revcomp = (s: string) => s.split('').reverse().map((c) => COMP[c] ?? 'N').join('');

export interface GuidePlacement {
  /** Index of the protospacer's first base on the displayed strand. */
  start: number;
  /** Index of the PAM's first base on the displayed strand (for a - strand guide the PAM lies 5' of the protospacer). */
  pamStart: number;
  /** Cut boundary: the cut falls between cut-1 and cut. */
  cut: number;
}

/** Locate a guide in the displayed window from its own sequence and strand. Returns null if it does not occur. */
export function locateGuide(window: string, g: GuideRNA): GuidePlacement | null {
  const w = window.toUpperCase();
  const seq = g.sequence.toUpperCase();
  if (g.strand === '+') {
    const i = w.indexOf(seq);
    return i < 0 ? null : { start: i, pamStart: i + 20, cut: i + 17 };
  }
  const i = w.indexOf(revcomp(seq));
  return i < 0 ? null : { start: i, pamStart: i - 3, cut: i + 3 };
}
