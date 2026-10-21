// Manual entry for Trace Analysis: gRNA and donor sequences typed or pasted by the user instead of a design file.
// Pure functions, no DOM. The checks run as the user types. previewManual() runs the planner the analysis itself uses
// (specFromControl) on the control trace, so the user sees where each gRNA lands and what each donor changes before analysing.
import { cleanDna, reverseComplement } from "./seq.js";
import { NUCLEASES, nucleaseOrDefault } from "./nucleases.js";
import { specFromControl } from "./manualSpec.js";

export const MAX_GUIDES = 3; // specFromControl accepts at most three guides
export const MAX_DONOR_NT = 300; // a larger insert cannot be quantified by Sanger deconvolution (the junction check needs a design file)
export const MIN_DONOR_NT = 30; // shorter than this cannot be placed on the read reliably

/** Split pasted text into FASTA records. Text with no ">" line is one unnamed record. */
export function splitFasta(text) {
  const records = []; let current = null;
  for (const line of String(text || "").split(/\r?\n/)) {
    if (line.trim().startsWith(">")) { current = { name: line.trim().slice(1).trim(), text: "" }; records.push(current); continue; }
    if (!current) { if (!line.trim()) continue; current = { name: "", text: "" }; records.push(current); }
    current.text += `${line}\n`;
  }
  return records.length ? records : [{ name: "", text: "" }];
}

/**
 * Split a gRNA box into separate gRNAs. Commas, semicolons and line breaks separate; so does white space when every piece is at least 17 nt
 * (a gRNA is 17-24 nt, while the groups of a copied GenBank sequence are 10 nt or fewer and stay together). FASTA header lines are dropped.
 */
export function splitGuides(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => !line.trim().startsWith(">"));
  const pieces = lines.join("\n").split(/[,;\n]+/).map((piece) => piece.trim()).filter(Boolean);
  const out = [];
  for (const piece of pieces) {
    const tokens = piece.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every((token) => cleanDna(token).length >= 17)) out.push(...tokens); else out.push(piece);
  }
  return out;
}

// Numbering, spaces, hyphens and line breaks from copy and paste are ignored. Any other letter is reported, never dropped silently.
function readSequence(raw) {
  const letters = String(raw || "").replace(/[\s\d\-*.]/g, "").toUpperCase();
  const invalid = [...new Set(letters.replace(/[ACGTUN]/g, "").split("").filter(Boolean))];
  return { sequence: cleanDna(letters), invalid, rna: letters.includes("U") };
}

function baseProblems({ sequence, invalid, rna }, notes, errors) {
  if (invalid.length) errors.push(`${invalid.join(", ")} ${invalid.length === 1 ? "is" : "are"} not a DNA base (use A, C, G, T, or U for RNA).`);
  if (sequence.includes("N")) errors.push("N cannot be matched against the trace; give the exact bases.");
  if (rna) notes.push("U was read as T.");
}

/** One gRNA entry. Returns { sequence, length, notes, errors }. A SpCas9 gRNA pasted together with its PAM (20 nt + NGG) has the PAM removed. */
export function checkGuide(raw, nucleaseName = "SpCas9") {
  const key = nucleaseOrDefault(nucleaseName); const nuclease = NUCLEASES[key]; const notes = []; const errors = [];
  const read = readSequence(raw); baseProblems(read, notes, errors);
  let sequence = read.sequence;
  // Without this a 23-mer would be placed as a 23-nt spacer and the cut would be called 3 bp too far along.
  if (key === "SpCas9" && sequence.length === 23 && nuclease.pam.test(sequence.slice(20))) { notes.push(`Read as a 20-nt gRNA followed by its PAM (${sequence.slice(20)}); the PAM was removed.`); sequence = sequence.slice(0, 20); }
  const [lo, hi] = nuclease.spacer;
  if (sequence && !errors.length && (sequence.length < lo || sequence.length > hi)) errors.push(`${sequence.length} nt: a ${nuclease.label} gRNA is ${lo}-${hi} nt.`);
  return { sequence, length: sequence.length, notes, errors };
}

/** One donor entry (a FASTA header, if present, gives its name). Returns { name, sequence, length, notes, errors }. */
export function checkDonor(raw) {
  const record = splitFasta(raw)[0]; const notes = []; const errors = [];
  const read = readSequence(record.text); baseProblems(read, notes, errors);
  const { sequence } = read;
  if (!errors.length && sequence.length > MAX_DONOR_NT) errors.push(`${sequence.length} nt is longer than ${MAX_DONOR_NT} nt: Sanger deconvolution cannot quantify an insert that large. Use a design file and the junction check.`);
  if (!errors.length && sequence && sequence.length < MIN_DONOR_NT) errors.push(`${sequence.length} nt is too short to place on the trace; a donor is at least ${MIN_DONOR_NT} nt.`);
  return { name: record.name, sequence, length: sequence.length, notes, errors };
}

/**
 * Check every entry. `guideRows` are { text }, `donorRows` are { name, text }; a row that holds several gRNAs or FASTA records is split.
 * Returns { entered, ready, guides, donors, problems }; every guide and donor carries the index of its `row` so a screen can show the message beside it.
 */
