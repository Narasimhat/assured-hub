import test from "node:test";
import assert from "node:assert/strict";
import { loadSpec, loadTrace } from "./helpers.js";
import { locateGuide } from "../src/nucleases.js";
import { planTasks } from "../src/quick.js";
import {
  splitFasta, splitGuides, checkGuide, checkDonor, checkManual, toPlanInput, redistributeGuides, redistributeDonors, previewManual, MAX_DONOR_NT,
} from "../src/manualInput.js";

// Real data: the APOE R176C design fixture and its control trace (a 760-base read inside the 1,070-base design reference).
const apoe = loadSpec("apoe_r176c_snp"); const control = loadTrace("apoe_control.ab1"); const ref = apoe.reference.sequence;
const offset = ref.indexOf(control.calls.slice(100, 160)) - 100; // where the read starts in the design reference
const edit = apoe.markers.find((m) => m.role === "intended"); const blocking = apoe.markers.filter((m) => m.role === "blocking");
const donorWith = (positions, from, to) => { const s = ref.split(""); positions.forEach((p) => { s[p] = apoe.markers.find((m) => m.pos === p).alt; }); return s.slice(from, to).join(""); };
// two ssODNs for one SNP knock-in: both carry the edit, each carries the blocking change of its own guide
const A = donorWith([edit.pos, blocking[0].pos], edit.pos - 60, edit.pos + 60); const B = donorWith([edit.pos, blocking[blocking.length - 1].pos], edit.pos - 60, edit.pos + 60);
const G = apoe.guides.map((g) => g.spacer);
const pairs = [{ sample: "s1", edited: ["e.ab1"], control: ["c.ab1"], type: "clone", confidence: "sheet" }];

test("the fixture is what the tests assume", () => {
  assert.ok(offset > 0 && offset + control.calls.length <= ref.length, `read offset ${offset}`);
  assert.equal(G.length, 2); assert.ok(A.length === 120 && B.length === 120 && A !== B);
});

test("splitFasta: records with names, plain text as one record, nothing as one empty record", () => {
  const r = splitFasta(">ssODN A\nACGT\nACGT\n>ssODN B\r\nTTTT\n");
  assert.deepEqual(r.map((x) => x.name), ["ssODN A", "ssODN B"]); assert.equal(r[0].text.replace(/\s/g, ""), "ACGTACGT"); assert.equal(r[1].text.replace(/\s/g, ""), "TTTT");
  assert.deepEqual(splitFasta("ACGT\nACGT").map((x) => x.name), [""]); assert.equal(splitFasta("").length, 1); assert.equal(splitFasta("")[0].text, "");
});

test("splitGuides: commas, semicolons, lines and long space-separated pieces separate; short groups of one sequence stay together", () => {
  assert.deepEqual(splitGuides(`${G[0]}, ${G[1]}`), G); assert.deepEqual(splitGuides(`${G[0]};${G[1]}`), G); assert.deepEqual(splitGuides(`${G[0]}\n${G[1]}`), G);
  assert.deepEqual(splitGuides(`${G[0]} ${G[1]}`), G); // how guides were typed in the old single-line box
  assert.equal(splitGuides("ACGTAACGTA CGTAACGTAC").length, 1); assert.equal(splitGuides(">name\nACGTAACGTAACGTAACGTA").length, 1); assert.equal(splitGuides("   ").length, 0);
});

test("checkGuide: tidies pasted text, reads RNA, and reports bad letters instead of dropping them", () => {
  const plain = checkGuide(G[0]); assert.equal(plain.sequence, G[0]); assert.deepEqual(plain.errors, []); assert.deepEqual(plain.notes, []);
  const messy = checkGuide(` 1 ${G[0].toLowerCase().slice(0, 10)} \n 11 ${G[0].toLowerCase().slice(10)} `); assert.equal(messy.sequence, G[0]); assert.deepEqual(messy.errors, []);
  const rna = checkGuide(G[0].replace(/T/g, "U")); assert.equal(rna.sequence, G[0]); assert.match(rna.notes.join(" "), /U was read as T/);
  const iupac = checkGuide(G[0].slice(0, 10) + "R" + G[0].slice(11)); assert.match(iupac.errors.join(" "), /R is not a DNA base/); // not silently shortened to 19 nt
  assert.match(checkGuide(G[0].slice(0, 5) + "N" + G[0].slice(6)).errors.join(" "), /N cannot be matched/);
  assert.match(checkGuide("ACGTACGT").errors.join(" "), /8 nt: a SpCas9 \(NGG\) gRNA is 17-24 nt/); assert.match(checkGuide(G[0] + "ACGTAC").errors.join(" "), /26 nt/);
  assert.match(checkGuide(G[0], "SaCas9").errors.join(" ") || "ok", /ok/); // 20 nt is within SaCas9's 20-24 range
  assert.match(checkGuide(G[0].slice(0, 18), "SaCas9").errors.join(" "), /gRNA is 20-24 nt/);
});

