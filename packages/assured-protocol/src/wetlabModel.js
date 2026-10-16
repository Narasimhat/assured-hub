// The Tier 3 wet-lab simulator's scoring model.
//
// ILLUSTRATIVE TEACHING MODEL. Every penalty below is a teaching default: a plausible magnitude
// chosen so that the ranking of mistakes is right and the mechanism is memorable. None of them is a
// measured effect size, and the model must never be presented as a prediction of a real run.
// This mirrors apps/academy-core/src/simulator/params.js, which carries the same warning.
//
// What IS sourced: the starting point (the ASSURED mean pool scores and the IsoCell survival rate)
// and the design limits, which are read from @assured/rules so they cannot drift from the engine.

import { MAX_GUIDE_CUT_DISTANCE, LAB_CONVENTIONS } from "@assured/rules";
import { ASSURED } from "./protocols.js";
import { ISOCELL } from "./isocell.js";
import { CULTURE_DEVIATIONS } from "./culture.js";

export const MODEL_PROVENANCE =
  "ILLUSTRATIVE TEACHING MODEL - penalties are not measured effect sizes. The baseline pool scores and IsoCell survival rate are the protocol's; everything applied to them is a teaching default.";

/**
 * Each entry multiplies the baseline. `editing` hits the pool score, `survival` hits the fraction of
 * single-cell chambers that produce a clone. A factor of 1 means that axis is untouched.
 */
export const PENALTIES = Object.freeze({
  normoxia: Object.freeze({ editing: 0.85, survival: 0.8, severity: "major" }),
  warmGeltrex: Object.freeze({ editing: 0.9, survival: 0.75, severity: "major" }),
  noRecoveryMedium: Object.freeze({ editing: 1.0, survival: 0.6, severity: "major" }),
  noCloneR2: Object.freeze({ editing: 1.0, survival: 0.2, severity: "critical" }),
  refrozenCas9: Object.freeze({ editing: 0.55, survival: 1.0, severity: "critical" }),
  wrongPulse: Object.freeze({ editing: 0.5, survival: 0.7, severity: "critical" }),
});

export const SEVERITY_ORDER = Object.freeze(["critical", "major", "minor"]);

/** Baselines, from the protocol rather than from this file. */
export function baseline(editKind) {
  const isKnockout = editKind === "knockout";
  const p = ASSURED.poolScores;
  return {
    poolScore: (isKnockout ? p.koMean.value : p.kiMean.value) / 100,
    poolScoreSd: (isKnockout ? p.koSd.value : p.kiSd.value) / 100,
    survivalRate: ISOCELL.survivalRate.value,
    sourceId: "PLATFORM_SPEC",
  };
}

/**
 * Score one simulated run.
 *
 * @param {object} run
 * @param {"knockout"|"knockin"} run.editKind
 * @param {string[]} [run.deviations]   keys of PENALTIES that the learner chose wrongly
 * @param {number} [run.guideCount=2]
 * @param {number} [run.cutToEditBp]    knock-in only: |cut - edit| in bp
 * @param {boolean} [run.donorBlocksAllGuides=true]  knock-in only
 * @param {number} [run.chambers=256]
 */
