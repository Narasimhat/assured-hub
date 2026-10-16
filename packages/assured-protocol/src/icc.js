// Donor variance and why unmatched donor lines are not a control.
//
// The claim the Academy teaches: when a large share of transcriptomic variance sits between donors,
// adding two or three more unmatched donors buys almost no power to attribute a phenotype to a
// variant. The isogenic pair does, because the comparison is within one genome.
//
// IMPORTANT: the specific dataset quoted in the platform specification (median donor ICC 43.2% over
// 9,013 protein-coding genes in 51 donors) could not be located in the literature when this file was
// written. It is therefore NOT a constant here. Median ICC is an argument with a default and a
// range, the UI exposes it as a slider, and the teaching point is shown to hold across the range.

import { stated } from "./sources.js";

export const ICC_REFERENCE = Object.freeze({
  medianIcc: stated(0.432, "", "owner-stated", "PLATFORM_SPEC", "Median donor ICC quoted in the platform specification; source not located, treat as a starting value."),
  genes: stated(9013, "protein-coding genes", "owner-stated", "PLATFORM_SPEC"),
  donors: stated(51, "donors", "owner-stated", "PLATFORM_SPEC"),
  fractionAbove20: stated(0.9, "", "owner-stated", "PLATFORM_SPEC", "Share of expressed genes with donor ICC above 20%."),
  fractionAbove50: stated(0.35, "", "owner-stated", "PLATFORM_SPEC", "Share exceeding 50%."),
  caution:
    "No publication was found for this exact statistic. Related published work puts between-individual contributions to iPSC phenotypes in a broad range. Move the slider: the conclusion does not depend on the exact value.",
});

/**
 * Effective sample size under clustering, the standard design-effect correction.
 *
 *   designEffect = 1 + (m - 1) * ICC        m = lines (or replicates) per donor
 *   nEffective   = (donors * m) / designEffect
 *
 * With a high ICC, extra clones from the same donor add almost nothing (the design effect eats them),
 * and the effective n is bounded by the number of donors. That is the whole argument, in one formula.
 *
 * @param {object} input
 * @param {number} input.donors
 * @param {number} [input.linesPerDonor=1]
 * @param {number} input.icc  0..1
 */
export function effectiveN({ donors, linesPerDonor = 1, icc }) {
  const m = Math.max(1, Number(linesPerDonor) || 1);
  const n = Math.max(0, Number(donors) || 0);
  const rho = clamp01(icc);
  const designEffect = 1 + (m - 1) * rho;
  const total = n * m;
  return {
    donors: n,
    linesPerDonor: m,
    totalSamples: total,
    icc: rho,
    designEffect: round2(designEffect),
    effectiveN: round2(total / designEffect),
  };
}

/**
 * Compare three designs at the same ICC and the same total number of sequenced samples.
 *
 * The isogenic arm is modelled as ICC 0 between the pair members, because the pair shares a genome:
 * donor variance cannot contribute to a within-pair difference. Subline-to-subline variance still
 * exists and is not modelled; `caveats` says so.
 *
 * @param {object} input
 * @param {number} [input.icc]
 * @param {number} [input.totalSamples=6]
 */
export function compareDesigns({ icc = ICC_REFERENCE.medianIcc.value, totalSamples = 6 } = {}) {
  const rho = clamp01(icc);
  const n = Math.max(2, Math.floor(totalSamples));

  const unmatchedOne = effectiveN({ donors: 1, linesPerDonor: n, icc: rho });
  const unmatchedThree = effectiveN({ donors: 3, linesPerDonor: Math.max(1, Math.floor(n / 3)), icc: rho });
  const isogenic = effectiveN({ donors: 1, linesPerDonor: n, icc: 0 });

  return {
    icc: rho,
    totalSamples: n,
    designs: [
      {
        id: "unmatched-1",
        label: "1 patient donor vs 1 unrelated control",
        effectiveN: unmatchedOne.effectiveN,
        designEffect: unmatchedOne.designEffect,
        verdict: "Any difference is confounded with the two genetic backgrounds. Nothing separates variant from background.",
      },
      {
        id: "unmatched-3",
        label: "3 patient donors vs 3 unrelated controls",
        effectiveN: unmatchedThree.effectiveN,
        designEffect: unmatchedThree.designEffect,
        verdict:
          "Three unmatched donors per arm is still three draws from a highly variable population. At this ICC the gain over one donor is small, and the result is usually read as if it were conclusive.",
      },
      {
        id: "isogenic",
        label: "Isogenic pair: edited and unedited clones from one parental line",
        effectiveN: isogenic.effectiveN,
        designEffect: isogenic.designEffect,
        verdict:
          "Donor background is held constant by construction, so a difference is attributable to the edit. This is the comparison the ASSURED pipeline exists to make cheap.",
      },
    ],
    caveats: [
      "ICC 0 for the isogenic arm models the genome being shared, not the clones being identical. Subline-to-subline and clone-to-clone variance is real and is not in this model; block on subline in the analysis (limma-voom with duplicateCorrelation) rather than assuming it away.",
      "An isogenic pair proves the edit causes the difference in that background. It does not show the effect generalises across backgrounds. Pair it with orthogonal evidence: eQTL colocalisation, patient biofluids, proteomics, or a pooled village design.",
      "Effective n is a design-effect calculation, not a power curve. It tells you what extra samples buy, not what effect size you can detect.",
    ],
  };
}

/** Points for plotting effective n against donor count, at a fixed ICC and lines per donor. */
export function effectiveNCurve({ icc, linesPerDonor = 3, maxDonors = 12 } = {}) {
  const points = [];
  for (let donors = 1; donors <= maxDonors; donors += 1) {
    points.push({ donors, ...effectiveN({ donors, linesPerDonor, icc }) });
  }
  return points;
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function round2(x) {
  return Math.round(x * 100) / 100;
}
