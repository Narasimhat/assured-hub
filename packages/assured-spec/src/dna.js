// DNA helpers used by the design-spec validator. Copied verbatim from Assured_QC src/seq.js (isDna, reverseComplement)
// so this package has no dependencies; Assured_QC keeps its own seq.js for the rest of its sequence code.
const COMPLEMENT = { A: "T", C: "G", G: "C", T: "A", N: "N" };

export function reverseComplement(sequence) {
  return [...String(sequence).toUpperCase()].reverse().map((base) => COMPLEMENT[base] || "N").join("");
}

export function isDna(sequence) {
  return /^[ACGT]+$/.test(String(sequence || ""));
}
