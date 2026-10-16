// The three learner tiers, as data. The UI reads this; nothing else defines the tier list.
//
// `route` is the hash route the Academy UI mounts the tier's own page at.
// `depth` drives the persona switcher: how much a shared explanation expands for this tier.
//
// An earlier draft had six tiers, including a patient/public tier and a CGT industry tier. The
// material from both was kept and folded in rather than deleted: the patient-journey timeline,
// glossary and ethics open the student tier, because that is the right reading level for school
// pupils, and the off-target assay matrix sits in the research-lab tier, because choosing what
// off-target evidence to generate is the PI's decision. The GMP, CMC and IND-filing material was
// dropped, since no tier here is an industry audience.

export const DEPTHS = Object.freeze({ foundational: 1, analytical: 2, operational: 3 });

export const PERSONAS = Object.freeze([
  Object.freeze({
    id: "student",
    tier: 1,
    name: "School & college students",
    short: "Students",
    route: "/tier/student",
    depth: DEPTHS.foundational,
    objective: "Understand what a stem cell model is, then read a gene well enough to choose where to cut.",
    module: "Stem cells, genome structure & CRISPR design",
    teaches: [
      "What a stem cell model is, from blood draw to beating heart cell",
      "Somatic versus germline editing, and the ethics that follow",
      "RefSeqGene and Ensembl records on GRCh38, and what a coordinate means",
      "Constitutive versus alternative exons across transcript isoforms",
      "Knockout: early constitutive exon, frameshift, nonsense-mediated decay",
      "Knock-in: cut as close to the edited base as the PAM allows",
      "Reading a Sanger trace and a deconvolution score",
    ],
    jargonPolicy: "Every technical term is expanded on first use and listed in the glossary.",
  }),
  Object.freeze({
    id: "lab",
    tier: 2,
    name: "Research labs: PhD students, postdocs & PIs",
    short: "Research labs",
    route: "/tier/lab",
    depth: DEPTHS.analytical,
    objective:
      "Run the protocol without the deviations that quietly cost a plate, and design a study that can actually attribute a phenotype to a variant.",
    module: "Bench execution, experimental power & refractory loci",
    teaches: [
      "Geltrex cold chain, hypoxic culture, and CloneR2 at single-cell cloning",
      "RNP assembly, single-use HiFi Cas9 aliquots, and the Neon pulse for your protocol",
      "Donor variance, effective sample size, and why three unmatched donors is not a control",
      "CRISPR-MiX: pooled ssODNs, strand choice, and where pooling stops helping",
      "Refractory loci, and when to change modality instead of adding donors",
      "RNA-seq design: blocking on subline, variance partitioning, XCI erosion",
      "Which off-target assay answers which question",
    ],
  }),
  Object.freeze({
    id: "core",
    tier: 3,
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
