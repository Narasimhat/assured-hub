// Wet-lab simulator parameters.
// ILLUSTRATIVE TEACHING DEFAULTS. These are not measured values and are not taken from the ASSURED protocol or any publication.
// They exist so a plate behaves plausibly and so design quality matters (guide-to-edit distance, silent blocking changes, number of guides).
// Replace them with the lab's own numbers (bulk editing, HDR rate, single-cell survival, polyclonality) before using plates for assessment.
export const PARAMS = Object.freeze({
  provenance: "ILLUSTRATIVE TEACHING DEFAULTS - not measured, not from the ASSURED protocol; calibrate with the lab's own data.",
  pCutPerGuide: 0.55,                                  // probability that a given guide cuts a given allele
  indel: Object.freeze({                               // NHEJ outcome at a single cut: [size, weight]; negative = deletion, positive = templated insertion
    sizes: Object.freeze([[-1, 8], [-2, 8], [-3, 6], [-4, 6], [-5, 4], [-6, 3], [-8, 3], [-10, 2], [1, 14], [2, 3]]),
    pBetweenCuts: 0.6,                                 // two guides cut the same allele: chance the segment between them is lost
  }),
  hdr: Object.freeze({ maxPerCut: 0.35, flatWithinBp: 10, decayBp: 10 }),   // HDR chance per cut is flat within ~10 bp of the edit, then decays (the engine notes HDR falls off beyond about 10 bp)
  partialConversion: Object.freeze({ base: 0.05, perBp: 0.02, max: 0.5 }),   // chance the donor's blocking changes are copied but the intended edit is not, rising with cut-to-edit distance
  recutIfUnprotected: 0.5,                             // chance a guide that is NOT blocked in the donor re-cuts an HDR allele and destroys it
  survival: Object.freeze({
    cloning: Object.freeze({ automated_dispenser: 0.5, manual_limiting_dilution: 0.25 }),
    supplement: Object.freeze({ none: 0.05, rocki: 0.8, clone_r: 1.0 }),
  }),
  polyclonal: Object.freeze({ automated_dispenser: 0.02, manual_limiting_dilution: 0.12 }),   // chance a picked "clone" is two cells' progeny
  poolReadoutNoiseSd: 3,                               // percentage points of noise on the pooled-trace editing estimate the student sees
  wellsPlated: 96, plateSize: 12,
});