test("a SpCas9 gRNA pasted with its PAM has the PAM removed, because the planner would otherwise put the cut 3 bp off", () => {
  const pasted = G[0] + apoe.guides[0].pam; const checked = checkGuide(pasted);
  assert.equal(checked.sequence, G[0]); assert.match(checked.notes.join(" "), /followed by its PAM \(AGG\); the PAM was removed/);
  const bare = locateGuide(control.calls, G[0]); const raw = locateGuide(control.calls, pasted);
  assert.equal(Math.abs(bare.cut - raw.cut), 3, "without the check the cut moves by 3"); assert.equal(raw.pamOk, false);
  assert.equal(previewManual({ control, guides: [checked.sequence] }).guides[0].cut, bare.cut);
  assert.equal(checkGuide(pasted, "SpRY").sequence, pasted, "only SpCas9 is stripped; a PAM-free nuclease keeps what it is given");
});

test("checkDonor: names from FASTA, any case, size limits, bad letters", () => {
  const named = checkDonor(`>my ssODN\n${A.toLowerCase()}`); assert.equal(named.name, "my ssODN"); assert.equal(named.sequence, A); assert.deepEqual(named.errors, []);
  assert.match(checkDonor("A".repeat(MAX_DONOR_NT + 1)).errors.join(" "), /301 nt is longer than 300 nt/); assert.deepEqual(checkDonor("ACGT".repeat(MAX_DONOR_NT / 4)).errors, []);
  assert.match(checkDonor("ACGTACGTAC").errors.join(" "), /too short/); assert.match(checkDonor(A.slice(0, 50) + "Y" + A.slice(51)).errors.join(" "), /Y is not a DNA base/);
});

test("checkManual: nothing entered, rows map to messages, duplicates and the three-gRNA limit are caught", () => {
  assert.deepEqual({ ...checkManual({ guideRows: [{ text: "" }, { text: "  " }], donorRows: [{ name: "", text: "" }] }), guides: undefined, donors: undefined }, { entered: false, ready: true, guides: undefined, donors: undefined, problems: [] });
  const ok = checkManual({ guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "A", text: A }] }); assert.equal(ok.ready, true); assert.deepEqual(ok.guides.map((g) => g.row), [0, 1]); assert.equal(ok.donors[0].name, "A");
  const rc = G[1].split("").reverse().map((b) => ({ A: "T", C: "G", G: "C", T: "A" }[b])).join("");
  const dup = checkManual({ guideRows: [{ text: G[1] }, { text: G[1] }, { text: rc }] }); assert.equal(dup.ready, false);
  assert.match(dup.guides[1].errors.join(" "), /Same gRNA as gRNA 1\./); assert.match(dup.guides[2].errors.join(" "), /reverse complement/);
  const four = checkManual({ guideRows: ["ACACTGCCAGGCGCTTCTGC", "CCCCGGCCTGGTACACTGCC", "GACTGCCAGGCGCTTCTGCA", "TTCTGCAGGCCGGACCTGAA"].map((text) => ({ text })) }); assert.equal(four.ready, false); assert.match(four.problems.join(" "), /At most 3 gRNAs/);
  const twin = checkManual({ donorRows: [{ name: "", text: A }, { name: "", text: A }] }); assert.match(twin.donors[1].notes.join(" "), /Identical to donor 1/); assert.equal(twin.ready, true);
  const bad = checkManual({ guideRows: [{ text: "ACGT" }], donorRows: [{ name: "", text: A }] }); assert.equal(bad.ready, false); assert.equal(bad.entered, true);
  const multi = checkManual({ donorRows: [{ name: "", text: `>one\n${A}\n>two\n${B}` }] }); assert.deepEqual(multi.donors.map((d) => [d.row, d.name]), [[0, "one"], [0, "two"]]);
});

test("toPlanInput: one donor stays a plain sequence, two or more become a named list, bad entries are left out", () => {
  const one = toPlanInput(checkManual({ guideRows: [{ text: G[0] }], donorRows: [{ name: "", text: A }] })); assert.deepEqual(one, { guides: [G[0]], donor: A });
  const two = toPlanInput(checkManual({ guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "ssODN A", text: A }, { name: "", text: B }] }));
  assert.deepEqual(two.guides, G); assert.deepEqual(two.donor, [{ name: "ssODN A", sequence: A }, { name: "donor 2", sequence: B }]);
  assert.deepEqual(toPlanInput(checkManual({ donorRows: [{ name: "", text: A }, { name: "", text: A }] })).donor, A, "a repeated donor is used once");
  assert.deepEqual(toPlanInput(checkManual({ guideRows: [{ text: "ACGT" }, { text: G[0] }] })), { guides: [G[0]], donor: "" });
  assert.deepEqual(toPlanInput(checkManual({})), { guides: [], donor: "" });
});

