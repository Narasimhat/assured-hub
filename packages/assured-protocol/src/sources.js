// Citation registry for every number this package states.
//
// Three provenance levels, and the UI must show which one a value has:
//
//   "published"    the value appears in a peer-reviewed publication listed here.
//   "owner-stated" the value comes from the ASSURED-Hub platform specification written by the lab,
//                  attributed to one of the publications below, but it was not confirmed against the
//                  published text while this package was written. Teach it; cite the paper, not this file.
//   "illustrative" a teaching default. Not measured, not published. It exists so a simulator behaves
//                  plausibly and so design quality changes the outcome. Must be visible as such to a learner.
//
// This follows docs/FINDINGS.md: the previous Academy import was audited and every unsourced number
// removed. Do not add a value here without a `provenance` and, for "published", a DOI.

/** @typedef {"published" | "owner-stated" | "illustrative"} Provenance */

export const PROVENANCE_LEVELS = Object.freeze(["published", "owner-stated", "illustrative"]);

export const PROVENANCE_LABELS = Object.freeze({
  published: "Published",
  "owner-stated": "Stated by the lab",
  illustrative: "Teaching default — not measured",
});

export const SOURCES = Object.freeze({
  ASSURED_2023: Object.freeze({
    id: "ASSURED_2023",
    short: "Ludwik et al., STAR Protocols 2023",
    citation:
      "Ludwik KA, Telugu N, Schommer S, Stachelscheid H, Diecke S. ASSURED-optimized CRISPR protocol for knockout/SNP knockin in hiPSCs. STAR Protocols. 2023;4(3):102406.",
    doi: "10.1016/j.xpro.2023.102406",
    url: "https://doi.org/10.1016/j.xpro.2023.102406",
    pmid: "37481731",
  }),
  CRISPR_MIX_2026: Object.freeze({
    id: "CRISPR_MIX_2026",
    short: "Baum et al., Mol Ther Nucleic Acids 2026",
    citation:
      "Baum R, Telugu N, Bruyneel AAN, Kay M, Nair P, Perea-Gil I, Termglinchan V, Bharucha N, Lee E, Mercola M, Diecke S, Karakikes I. CRISPR-MiX: A pooled single-stranded donor strategy to enhance HDR efficiency in human iPSCs. Molecular Therapy Nucleic Acids. 2026;37(1):102820.",
    doi: "10.1016/j.omtn.2025.102820",
    url: "https://doi.org/10.1016/j.omtn.2025.102820",
    pmid: "41674724",
  }),
  ISSCR_STANDARDS: Object.freeze({
    id: "ISSCR_STANDARDS",
    short: "ISSCR Standards for Human Stem Cell Use in Research",
    citation:
      "International Society for Stem Cell Research. ISSCR Standards for Human Stem Cell Use in Research.",
    url: "https://www.isscr.org/standards-document",
  }),
  FDA_2024_GENOME_EDITING: Object.freeze({
    id: "FDA_2024_GENOME_EDITING",
    short: "FDA Guidance (2024), human genome editing products",
    citation:
      "U.S. Food and Drug Administration. Human Gene Therapy Products Incorporating Human Genome Editing: Guidance for Industry. 2024.",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents",
  }),
  ICH_Q2R2: Object.freeze({
    id: "ICH_Q2R2",
    short: "ICH Q2(R2)",
    citation: "ICH Q2(R2): Validation of Analytical Procedures.",
    url: "https://www.ich.org/page/quality-guidelines",
  }),
  PLATFORM_SPEC: Object.freeze({
    id: "PLATFORM_SPEC",
    short: "ASSURED-Hub platform specification",
    citation:
      "ASSURED-Hub platform specification, written by the lab (MDC / BIH at Charite, Berlin). Values attributed to the publications above but not confirmed against the published text in this repository.",
  }),
  NOT_SOURCED: Object.freeze({
    id: "NOT_SOURCED",
    short: "Not sourced",
    citation:
      "No publication was located for this value when the package was written. It is exposed as an adjustable input, never as a fixed constant.",
  }),
});

/**
 * Wrap a number (or any value) with its unit and provenance so the UI can never render it bare.
 * @param {unknown} value
 * @param {string} unit  "" for a dimensionless count
 * @param {Provenance} provenance
 * @param {string} sourceId  a key of SOURCES
 * @param {string} [note]
 */
export function stated(value, unit, provenance, sourceId, note) {
  if (!PROVENANCE_LEVELS.includes(provenance)) {
    throw new Error(`Unknown provenance "${provenance}"`);
  }
  if (!Object.prototype.hasOwnProperty.call(SOURCES, sourceId)) {
    throw new Error(`Unknown source "${sourceId}"`);
  }
  return Object.freeze({ value, unit, provenance, sourceId, note });
}

/** Human-readable one-liner for a stated value, e.g. "1200 V (Published: Ludwik et al., STAR Protocols 2023)". */
export function describe(statedValue) {
  const { value, unit, provenance, sourceId } = statedValue;
  const amount = unit ? `${value} ${unit}` : String(value);
  return `${amount} (${PROVENANCE_LABELS[provenance]}: ${SOURCES[sourceId].short})`;
}

/** Every distinct source referenced by a tree of stated values, in registry order. */
export function collectSources(node, found = new Set()) {
  if (node && typeof node === "object") {
    if (typeof node.sourceId === "string" && SOURCES[node.sourceId]) found.add(node.sourceId);
    for (const child of Object.values(node)) collectSources(child, found);
  }
  return Object.keys(SOURCES).filter((id) => found.has(id)).map((id) => SOURCES[id]);
}