export function scoreRun({
  editKind = "knockout",
  deviations = [],
  guideCount = 2,
  cutToEditBp = 0,
  donorBlocksAllGuides = true,
  chambers = ISOCELL.chambersPerPlate.value,
} = {}) {
  const isKnockin = editKind === "knockin";
  const base = baseline(editKind);
  const findings = [];

  let editing = 1;
  let survival = 1;

  const unknown = deviations.filter((key) => !PENALTIES[key]);
  if (unknown.length) throw new Error(`Unknown deviation(s): ${unknown.join(", ")}`);

  for (const key of [...new Set(deviations)]) {
    const penalty = PENALTIES[key];
    const info = CULTURE_DEVIATIONS.find((d) => d.key === key);
    editing *= penalty.editing;
    survival *= penalty.survival;
    findings.push({
      key,
      severity: penalty.severity,
      label: info ? info.question : key,
      chose: info ? info.deviation : key,
      shouldBe: info ? info.correct : "",
      editingFactor: penalty.editing,
      survivalFactor: penalty.survival,
      mechanism: info ? info.mechanism : "",
    });
  }

  // Design quality. These limits come from the engine, not from this file.
  const minGuides = LAB_CONVENTIONS.minGuides[isKnockin ? "snp" : "knockout"];
  if (guideCount < minGuides) {
    const factor = 0.7;
    editing *= factor;
    findings.push({
      key: "tooFewGuides",
      severity: "major",
      label: "Number of guides",
      chose: `${guideCount} guide${guideCount === 1 ? "" : "s"}`,
      shouldBe: `${minGuides} guides (lab convention)`,
      editingFactor: factor,
      survivalFactor: 1,
      mechanism:
        "One guide gives one chance to cut each allele. A second guide at the same target raises the odds that both alleles are cut, which is what turns a heterozygous pool into one that yields homozygous clones.",
    });
  }

  if (isKnockin) {
    const distance = Math.abs(Number(cutToEditBp) || 0);
    if (distance > MAX_GUIDE_CUT_DISTANCE) {
      const factor = 0.35;
      editing *= factor;
      findings.push({
        key: "cutTooFar",
        severity: "critical",
        label: "Guide cut to edit distance",
        chose: `${distance} bp`,
        shouldBe: `at most ${MAX_GUIDE_CUT_DISTANCE} bp (design engine limit)`,
        editingFactor: factor,
        survivalFactor: 1,
        mechanism:
          "HDR converts the bases near the break. The further the cut is from the nucleotide you want changed, the more often the donor's silent blocking changes are copied while the intended edit is not — a clone that looks edited on the trace and is not.",
      });
    } else if (distance > 10) {
      const factor = 0.75;
      editing *= factor;
      findings.push({
        key: "cutFar",
        severity: "minor",
        label: "Guide cut to edit distance",
        chose: `${distance} bp`,
        shouldBe: "as close to the edit as the PAM allows",
        editingFactor: factor,
        survivalFactor: 1,
        mechanism: "Within the engine's limit, but conversion already falls off past about 10 bp. Expect more partial conversions.",
      });
    }

    if (!donorBlocksAllGuides) {
      const factor = 0.5;
      editing *= factor;
      findings.push({
        key: "donorNotBlocking",
        severity: "critical",
        label: "Silent blocking changes in the donor",
        chose: "Donor does not block every guide",
        shouldBe: "Donor carries silent blocking changes for all guides (lab convention)",
        editingFactor: factor,
        survivalFactor: 1,
        mechanism:
          "An allele repaired from a donor that still matches the guide gets cut again. The HDR product you worked for is destroyed by the nuclease that is still in the cell, and the allele ends up as an indel.",
      });
    }
  }

  const poolScore = clamp01(base.poolScore * editing);
  const survivalRate = clamp01(base.survivalRate * survival);
  const singleCellChambers = chambers * (ISOCELL.singleCellChambers.value / ISOCELL.chambersPerPlate.value);
  const survivors = singleCellChambers * survivalRate;
  const editedClones = survivors * poolScore;

  findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return {
    editKind,
    baseline: { poolScorePercent: round1(base.poolScore * 100), survivorsAtBaseline: round1(singleCellChambers * base.survivalRate) },
    poolScorePercent: round1(poolScore * 100),
    survivalPercent: round1(survivalRate * 100),
    singleCellChambers: round1(singleCellChambers),
    survivingClones: round1(survivors),
    editedClones: round1(editedClones),
    meetsBenchmark: survivors >= ISOCELL.survivingClones.value * 0.9,
    benchmarkClones: ISOCELL.survivingClones.value,
    findings,
    verdict: verdictFor(editedClones, survivors, findings),
    provenance: MODEL_PROVENANCE,
  };
}

function verdictFor(editedClones, survivors, findings) {
  if (survivors < 5) return { level: "failed", text: "Too few clones survived to screen. Fix the survival problems before spending a sequencing run." };
  if (editedClones < 1) return { level: "failed", text: "Clones survived, but almost none carry the edit. The editing step, not the cloning step, is what failed." };
  if (editedClones < 5) return { level: "marginal", text: "A plate this size is unlikely to give the 5 verified clones a project needs. Expect to run a second plate." };
  if (findings.length === 0) return { level: "good", text: "Protocol conditions throughout. This is the plate the protocol is built to produce." };
  return { level: "acceptable", text: "Enough edited clones to screen, but the deviations below cost you clones that you paid for in reagents and time." };
}

function clamp01(x) {
  return Math.min(1, Math.max(0, Number(x) || 0));
}
function round1(x) {
  return Math.round(x * 10) / 10;
}
