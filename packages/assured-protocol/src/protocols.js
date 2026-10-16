// The two editing protocols this platform teaches, as two named variants.
//
// They are NOT one protocol with one set of numbers. The clearest example: the Neon pulse is
// 1200 V / 30 ms / 1 pulse in ASSURED and 1200 V / 20 ms / 1 pulse in CRISPR-MiX. Merging them
// would silently break apps/academy-ui/src/data/benchDefaults.ts, which cites 30 ms to the ASSURED
// paper. Keep them apart and make the learner choose.

import { stated } from "./sources.js";

/** Alt-R S.p. HiFi Cas9 Nuclease V3 handling, shared by both protocols. */
export const NUCLEASE = Object.freeze({
  name: "Alt-R S.p. HiFi Cas9 Nuclease V3 (IDT)",
  stockConcentration: stated(10, "ug/uL", "owner-stated", "PLATFORM_SPEC"),
  aliquotVolume: stated(2, "uL", "owner-stated", "PLATFORM_SPEC", "Single-use aliquots; repeated freeze-thaw loses activity."),
  freezeThawWarning:
    "Thaw one single-use aliquot per experiment. Re-freezing and re-thawing the nuclease stock loses activity, and the loss shows up as a low pool score that looks like a bad guide.",
});

export const ASSURED = Object.freeze({
  id: "assured",
  name: "ASSURED",
  expansion: "Affordable, Successful, Specific, User-friendly, Rapid, Efficient, Deliverable",
  purpose: "Single-cell-derived knockout and SNP knock-in hiPSC clones.",
  sourceId: "ASSURED_2023",

  // Electroporation. 30 ms, not 20 ms. See the module comment.
  electroporation: Object.freeze({
    instrument: "Neon Transfection System, 10 uL kit",
    voltage: stated(1200, "V", "published", "ASSURED_2023"),
    pulseWidthMs: stated(30, "ms", "published", "ASSURED_2023"),
    pulses: stated(1, "", "published", "ASSURED_2023"),
  }),

  // Table 7 of the paper: volumes in uL per 15 uL reaction mix; R buffer is the remainder as printed.
  // Identical to apps/academy-ui/src/data/benchDefaults.ts RNP_TABLE, which stays the UI's own copy.
  rnpTableTotalUl: stated(15, "uL", "published", "ASSURED_2023"),
  rnpTable: Object.freeze({
    "1gRNA-KO": Object.freeze({ label: "1 gRNA, knockout", cas9: 0.5, gRNA1: 2, gRNA2: null, ssodn: null, rBuffer: 12.5 }),
    "2gRNA-KO": Object.freeze({ label: "2 gRNAs, knockout", cas9: 1, gRNA1: 2, gRNA2: 2, ssodn: null, rBuffer: 10 }),
    "1gRNA-KI": Object.freeze({ label: "1 gRNA, knock-in", cas9: 0.5, gRNA1: 2, gRNA2: null, ssodn: 3, rBuffer: 9.5 }),
    "2gRNA-KI": Object.freeze({ label: "2 gRNAs, knock-in", cas9: 1, gRNA1: 2, gRNA2: 2, ssodn: 3, rBuffer: 7 }),
  }),

  // Pool scores across the validated set, before single-cell cloning.
  poolScores: Object.freeze({
    loci: stated(32, "loci", "owner-stated", "PLATFORM_SPEC"),
    lines: stated(22, "hiPSC lines", "owner-stated", "PLATFORM_SPEC"),
    koMean: stated(79.5, "%", "owner-stated", "PLATFORM_SPEC"),
    koSd: stated(23, "%", "owner-stated", "PLATFORM_SPEC"),
    koMin: stated(15, "%", "owner-stated", "PLATFORM_SPEC"),
    kiMean: stated(57.5, "%", "owner-stated", "PLATFORM_SPEC"),
    kiSd: stated(27, "%", "owner-stated", "PLATFORM_SPEC"),
    kiMin: stated(10, "%", "owner-stated", "PLATFORM_SPEC"),
  }),

  deconvolution: Object.freeze({
    method: "Bulk-pool PCR at the target locus, Sanger sequencing, Synthego ICE deconvolution",
    tool: "Synthego ICE Analysis",
    url: "https://ice.synthego.com",
    note: "The pool score decides whether the pool is worth cloning. Assured QC in this repository reads the same traces and additionally calls individual clones.",
  }),

  design: Object.freeze({
    assembly: "GRCh38 (hg38)",
    recordTypes: "NCBI RefSeqGene (NG_) or Ensembl gene ID",
    knockoutRule:
      "Target an early constitutive exon that every transcript isoform shares, so a frameshift triggers nonsense-mediated decay in all isoforms.",
    knockinRule:
      "Place the 20 bp guide (NGG PAM) so that the cut falls as close as possible to the nucleotide being changed; HDR falls off quickly with distance.",
    // The engine's own limit, so the two never drift. @assured/rules is the source of truth.
    cutDistanceLimitFrom: "@assured/rules MAX_GUIDE_CUT_DISTANCE",
  }),
});

