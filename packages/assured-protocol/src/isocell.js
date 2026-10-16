// IsoCell automated microfluidic single-cell cloning, and what comes out the other end.
//
// The chain the specification states, for a 256-chamber plate:
//   256 chambers -> ~70 chambers holding exactly one cell on day 0 -> ~46 surviving clones (~65%)
// then 96-well Bambanker cryopreservation, then 5-6 verified clones per project at ~50 vials each.

import { stated } from "./sources.js";

export const ISOCELL = Object.freeze({
  chambersPerPlate: stated(256, "chambers", "owner-stated", "PLATFORM_SPEC"),
  singleCellChambers: stated(70, "chambers", "owner-stated", "PLATFORM_SPEC", "Approximate, day 0."),
  survivingClones: stated(46, "clones", "owner-stated", "PLATFORM_SPEC", "Approximate."),
  survivalRate: stated(0.65, "", "owner-stated", "PLATFORM_SPEC", "~65%, surviving clones / single-cell chambers."),
  cryopreservation: Object.freeze({
    format: "96-well plate",
    medium: "Bambanker",
  }),
  seedbank: Object.freeze({
    clonesPerProject: stated("5-6", "verified clones", "owner-stated", "PLATFORM_SPEC"),
    vialsPerBank: stated(50, "vials", "owner-stated", "PLATFORM_SPEC"),
  }),
  claim:
    "Because roughly 46 clones survive from one plate, even a low-efficiency pool still yields the handful of correctly edited clones a project needs. That is what makes cloning from a modest pool score worth doing instead of re-editing.",
});

/**
 * Expected clones for a plate, given a pool score and the plate's own loading and survival.
 *
 * Deliberately simple and fully explicit, so a learner can check every step by hand:
 *   singleCellChambers = chambers * singleCellFraction
 *   survivors          = singleCellChambers * survivalRate
 *   edited             = survivors * poolScore
 *   homozygous         = survivors * poolScore^2      (independent alleles; an upper-bound sketch)
 *
 * The allele-independence assumption is the part that is not real biology: alleles are not
 * independent, and a pool score is a fraction of edited sequence, not a fraction of edited cells.
 * `caveats` says so, and the UI must show it.
 *
 * @param {object} input
 * @param {number} [input.chambers=256]
 * @param {number} [input.singleCellFraction]  chambers holding exactly one cell, as a fraction
 * @param {number} [input.survivalRate]        surviving clones / single-cell chambers, 0..1
 * @param {number} input.poolScore             KO or KI score of the bulk pool, 0..1
 * @param {number} [input.clonesNeeded=5]
 */
export function projectCloneYield({
  chambers = ISOCELL.chambersPerPlate.value,
  singleCellFraction = ISOCELL.singleCellChambers.value / ISOCELL.chambersPerPlate.value,
  survivalRate = ISOCELL.survivalRate.value,
  poolScore,
  clonesNeeded = 5,
} = {}) {
  const score = clamp01(poolScore);
  const singleCellChambers = chambers * clamp01(singleCellFraction);
  const survivors = singleCellChambers * clamp01(survivalRate);
  const edited = survivors * score;
  const homozygous = survivors * score * score;

  return {
    chambers,
    singleCellChambers: round1(singleCellChambers),
    survivors: round1(survivors),
    editedClones: round1(edited),
    homozygousClones: round1(homozygous),
    clonesNeeded,
    meetsTarget: edited >= clonesNeeded,
    platesForTarget: edited > 0 ? Math.ceil(clonesNeeded / edited) : null,
    caveats: [
      "A pool score is the fraction of edited sequence in the bulk trace, not the fraction of edited cells. Treating it as a per-clone probability is a planning approximation.",
      "The homozygous estimate squares the pool score, which assumes the two alleles are edited independently. They are not, so read it as a floor on a good day and not a prediction.",
      "Loading and survival are the plate's, not the protocol's. Enter your own once you have run a plate.",
    ],
  };
}

/**
 * Seedbank planning: how many vials a project owes, and how many plates that implies.
 * @param {object} input
 * @param {number} [input.clonesToBank=5]
 * @param {number} [input.vialsPerClone=50]
 * @param {number} [input.vialsPerFreezeRun=12]
 */
export function planSeedbank({ clonesToBank = 5, vialsPerClone = ISOCELL.seedbank.vialsPerBank.value, vialsPerFreezeRun = 12 } = {}) {
  const totalVials = clonesToBank * vialsPerClone;
  return {
    clonesToBank,
    vialsPerClone,
    totalVials,
    freezeRuns: Math.ceil(totalVials / vialsPerFreezeRun),
    note: "Split the vials between a master bank and a working bank so the master is never the tube a project thaws from.",
  };
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function round1(x) {
  return Math.round(x * 10) / 10;
}
