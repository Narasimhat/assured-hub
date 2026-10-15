import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createProject, validateAcademyProject, ACADEMY_SCHEMA, WETLAB_SCHEMA } from "../src/envelope.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const design = (id) => JSON.parse(readFileSync(path.join(here, "..", "missions", id, "design.qc-design.json"), "utf8"));
const base = () => ({ ...createProject({ missionId: "m1-snp-apoe-r176c", studentId: "S-0042", cohort: "DEMO-2026" }) });

test("a fresh project at the strategy stage is valid", () => {
  assert.deepEqual(validateAcademyProject(base()), { ok: true, errors: [], warnings: [] });
});

test("design stage embeds a real exported design and validates it with the shared validator", () => {
  const p = { ...base(), stage: "design", strategy: { choice: "snp_hdr" }, design: design("m1-snp-apoe-r176c") };
  const r = validateAcademyProject(p); assert.equal(r.ok, true, r.errors.join("; "));
  const broken = structuredClone(p); broken.design.reference.sequence = "ACGTNX";
  const rb = validateAcademyProject(broken);
  assert.equal(rb.ok, false); assert.ok(rb.errors.some((e) => /^design: .*A, C, G and T only/.test(e)), rb.errors.join("; "));
});

test("wrong schema, missing ids and e-mail style student ids are refused", () => {
  assert.equal(validateAcademyProject({ ...base(), schema: "x/1" }).ok, false);
  assert.equal(validateAcademyProject({ ...base(), mission: {} }).ok, false);
  const r = validateAcademyProject({ ...base(), student: { id: "ada@example.org" } });
  assert.ok(r.errors.some((e) => /pseudonymous/.test(e)));
});

test("per-clone truth cannot travel in a student-facing project", () => {
  const p = { ...base(), stage: "wetlab", strategy: { choice: "snp_hdr" }, design: design("m1-snp-apoe-r176c"),
    wetlab: { schema: WETLAB_SCHEMA, choices: { equipment: "frugal", cloning: "manual_limiting_dilution" }, outcome: { seed: 7, cloneTruth: [] } } };
  const r = validateAcademyProject(p);
  assert.ok(r.errors.some((e) => /wetlab\.outcome\.cloneTruth/.test(e) && /truth/.test(e)), r.errors.join("; "));
});

test("qc stage needs one call and decision per clone, with known vocabulary", () => {
  const p = { ...base(), stage: "qc", strategy: { choice: "snp_hdr" }, design: design("m1-snp-apoe-r176c"),
    wetlab: { schema: WETLAB_SCHEMA, choices: { equipment: "high_throughput", cloning: "automated_dispenser" }, outcome: { seed: 7 } },
    qc: { calls: [{ clone: "A01", call: "hdr_hom", decision: "expand" }, { clone: "A01", call: "wild_type", decision: "discard" }, { clone: "A02", call: "maybe", decision: "expand" }], selectedClone: "Z9" } };
  const r = validateAcademyProject(p);
  assert.ok(r.errors.some((e) => /duplicated/.test(e)));
  assert.ok(r.errors.some((e) => /call must be one of/.test(e)));
  assert.ok(r.errors.some((e) => /selectedClone/.test(e)));
});
