// Genome-wide off-target nomination and verification assays, for the Tier 6 (CGT / CMC) decision matrix.
//
// Scope note: the properties below are the assays' published design characteristics (what the assay
// measures, in what material). Sensitivity is given as a qualitative class, not a number, because
// reported sensitivities are assay-, locus- and depth-dependent and a single figure would be wrong
// more often than right. Where a quantity is stated (DNA input), it is marked as such.

import { stated } from "./sources.js";

/** "in-situ" = run in cells, captures chromatin context. "in-vitro" = cell-free on genomic DNA. */
export const ASSAY_CLASSES = Object.freeze({
  "in-situ": {
    label: "Cell-based (in situ)",
    strength: "Reads breaks in real chromatin, in the cell type you will dose. Fewer biologically irrelevant hits.",
    weakness: "Sensitivity is bounded by what happened in those cells. A rare off-target may simply not have occurred.",
  },
  "in-vitro": {
    label: "Cell-free (in vitro)",
    strength: "Naked genomic DNA, deep sampling. High sensitivity, good at nominating sites nothing else sees.",
    weakness: "No chromatin, no repair. Nominates sites that are inaccessible in a living cell, so the list needs cell-based or amplicon verification.",
  },
  verification: {
    label: "Targeted verification",
    strength: "Quantifies editing at a defined list of sites to a stated limit of detection. This is what a filing rests on.",
    weakness: "Finds nothing you did not already nominate. Never use it as the discovery step.",
  },
  structural: {
    label: "Structural rearrangement",
    strength: "Detects translocations and large rearrangements that indel-counting assays are blind to.",
    weakness: "Answers a different question from off-target indel frequency; it does not replace nomination.",
  },
});

export const ASSAYS = Object.freeze([
  Object.freeze({
    id: "guide-seq",
    name: "GUIDE-seq / E-GUIDE",
    class: "in-situ",
    principle: "A double-stranded oligodeoxynucleotide tag is captured at double-strand breaks by NHEJ and sequenced out.",
    material: "Living cells that tolerate dsODN uptake",
    sensitivity: "high",
    dnaInput: null,
    constraints: "Needs cells that take up and tolerate the dsODN. Hard in primary cells and in some hiPSC lines.",
    role: "nomination",
  }),
  Object.freeze({
    id: "discover-seq",
    name: "DISCOVER-Seq",
    class: "in-situ",
    principle: "ChIP-seq for MRE11 at repair foci; no exogenous tag is introduced.",
    material: "Living cells, including in vivo tissue",
    sensitivity: "high",
    dnaInput: null,
    constraints: "Needs a ChIP-grade antibody and enough synchronised editing to capture repair complexes.",
    role: "nomination",
    note:
      "Reported to resolve allele-specific editing and to pick up rare high-fidelity-nuclease off-targets that tag-capture methods miss — the platform specification cites a 0.75% indel site at the promiscuous VEGFA site 2 that GUIDE-seq did not report. Treat that figure as owner-stated.",
  }),
  Object.freeze({
    id: "circle-seq",
    name: "CIRCLE-seq",
    class: "in-vitro",
    principle: "Circularised genomic DNA is cleaved by the RNP; only cut circles linearise and sequence.",
    material: "Purified genomic DNA",
    sensitivity: "very-high",
    dnaInput: stated(25, "ug", "owner-stated", "PLATFORM_SPEC"),
    constraints: "High DNA input. No chromatin context, so the nominated list is long and needs verification.",
    role: "nomination",
  }),
  Object.freeze({
    id: "change-seq",
    name: "CHANGE-seq",
    class: "in-vitro",
    principle: "Tagmentation-based circularisation of genomic DNA before RNP cleavage; a higher-throughput descendant of CIRCLE-seq.",
    material: "Purified genomic DNA",
    sensitivity: "very-high",
    dnaInput: null,
    constraints: "Same cell-free caveat: nominates inaccessible sites.",
    role: "nomination",
  }),
  Object.freeze({
    id: "site-seq",
    name: "SITE-Seq",
    class: "in-vitro",
    principle: "Biochemical cleavage of genomic DNA at a range of RNP concentrations, with affinity capture of cut ends.",
    material: "Purified genomic DNA",
    sensitivity: "high",
    dnaInput: null,
    constraints: "The RNP concentration series must be reported; a single concentration under- or over-calls.",
    role: "nomination",
  }),
  Object.freeze({
    id: "digenome-seq",
    name: "Digenome-seq",
    class: "in-vitro",
    principle: "Whole-genome sequencing of RNP-digested genomic DNA; cleavage shows up as vertically aligned read ends.",
    material: "Purified genomic DNA",
    sensitivity: "moderate",
    dnaInput: null,
    constraints: "Whole-genome sequencing depth makes it the most expensive per guide.",
    role: "nomination",
  }),
  Object.freeze({
    id: "aid-seq",
    name: "AID-seq",
    class: "in-vitro",
    principle: "Low-input cell-free cleavage profiling; supports staggered-end nucleases and pooled sgRNA screening.",
    material: "Purified genomic DNA",
    sensitivity: "high",
    dnaInput: stated(2, "ug", "owner-stated", "PLATFORM_SPEC"),
    constraints: "Cell-free, so the same verification requirement applies.",
    role: "nomination",
    note: "Low DNA input and pooled sgRNA capability make it the practical choice when material is limited or many guides must be profiled.",
  }),
  Object.freeze({
    id: "pem-seq",
    name: "PEM-seq",
    class: "structural",
    principle: "Primer-extension-mediated sequencing of translocation junctions from the on-target break.",
    material: "Living cells",
    sensitivity: "high",
    dnaInput: null,
    constraints: "Reports rearrangements and translocations, not a genome-wide indel frequency table.",
    role: "structural",
  }),
  Object.freeze({
    id: "amplicon-ngs",
    name: "Targeted amplicon NGS (GLP-validated)",
    class: "verification",
    principle: "Deep sequencing of a defined panel of nominated sites, with a validated limit of detection.",
    material: "Edited cell product gDNA",
    sensitivity: "very-high at nominated sites only",
    dnaInput: null,
    constraints: "Only as good as the nomination step that produced the panel.",
    role: "verification",
  }),
]);

