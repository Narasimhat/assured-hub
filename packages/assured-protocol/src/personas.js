// The six learner tiers, as data. The UI reads this; nothing else defines the tier list.
//
// `route` is the hash route the Academy UI mounts the tier's own module at.
// `depth` drives the persona switcher: how much a shared lesson expands for this tier.

export const DEPTHS = Object.freeze({ plain: 1, foundational: 2, procedural: 3, analytical: 4, operational: 5, regulatory: 6 });

export const PERSONAS = Object.freeze([
  Object.freeze({
    id: "public",
    tier: 1,
    name: "Laypersons & patient advocates",
    short: "Patients & public",
    route: "/tier/public",
    depth: DEPTHS.plain,
    objective: "Understand what a stem cell model is, how an edit corrects a mutation, and where the ethical lines sit.",
    module: "Stem cell & gene editing foundations",
    teaches: [
      "Pluripotency and self-renewal, without jargon",
      "Blood draw to hiPSC: integration-free Sendai reprogramming",
      "What CRISPR actually changes in a genome, and what it does not",
      "Somatic versus germline editing, and why only one is on the table",
    ],
    jargonPolicy: "Every technical term is expanded on first use and listed in the glossary.",
  }),
  Object.freeze({
    id: "student",
    tier: 2,
    name: "Undergraduate & graduate students",
    short: "Students",
    route: "/tier/student",
    depth: DEPTHS.foundational,
    objective: "Read a gene's structure well enough to choose where to cut, for a knockout and for a point edit.",
    module: "Genomic architecture & CRISPR design lab",
    teaches: [
      "RefSeqGene and Ensembl records on GRCh38, and what a coordinate means",
      "Constitutive versus alternative exons across transcript isoforms",
      "Knockout: early constitutive exon, frameshift, nonsense-mediated decay",
      "Knock-in: cut as close to the edited base as the PAM allows",
      "Reading a Sanger trace and a deconvolution score",
    ],
  }),
  Object.freeze({
    id: "bench",
    tier: 3,
    name: "Wet-lab bench users & technicians",
    short: "Bench",
    route: "/tier/bench",
    depth: DEPTHS.procedural,
    objective: "Execute the protocol without the deviations that quietly cost a plate.",
    module: "The interactive ASSURED wet-lab simulator",
    teaches: [
      "Geltrex cold chain, and why a warm pipette ruins a coating",
      "Hypoxic culture at 5% oxygen",
      "E8 to StemFlex, and CloneR2 at single-cell cloning",
      "RNP assembly and single-use HiFi Cas9 aliquots",
      "Neon pulse settings, per protocol",
      "IsoCell loading and what a plate should yield",
    ],
  }),
  Object.freeze({
    id: "scientist",
    tier: 4,
    name: "Principal scientists & disease modellers",
    short: "Scientists",
    route: "/tier/scientist",
    depth: DEPTHS.analytical,
    objective: "Design a study that can actually attribute a phenotype to a variant, and edit loci that resist HDR.",
    module: "Experimental power, CRISPR-MiX & multi-omics",
    teaches: [
      "Donor variance, effective sample size, and why three unmatched donors is not a control",
      "Isogenic comparison plus orthogonal clinical evidence",
      "CRISPR-MiX: pooled ssODNs, strand choice, and where pooling stops helping",
      "Refractory loci and when to change modality",
      "RNA-seq design: blocking on subline, variance partitioning",
      "X-chromosome inactivation erosion in female lines",
    ],
  }),
  Object.freeze({
    id: "core",
    tier: 5,
    name: "Pluripotent stem cell core facilities",
    short: "Core facilities",
    route: "/tier/core",
    depth: DEPTHS.operational,
    objective: "Run the pipeline as a service: predictable yields, traceable banks, ISSCR-compliant release.",
    module: "High-throughput operations, IsoCell cloning & ISSCR compliance",
    teaches: [
      "IsoCell yield planning from chambers to banked vials",
      "96-well Bambanker cryopreservation and master/working bank architecture",
      "The ISSCR five tenets as a release checklist",
      "STR identity, mycoplasma, G-banding, SNP array",
      "XCI erosion monitoring in female lines",
    ],
  }),
  Object.freeze({
    id: "cgt",
    tier: 6,
    name: "CGT industry & CMC professionals",
    short: "CGT & CMC",
    route: "/tier/cgt",
    depth: DEPTHS.regulatory,
    objective: "Build an off-target package and a manufacturing story that survives a regulatory review.",
    module: "Translational manufacturing & regulatory off-target qualification",
    teaches: [
      "Orthogonal nomination: cell-based versus cell-free, and why both",
      "Targeted amplicon NGS verification and analytical validation",
      "Structural rearrangement assessment",
      "Xeno-free and GMP-compatible reagent substitution",
      "Donor somatic memory: cord blood, fibroblast, T-cell-derived",
    ],
  }),
]);

export const PERSONA_IDS = Object.freeze(PERSONAS.map((p) => p.id));

export function getPersona(id) {
  return PERSONAS.find((p) => p.id === id) || null;
}

/**
 * Rewrite one explanation for a tier. The caller supplies the variants it has; this picks the
 * closest one at or below the tier's depth, so a partial set still renders something sensible.
 *
 * @param {Record<string, string>} variants  keyed by persona id
 * @param {string} personaId
 */
export function explainFor(variants, personaId) {
  if (variants[personaId]) return variants[personaId];
  const target = getPersona(personaId);
  if (!target) return variants.student || Object.values(variants)[0] || "";
  const ordered = [...PERSONAS].sort((a, b) => Math.abs(a.depth - target.depth) - Math.abs(b.depth - target.depth));
  for (const p of ordered) if (variants[p.id]) return variants[p.id];
  return "";
}
