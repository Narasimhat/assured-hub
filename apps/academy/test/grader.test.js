import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gradeDesign, gradePlate, gradeProject, regenerateTruth, callFromQcRow } from "../src/grader/index.js";
import { simulate } from "../src/simulator/index.js";
import { createProject, validateAcademyProject } from "../src/envelope.js";

const load = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const design = (id) => load(`../missions/${id}/design.qc-design.json`);
const key = (id) => load(`../answer-keys/${id}.key.json`);
const STRAT = { "m1-snp-apoe-r176c": "snp_hdr", "m2-ko-tagme": "deletion", "m3-tag-nr2f2-2xha": "tag_small_hdr" };
const CH = { equipment: "high_throughput", cloning: "automated_dispenser", supplement: "clone_r" };

function projectFor(id, { seed = 1234, spec = design(id), strategy = STRAT[id] } = {}) {
  const { record } = simulate(spec, CH, seed);
  return { ...createProject({ missionId: id, studentId: "S-test" }), stage: "wetlab", strategy: { choice: strategy }, design: spec, wetlab: record };
}
const withCalls = (p, fn) => { const truth = regenerateTruth(p); const calls = truth.clones.map((c) => fn(c)); return { ...p, stage: "qc", qc: { calls, selectedClone: null } }; };
const perfect = (c) => ({ clone: c.clone, call: c.call, decision: c.expected.decision });

test("each mission's reference design passes the grader with no critical findings", () => {
  for (const id of Object.keys(STRAT)) {
    const g = gradeDesign(projectFor(id), key(id));
    assert.deepEqual(g.critical, [], `${id}: ${g.checks.filter((c) => !c.pass).map((c) => c.id + " " + c.detail).join(" | ")}`);
    assert.ok(g.score >= 90, `${id}: score ${g.score}`);
  }
});

test("a single-guide design is flagged against the lab's two-guide convention (and says it is a convention)", () => {
  const spec = design("m1-snp-apoe-r176c"); spec.guides = [spec.guides[0]];
  const g = gradeDesign({ ...projectFor("m1-snp-apoe-r176c"), design: spec }, key("m1-snp-apoe-r176c"));
  const c = g.checks.find((x) => x.id === "guide-count");
  assert.equal(c.pass, false); assert.equal(c.source, "convention");
});

test("a donor with no silent blocking changes is a critical finding", () => {
  const spec = design("m1-snp-apoe-r176c"); const intended = spec.markers.filter((m) => m.role === "intended");
  spec.markers = intended;
  spec.donors = spec.donors.map((d) => { let s = spec.reference.sequence.slice(d.refStart, d.refEnd); for (const m of intended) s = s.slice(0, m.pos - d.refStart) + m.alt + s.slice(m.pos - d.refStart + 1); return { ...d, sequence: s, orderSequence: s, carriesMarkers: intended.map((m) => m.pos) }; });
  const g = gradeDesign({ ...projectFor("m1-snp-apoe-r176c"), design: spec }, key("m1-snp-apoe-r176c"));
  assert.ok(g.critical.includes("blocking-all-guides"), JSON.stringify(g.critical));
});

test("cuts beyond the engine's limit and the wrong strategy are caught", () => {
  const spec = design("m1-snp-apoe-r176c"); spec.guides.forEach((x) => { x.offsetFromEdit = 31; });
  const g = gradeDesign({ ...projectFor("m1-snp-apoe-r176c"), design: spec, strategy: { choice: "knockout" } }, key("m1-snp-apoe-r176c"));
  assert.ok(g.checks.filter((c) => c.id.startsWith("cut-distance") && !c.pass).length === 2);
  assert.equal(g.checks.find((c) => c.id === "strategy").pass, false);
});

test("a perfect plate submission scores 100 with no critical findings", () => {
  const p = withCalls(projectFor("m1-snp-apoe-r176c"), perfect);
  const best = regenerateTruth(p).clones.find((c) => c.expected.tier === "best").clone; p.qc.selectedClone = best;
  assert.equal(validateAcademyProject(p).ok, true, validateAcademyProject(p).errors.join("; "));
  const r = gradePlate(p); assert.equal(r.score, 100); assert.deepEqual(r.critical, []); assert.equal(r.selectedTier, "best");
});

test("expanding a decoy or a blocking-only clone is an unsafe expansion and a critical finding", () => {
  const p = withCalls(projectFor("m1-snp-apoe-r176c"), (c) => ({ ...perfect(c), decision: c.call === "mosaic" || c.call === "blocking_only" ? "expand" : perfect(c).decision }));
  const t = regenerateTruth(p); const bad = t.clones.find((c) => c.call === "blocking_only" || c.call === "mosaic").clone; p.qc.selectedClone = bad;
  const r = gradePlate(p);
  assert.ok(r.unsafeExpansions.length >= 1); assert.ok(r.critical.includes("unsafe-expansion")); assert.ok(r.critical.includes("unsafe-selection")); assert.ok(r.score < 100);
});

test("a project carrying a seed other than the assigned one is refused", () => {
  const p = withCalls(projectFor("m1-snp-apoe-r176c", { seed: 999 }), perfect);
  const r = gradePlate(p, { assignedSeed: 1234 });
  assert.equal(r.score, 0); assert.match(r.refused, /not the seed assigned/); assert.deepEqual(r.critical, ["seed-mismatch"]);
});

test("missing clone calls are reported, not silently scored", () => {
  const p = withCalls(projectFor("m2-ko-tagme"), perfect); p.qc.calls = p.qc.calls.slice(0, 8);
  const r = gradePlate(p); assert.ok(r.issues.some((i) => /no call submitted/.test(i))); assert.ok(r.score < 100);
});

test("gradeProject combines design and plate and lists every critical finding once", () => {
  const p = withCalls(projectFor("m3-tag-nr2f2-2xha"), perfect); p.qc.selectedClone = regenerateTruth(p).clones.find((c) => c.expected.tier === "best").clone;
  const r = gradeProject(p, key("m3-tag-nr2f2-2xha")); assert.equal(r.critical.length, 0); assert.ok(r.overall >= 95, `overall ${r.overall}`);
});

test("QC row mapping covers the engine's vocabulary", () => {
  const row = (clone_call, result, status = "analysed") => ({ clone_call, result, status });
  assert.equal(callFromQcRow(row("homozygous_edit", "Homozygous for the intended edit")), "hdr_hom");
  assert.equal(callFromQcRow(row("edit_plus_indel", "Intended edit on one allele, -4 bp indel on the other")), "hdr_het");
  assert.equal(callFromQcRow(row("heterozygous_indel", "Heterozygous: partial conversion: G532C (intended edit absent) and wild type")), "blocking_only");
  assert.equal(callFromQcRow(row("compound_heterozygous", "Compound heterozygous: -8 bp indel and -8 bp indel")), "biallelic_ko");
  assert.equal(callFromQcRow(row("homozygous_indel", "Homozygous for deletion between cuts (12 bp)")), "biallelic_ko");
  assert.equal(callFromQcRow(row("heterozygous_indel", "Heterozygous: -2 bp indel and wild type")), "het_indel");
  assert.equal(callFromQcRow(row("homozygous_wt", "Homozygous wild type (no edit detected)")), "wild_type");
  assert.equal(callFromQcRow(row("two_partials", "Two different partial conversions")), "blocking_only");
  assert.equal(callFromQcRow(row("mixed", "Mixed or unclear")), "mosaic");
  assert.equal(callFromQcRow(row("", "", "failed")), "unreadable");
});
