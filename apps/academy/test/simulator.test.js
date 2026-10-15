import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDesignSpec } from "@assured/spec";
import { simulate, buildContext, sampleAllele, makeRng, PARAMS } from "../src/simulator/index.js";
import { createProject, validateAcademyProject } from "../src/envelope.js";

const load = (id) => JSON.parse(readFileSync(new URL(`../missions/${id}/design.qc-design.json`, import.meta.url)));
const GOOD = { equipment: "high_throughput", cloning: "automated_dispenser", supplement: "clone_r" };
const rate = (spec, kind, n = 20000, seed = 11) => { const ctx = buildContext(spec); const rng = makeRng(seed); let k = 0; for (let i = 0; i < n; i += 1) if (sampleAllele(ctx, rng).kind === kind) k += 1; return k / n; };

test("same seed gives an identical plate; a different seed gives a different one", () => {
  const spec = load("m1-snp-apoe-r176c");
  const a = simulate(spec, GOOD, 5), b = simulate(spec, GOOD, 5), c = simulate(spec, GOOD, 6);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.truth.clones.map((x) => x.call), c.truth.clones.map((x) => x.call));
});

test("the student-facing record carries no truth and validates inside a project", () => {
  const spec = load("m1-snp-apoe-r176c"); const { record } = simulate(spec, GOOD, 5);
  const p = { ...createProject({ missionId: "m1-snp-apoe-r176c", studentId: "S-1" }), stage: "wetlab", strategy: { choice: "snp_hdr" }, design: spec, wetlab: record };
  const r = validateAcademyProject(p); assert.equal(r.ok, true, r.errors.join("; "));
  assert.match(JSON.stringify(record), /ILLUSTRATIVE TEACHING DEFAULTS/);
});

test("every plate is conditioned to hold a best clone and a decoy, and says so", () => {
  for (const id of ["m1-snp-apoe-r176c", "m2-ko-tagme", "m3-tag-nr2f2-2xha"]) {
    const { truth } = simulate(load(id), GOOD, 20261015);
    assert.equal(truth.conditioning.satisfied, true, id);
    assert.ok(truth.clones.some((c) => c.call === truth.desired), `${id}: no best clone`);
    assert.ok(truth.clones.some((c) => c.call === "mosaic" || c.call === "blocking_only"), `${id}: no decoy`);
    for (const c of truth.clones) assert.ok(Math.abs(c.alleles.reduce((s, a) => s + a.fraction, 0) - 1) < 1e-4, `${id} ${c.clone}: fractions sum to 1`);
  }
});

test("a donor with no silent blocking changes loses most HDR alleles to re-cutting", () => {
  const ref = load("m1-snp-apoe-r176c");
  const v = structuredClone(ref); const intended = v.markers.filter((m) => m.role === "intended");
  v.markers = intended; const win = v.reference.sequence;
  v.donors = v.donors.map((d) => { let s = win.slice(d.refStart, d.refEnd); for (const m of intended) s = s.slice(0, m.pos - d.refStart) + m.alt + s.slice(m.pos - d.refStart + 1); return { ...d, sequence: s, orderSequence: s, carriesMarkers: intended.map((m) => m.pos) }; });
  assert.equal(validateDesignSpec(v).ok, true, validateDesignSpec(v).errors.join("; "));
  const good = rate(ref, "hdr_intended"), bad = rate(v, "hdr_intended");
  assert.ok(good > 0.05, `reference design should make HDR alleles (got ${good})`);
  assert.ok(bad < 0.6 * good, `unprotected design ${bad} vs protected ${good}`);
});

test("cuts far from the edit lower HDR", () => {
  const ref = load("m1-snp-apoe-r176c"); const far = structuredClone(ref);
  far.guides.forEach((g) => { g.offsetFromEdit = g.offsetFromEdit < 0 ? -25 : 28; });
  assert.ok(rate(far, "hdr_intended") < 0.5 * rate(ref, "hdr_intended"));
});

test("two guides edit more alleles than one in a knockout design", () => {
  const two = load("m2-ko-tagme"); const one = structuredClone(two); one.guides = [one.guides[0]];
  assert.equal(validateDesignSpec(one).ok, true, "the single-guide variant must be a valid design for this comparison to mean anything");
  const edited = (s) => 1 - rate(s, "wt");
  assert.ok(edited(one) < edited(two) - 0.15, `one guide ${edited(one)} vs two guides ${edited(two)}`);
});

test("bench constraints: the frugal tier has no dispenser; no growth supplement leaves almost no clones", () => {
  const spec = load("m2-ko-tagme");
  assert.throws(() => simulate(spec, { equipment: "frugal", cloning: "automated_dispenser", supplement: "clone_r" }, 1), /no single-cell dispenser/);
  const poor = simulate(spec, { equipment: "frugal", cloning: "manual_limiting_dilution", supplement: "none" }, 1);
  assert.ok(poor.record.outcome.clonesPicked < PARAMS.plateSize);
  assert.ok(poor.record.outcome.notes.length >= 1);
});