/** FDA 2024 / CDE 2022 / ICH Q2(R2) expectations, as the matrix's decision rules. */
export const REGULATORY_RULES = Object.freeze([
  Object.freeze({
    id: "orthogonal",
    rule: "Nominate with at least two orthogonal methods, one cell-based and one cell-free.",
    why: "The two classes fail in opposite directions. Cell-free over-nominates inaccessible sites; cell-based under-nominates what did not happen in those cells. Either alone leaves a known gap.",
    sourceId: "FDA_2024_GENOME_EDITING",
  }),
  Object.freeze({
    id: "verify",
    rule: "Verify every nominated site by targeted amplicon NGS in the actual clinical cell product.",
    why: "Nomination assays rank candidates. Only quantification in the product supports a risk statement.",
    sourceId: "FDA_2024_GENOME_EDITING",
  }),
  Object.freeze({
    id: "in-silico-insufficient",
    rule: "In-silico prediction alone does not satisfy the nomination requirement.",
    why: "Prediction misses sites with bulges and non-canonical PAMs, and over-weights seed-region mismatches.",
    sourceId: "FDA_2024_GENOME_EDITING",
  }),
  Object.freeze({
    id: "cell-type",
    rule: "Run the cell-based assay in the same cell type and genetic background as the product.",
    why: "Chromatin accessibility is cell-type specific, and the donor's own variants create and remove off-target sites.",
    sourceId: "FDA_2024_GENOME_EDITING",
  }),
  Object.freeze({
    id: "validate",
    rule: "Validate the verification assay: specificity, accuracy, precision, limit of detection, range.",
    why: "A quantitative release assay is an analytical procedure and is held to analytical validation expectations.",
    sourceId: "ICH_Q2R2",
  }),
  Object.freeze({
    id: "structural",
    rule: "Assess chromosomal rearrangements and translocations separately.",
    why: "Indel-frequency assays at nominated sites are blind to the translocations multiplexed or repeated cutting can create.",
    sourceId: "FDA_2024_GENOME_EDITING",
  }),
]);

/**
 * Recommend a nomination + verification panel for a stated situation, and say what is still missing.
 *
 * @param {object} input
 * @param {"hipsc"|"primary"|"cell-line"} [input.cellType]
 * @param {"abundant"|"limited"} [input.dnaAvailability]
 * @param {boolean} [input.multiplexed]        more than one guide, or repeated cutting
 * @param {boolean} [input.indEnabling]        destined for a regulatory filing
 */
export function recommendPanel({ cellType = "hipsc", dnaAvailability = "abundant", multiplexed = false, indEnabling = true } = {}) {
  const picked = [];
  const reasons = [];

  // Cell-based arm.
  if (cellType === "primary") {
    picked.push("discover-seq");
    reasons.push("DISCOVER-Seq needs no exogenous tag, so it works where primary cells will not take up a dsODN.");
  } else {
    picked.push("guide-seq");
    reasons.push("GUIDE-seq is the established cell-based nomination assay where the cells tolerate the dsODN tag.");
  }

  // Cell-free arm.
  if (dnaAvailability === "limited") {
    picked.push("aid-seq");
    reasons.push("AID-seq runs on about 2 ug of genomic DNA, against roughly 25 ug for CIRCLE-seq.");
  } else {
    picked.push("circle-seq");
    reasons.push("CIRCLE-seq gives the deepest cell-free nomination when DNA is not limiting.");
  }

  if (multiplexed) {
    picked.push("pem-seq");
    reasons.push("More than one simultaneous break makes translocation between cut sites a real possibility, which only a structural assay reports.");
  }

  if (indEnabling) {
    picked.push("amplicon-ngs");
    reasons.push("A filing needs quantification at every nominated site in the clinical product, by a validated assay.");
  }

  const chosen = ASSAYS.filter((a) => picked.includes(a.id));
  const gaps = [];
  if (!chosen.some((a) => a.class === "in-situ")) gaps.push("No cell-based assay: chromatin context is unrepresented.");
  if (!chosen.some((a) => a.class === "in-vitro")) gaps.push("No cell-free assay: sensitivity to rare sites is unproven.");
  if (!chosen.some((a) => a.role === "verification") && indEnabling) gaps.push("Nomination without verification does not support a risk statement.");
  if (!chosen.some((a) => a.class === "structural") && multiplexed) gaps.push("Multiplexed editing without a structural assay leaves translocations unassessed.");

  return { assays: chosen, reasons, gaps, rules: REGULATORY_RULES };
}