test("redistributeGuides and redistributeDonors: a pasted list or FASTA fills one row per entry; ordinary typing changes one row", () => {
  assert.deepEqual(redistributeGuides([{ text: "" }, { text: "x" }], 0, "AC"), [{ text: "AC" }, { text: "x" }]);
  assert.deepEqual(redistributeGuides([{ text: "" }, { text: "x" }], 0, `${G[0]}, ${G[1]}`), [{ text: G[0] }, { text: G[1] }, { text: "x" }]);
  const rows = redistributeDonors([{ name: "", text: "" }], 0, `>ssODN A\n${A}\n>ssODN B\n${B}\n`); assert.deepEqual(rows.map((r) => r.name), ["ssODN A", "ssODN B"]); assert.equal(rows[1].text, B);
  assert.deepEqual(redistributeDonors([{ name: "n", text: "" }], 0, "ACGT"), [{ name: "n", text: "ACGT" }]);
  // one pasted record stays as typed (a ">" cannot be removed while someone is typing); its name still reaches the analysis from the header
  const single = redistributeDonors([{ name: "", text: "" }], 0, `>only one\n${A}`); assert.equal(single.length, 1);
  assert.equal(checkManual({ donorRows: single }).donors[0].name, "only one"); assert.equal(checkManual({ donorRows: single }).donors[0].sequence, A);
});

test("preview on the real control: two gRNAs and two ssODNs are placed, the shared change is the intended edit", () => {
  const p = previewManual({ control, guides: G, donor: [{ name: "ssODN A", sequence: A }, { name: "ssODN B", sequence: B }] });
  assert.equal(p.ok, true, p.error); assert.deepEqual(p.warnings, []); assert.equal(p.classified, true);
  assert.deepEqual(p.guides.map((g) => [g.strand, g.pam, g.pamOk, g.cut + offset]), apoe.guides.map((g) => [g.strand, g.pam, true, g.cut]));
  assert.deepEqual(p.markers.map((m) => [m.pos + offset, m.role]), [[blocking[0].pos, "blocking"], [edit.pos, "intended"], [blocking[blocking.length - 1].pos, "blocking"]]);
  assert.match(p.markers.find((m) => m.role === "intended").label, /^C\d+T$/);
  assert.deepEqual(p.donors.map((d) => [d.name, d.length, d.orientation, d.carries.map((x) => x + offset)]), [["ssODN A", 120, "as entered", [blocking[0].pos, edit.pos]], ["ssODN B", 120, "as entered", [edit.pos, blocking[blocking.length - 1].pos]]]);
});

test("preview: a donor entered in the opposite orientation is placed and reported as reverse complement", () => {
  const rcA = A.split("").reverse().map((b) => ({ A: "T", C: "G", G: "C", T: "A" }[b])).join("");
  const p = previewManual({ control, guides: G, donor: rcA }); assert.equal(p.ok, true, p.error); assert.match(p.donors[0].orientation, /reverse complement/);
  assert.deepEqual(p.markers.map((m) => m.pos), previewManual({ control, guides: G, donor: A }).markers.map((m) => m.pos));
});

test("preview: one donor leaves the changes unclassified, which the screen explains", () => {
  const p = previewManual({ control, guides: G, donor: A }); assert.equal(p.ok, true, p.error); assert.equal(p.classified, false);
  assert.ok(p.markers.length > 0 && p.markers.every((m) => m.role === "unclassified"));
});

test("preview: errors from the planner come back as text, not exceptions", () => {
  const missing = previewManual({ control, guides: ["GATTACAGATTACAGATTACA"] }); assert.equal(missing.ok, false); assert.match(missing.error, /was not found in the control sequence/);
  const none = previewManual({ control, guides: [] }); assert.equal(none.ok, false); assert.match(none.error, /Enter at least one guide sequence/);
});

test("end to end through planTasks: two ssODNs typed in separate boxes are both used, where one joined box failed", () => {
  const input = toPlanInput(checkManual({ guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "", text: A }, { name: "", text: B }] }));
  const planned = planTasks({ pairs, getTrace: () => control, design: { kind: "none" }, ...input }); assert.deepEqual(planned.problems, []);
  assert.equal(planned.tasks[0].spec.donors.length, 2); assert.equal(planned.tasks[0].spec.guides.length, 2);
  const joined = planTasks({ pairs, getTrace: () => control, design: { kind: "none" }, guides: G, donor: (A + "\n" + B).replace(/\s+/g, "") }); // what the single donor box did
  assert.equal(joined.tasks.length, 0); assert.match(joined.problems.join(" "), /homology arm/);
});

test("planTasks lets typed gRNAs override a loaded design report; the screen therefore ignores typed entries while a design is loaded", () => {
  const report = { kind: "report", guides: [G[0]], donors: [{ name: "x", sequence: A, recommended: true }], protein: [] };
  const typed = planTasks({ pairs, getTrace: () => control, design: report, guides: [G[1]], donor: "" });
  assert.equal(typed.tasks[0].spec.guides[0].spacer, G[1], "the typed gRNA replaces the report's");
  const plain = planTasks({ pairs, getTrace: () => control, design: report, guides: [], donor: "" });
  assert.equal(plain.tasks[0].spec.guides[0].spacer, G[0], "with nothing typed the report's gRNA is used");
});
