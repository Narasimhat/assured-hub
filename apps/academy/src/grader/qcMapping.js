// Map one row of Assured QC's results.csv (the engine's own vocabulary) onto the Academy's clone-call vocabulary.
// Used to build the reference solver in demos and to measure how closely the engine recovers a simulated plate.
export function callFromQcRow(row) {
  const text = String(row.result || "").toLowerCase();
  const kind = String(row.clone_call || "");
  if (row.status && row.status !== "analysed") return "unreadable";
  if (kind === "mixed") return "mosaic";
  if (text.includes("intended edit absent") || kind === "two_partials") return "blocking_only";   // partial conversion: blocking changes copied, intended edit absent
  if (kind === "homozygous_edit") return "hdr_hom";
  if (kind === "edit_plus_indel" || kind === "heterozygous_edit" || text.startsWith("intended edit on one allele")) return "hdr_het";
  if (kind === "homozygous_indel" || kind === "compound_heterozygous") return "biallelic_ko";
  if (kind === "heterozygous_indel") return "het_indel";
  if (kind === "homozygous_wt" || text.startsWith("homozygous wild type") || text.startsWith("wild type") || kind === "wild_type" || kind === "unedited") return "wild_type";
  return "unreadable";
}
export const decisionForCall = (call, desired, hasDonor) =>
  call === desired ? "expand" : hasDonor && call === "hdr_het" ? "expand" : call === "mosaic" ? "re_clone" : "discard";