export const CRISPR_MIX = Object.freeze({
  id: "crispr-mix",
  name: "CRISPR-MiX",
  purpose:
    "Scarless, selection-free HDR with a pool of rationally designed ssODN donors, for loci where a single donor performs poorly or unpredictably.",
  sourceId: "CRISPR_MIX_2026",

  // Electroporation. 20 ms, not 30 ms. See the module comment.
  electroporation: Object.freeze({
    instrument: "Neon Transfection System",
    voltage: stated(1200, "V", "owner-stated", "PLATFORM_SPEC"),
    pulseWidthMs: stated(20, "ms", "owner-stated", "PLATFORM_SPEC"),
    pulses: stated(1, "", "owner-stated", "PLATFORM_SPEC"),
    cells: stated(0.25e6, "cells", "owner-stated", "PLATFORM_SPEC"),
    bufferVolume: stated(10, "uL R buffer", "owner-stated", "PLATFORM_SPEC"),
  }),

  rnp: Object.freeze({
    sgRNA: stated(60, "pmol", "owner-stated", "PLATFORM_SPEC"),
    cas9: stated(20, "pmol", "owner-stated", "PLATFORM_SPEC"),
    pooledSsodn: stated(120, "pmol", "owner-stated", "PLATFORM_SPEC"),
    complexingMinutes: stated(10, "min at room temperature", "owner-stated", "PLATFORM_SPEC"),
    molarRatioNote: "3:1 sgRNA to Cas9, with pooled ssODNs at twice the sgRNA.",
  }),

  // Published: arm symmetry, blocking mutations and strand complementarity are the donor design
  // parameters the paper identifies with a GFP-to-BFP reporter.
  donorDesignParameters: Object.freeze([
    Object.freeze({ key: "armSymmetry", label: "Homology-arm symmetry", provenance: "published", sourceId: "CRISPR_MIX_2026" }),
    Object.freeze({ key: "blockingMutations", label: "Cas-blocking (silent) mutations", provenance: "published", sourceId: "CRISPR_MIX_2026" }),
    Object.freeze({ key: "strand", label: "Strand complementarity (target vs non-target)", provenance: "published", sourceId: "CRISPR_MIX_2026" }),
  ]),

  recovery: "Plate into 6-well plates in E8 supplemented with CloneR2. No selection.",

  deconvolution: Object.freeze({
    day2: "gDNA with QuickExtract, amplify with PrimeSTAR GXL",
    ngs: "Amplicon-EZ deep amplicon NGS",
    quantification: "AlleleProfileR, aligned to GRCh38 (hg38)",
    flow: "MACSQuant 10 at day 5 for reporter readouts",
  }),

  // Locus behaviour. The paper applies the method to five cardiomyopathy genes; which of them are
  // refractory is attributed to the lab's specification, so it is labelled as such.
  loci: Object.freeze([
    Object.freeze({ gene: "PLN", behaviour: "responsive", note: "Pooled donors improved or matched single-donor HDR.", provenance: "owner-stated" }),
    Object.freeze({ gene: "TPM1", behaviour: "responsive", note: "Pooled donors improved or matched single-donor HDR.", provenance: "owner-stated" }),
    Object.freeze({ gene: "TNNT2", behaviour: "responsive", note: "Target-strand pooling outperformed non-target-strand pooling.", provenance: "owner-stated" }),
    Object.freeze({ gene: "KCNH2", behaviour: "refractory", note: "Resists both single and pooled ssODNs; consider excision, prime or base editing instead.", provenance: "owner-stated" }),
    Object.freeze({ gene: "RBM20", behaviour: "refractory", note: "Resists both single and pooled ssODNs; consider excision, prime or base editing instead.", provenance: "owner-stated" }),
  ]),

  boundary:
    "Pooling donors raises HDR where the limit is donor design. It does not rescue a locus whose chromatin or repair context blocks HDR outright. At a refractory locus, change modality rather than adding more donors.",
});

export const PROTOCOLS = Object.freeze({ assured: ASSURED, "crispr-mix": CRISPR_MIX });
export const PROTOCOL_IDS = Object.freeze(Object.keys(PROTOCOLS));

/** The Neon settings for one protocol, as a display string. */
export function pulseSummary(protocolId) {
  const p = PROTOCOLS[protocolId];
  if (!p) throw new Error(`Unknown protocol "${protocolId}"`);
  const e = p.electroporation;
  return `${e.voltage.value} V, ${e.pulseWidthMs.value} ms, ${e.pulses.value} pulse`;
}

/**
 * Pulse settings that differ between the two protocols. Used by the Tier 3 simulator so that
 * "wrong pulse" means "the other protocol's pulse", not an invented number.
 */
export function pulseVariants() {
  return PROTOCOL_IDS.map((id) => ({ protocolId: id, name: PROTOCOLS[id].name, summary: pulseSummary(id) }));
}

// Re-exported from @assured/rules so the Academy reads the engine's own limits rather than a copy.
// Changing them here is impossible; they are the design engine's.
export { MAX_GUIDE_CUT_DISTANCE, MIN_PAIR_CUT_SEPARATION, MAX_BLOCKING_CHANGES, LAB_CONVENTIONS } from "@assured/rules";
