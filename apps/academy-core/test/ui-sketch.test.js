import baseTest from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// designEngine.ts is imported as TypeScript, which Node strips natively from 22.18. On older Node these tests are skipped with a reason.
let mod = null, skipReason = false;
try { mod = await import("../../academy-ui/src/utils/designEngine.ts"); } catch (e) { skipReason = `needs Node >= 22.18 to import TypeScript (running ${process.version}): ${e.code || e.message}`; }
const { runTeachingDesign, getReverseComplement, DONOR_LENGTH } = mod || {};
const test = (name, fn) => baseTest(name, { skip: skipReason }, fn);

// Ground truth: the APOE window verified against GRCh38 (data/verification_grch38.csv); the edit is a C>T at design position 539.
const apoe = JSON.parse(readFileSync(new URL("../data/designs/apoe_r176c_run.reconstructed.design.json", import.meta.url)));
const REF = apoe.reference.sequence, EDIT = 539, C0 = 150, A = EDIT - C0;
const win = REF.slice(A, A + 300); // 300 nt, edit at index 150 (the dialog accepts 100-500 nt)
const req = { gene: "APOE", diseaseName: "x", sequence: win, mode: "SNP_KNOCKIN", editPosition: C0, altBase: "T" };

test("guides sit exactly where their strand and PAM say (checked against the reference, not the engine's own arithmetic)", () => {
  const t = runTeachingDesign(req);
  assert.ok(t.guides.length >= 1);
  for (const g of t.guides) {
    assert.equal(g.sequence.length, 20); assert.match(g.pam, /^[ACGT]GG$/);
    const site = g.strand === "+" ? win.indexOf(g.sequence) : win.indexOf(getReverseComplement(g.sequence));
    assert.ok(site >= 0, `${g.name} spacer must occur in the window on its stated strand`);
    const pam = g.strand === "+" ? win.slice(site + 20, site + 23) : getReverseComplement(win.slice(site - 3, site));
    assert.equal(pam, g.pam);
    const cut = g.strand === "+" ? site + 17 : site + 3;
    assert.equal(g.cutDistanceToEdit, Math.abs(cut - C0));
  }
});

test("donors are 127 nt, differ from the reference only at the edit, and put 36 nt on the PAM-distal side of the cut", () => {
  const t = runTeachingDesign(req);
  assert.ok(t.donors.length >= 1);
  for (const d of t.donors) {
    const g = t.guides.find((x) => x.name === d.forGuide);
    assert.equal(d.sequence.length, DONOR_LENGTH);
    const sense = d.strand === "-" ? getReverseComplement(d.sequence) : d.sequence; // back to the pasted strand
    const at = win.indexOf(sense.slice(0, 20));
    assert.ok(at >= 0, "the donor must be a window substring apart from the edit (the edit is >= 21 nt from either donor end)");
    const diffs = [...sense].flatMap((c, k) => (c !== win[at + k] ? [at + k] : []));
    assert.deepEqual(diffs, [C0], "only the intended base differs");
    assert.equal(sense[C0 - at], "T");
    const site = g.strand === "+" ? win.indexOf(g.sequence) : win.indexOf(getReverseComplement(g.sequence));
    const cut = g.strand === "+" ? site + 17 : site + 3;
    const distal = g.strand === "+" ? cut - at : at + 127 - cut, proximal = 127 - distal;
    assert.equal(distal, 36); assert.equal(proximal, 91);
    assert.equal(d.strand, g.strand === "+" ? "-" : "+", "template is the non-PAM strand");
    assert.equal(d.arm5Length + d.arm3Length, 127);
  }
});

test("it never claims a blocking change it did not design", () => {
  const t = runTeachingDesign(req);
  for (const d of t.donors) assert.match(d.blockingChanges, /^(none needed: the edit itself disrupts|not designed here)/);
  assert.equal(t.primers, undefined, "no primers are invented");
  assert.ok(t.guides.every((g) => g.efficiencyScore === undefined && g.offTargetScore === undefined), "no scores are invented");
});

test("a window too short for the donor yields a note, not padding", () => {
  const short = win.slice(135, 195); // 60 nt, edit now at index 15
  const t = runTeachingDesign({ ...req, sequence: short, editPosition: 15 });
  assert.equal(t.donors.length, 0);
  assert.ok(t.notes.some((n) => /no donor/.test(n)));
  assert.ok(!/G{10,}/.test(t.donor.sequence));
});

test("bad input fails loudly", () => {
  assert.throws(() => runTeachingDesign({ ...req, sequence: "ACGT".repeat(5) }), /at least 50/);
  assert.throws(() => runTeachingDesign({ ...req, sequence: "A".repeat(60), editPosition: 10 }), /No NGG/);
  assert.throws(() => runTeachingDesign({ ...req, refBase: "G" }), /not G/);
  assert.throws(() => runTeachingDesign({ ...req, altBase: "C" }), /equals the reference/);
  assert.throws(() => runTeachingDesign({ ...req, editPosition: 500 }), /between 0 and/);
});

test("the complement shown under the sequence is aligned (plain complement), not reversed", () => {
  const t = runTeachingDesign(req);
  assert.equal(t.complementSequence3to5.length, t.targetSequence5to3.length);
  assert.equal(t.complementSequence3to5[0], { A: "T", C: "G", G: "C", T: "A" }[t.targetSequence5to3[0]]);
});

test("on the APOE window the sketch independently picks the two guides the lab actually used", () => {
  const t = runTeachingDesign(req);
  assert.deepEqual(t.guides.map((g) => g.sequence).sort(), apoe.guides.map((g) => g.spacer).sort());
});