export function checkManual({ guideRows = [], donorRows = [], nuclease = "SpCas9" }) {
  const guides = []; const donors = []; const problems = [];
  guideRows.forEach((row, rowIndex) => {
    if (!String(row?.text || "").trim()) return;
    splitGuides(row.text).forEach((piece) => guides.push({ row: rowIndex, ...checkGuide(piece, nuclease) }));
  });
  donorRows.forEach((row, rowIndex) => {
    if (!String(row?.text || "").trim()) return;
    splitFasta(row.text).forEach((record) => {
      if (!record.text.trim()) return;
      const checked = checkDonor(`${record.name ? `>${record.name}\n` : ""}${record.text}`);
      donors.push({ row: rowIndex, ...checked, name: checked.name || String(row.name || "").trim() });
    });
  });
  guides.forEach((g, i) => {
    if (!g.sequence || g.errors.length) return;
    const same = guides.findIndex((h, j) => j < i && !h.errors.length && (h.sequence === g.sequence || h.sequence === reverseComplement(g.sequence)));
    if (same >= 0) g.errors.push(`Same gRNA as gRNA ${same + 1}${guides[same].sequence === g.sequence ? "" : " (its reverse complement)"}.`);
  });
  donors.forEach((d, i) => {
    if (!d.sequence || d.errors.length) return;
    const same = donors.findIndex((e, j) => j < i && !e.errors.length && e.sequence === d.sequence);
    if (same >= 0) d.notes.push(`Identical to donor ${same + 1}; it adds nothing and is used once.`);
  });
  if (guides.length > MAX_GUIDES) problems.push(`At most ${MAX_GUIDES} gRNAs are supported (${guides.length} entered).`);
  const errored = guides.some((g) => g.errors.length) || donors.some((d) => d.errors.length) || problems.length > 0;
  return { entered: guides.length + donors.length > 0, ready: !errored, guides, donors, problems };
}

/** What planTasks takes: gRNA sequences, and the donor as one sequence (the established path) or, for two or more, a list used together. */
export function toPlanInput(checked) {
  const guides = checked.guides.filter((g) => g.sequence && !g.errors.length).map((g) => g.sequence);
  const seen = new Set(); const donors = [];
  checked.donors.filter((d) => d.sequence && !d.errors.length).forEach((d) => { if (!seen.has(d.sequence)) { seen.add(d.sequence); donors.push(d); } });
  if (donors.length <= 1) return { guides, donor: donors[0] ? donors[0].sequence : "" };
  return { guides, donor: donors.map((d, i) => ({ name: d.name || `donor ${i + 1}`, sequence: d.sequence })) };
}

/** Rows after `value` was typed into guide row `index`: a pasted list becomes one row per gRNA. */
export function redistributeGuides(rows, index, value) {
  const parts = splitGuides(value);
  if (parts.length <= 1) return rows.map((row, i) => (i === index ? { ...row, text: value } : row));
  return [...rows.slice(0, index), ...parts.map((text) => ({ text })), ...rows.slice(index + 1)];
}

/** Rows after `value` was typed into donor row `index`: pasted FASTA with several records becomes one row per record. */
export function redistributeDonors(rows, index, value) {
  const records = splitFasta(value).filter((record) => record.text.trim() || record.name);
  if (records.length <= 1 || !String(value).includes(">")) return rows.map((row, i) => (i === index ? { ...row, text: value } : row));
  return [...rows.slice(0, index), ...records.map((record) => ({ name: record.name, text: record.text.trim() })), ...rows.slice(index + 1)];
}

/**
 * Place the entered sequences on a parsed control trace with the same planner the analysis uses, and describe the result for a person.
 * Positions are the report's: counted along the control read, the first base being 0 (a change is written like G533T).
 */
export function previewManual({ control, guides = [], donor = "", nuclease = "SpCas9" }) {
  const built = specFromControl({ control, guides, donor, nuclease });
  if (built.error) return { ok: false, error: built.error };
  const spec = built.spec; const pamTest = NUCLEASES[nucleaseOrDefault(nuclease)].pam;
  const markers = spec.markers.map((m) => ({ pos: m.pos, label: `${m.ref}${m.pos}${m.alt}`, role: m.role || "unclassified" }));
  return {
    ok: true, warnings: built.warnings || [], editKind: spec.design.editKind, summary: spec.design.label,
    guides: spec.guides.map((g) => ({ name: g.name, spacer: g.spacer, strand: g.strand, pam: g.pam, pamOk: pamTest.test(g.pam || ""), cut: g.cut })),
    donors: spec.donors.map((d, i) => ({ name: d.name || `donor ${i + 1}`, length: d.sequence.length, orientation: d.orientation, arm5: d.arm5, arm3: d.arm3, insertBp: d.insertBp || 0, replacedBp: d.replacedBp || 0, carries: d.carriesMarkers || spec.markers.map((m) => m.pos) })),
    markers,
    // Roles exist only when two or more donors share a change; one donor leaves them unclassified (see alleleLibrary: "intended edit present/absent" needs an intended marker).
    classified: markers.some((m) => m.role === "intended"),
  };
}
