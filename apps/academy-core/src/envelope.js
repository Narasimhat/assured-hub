// assured-academy-project/1: the file a student's project travels in between Stages 1-4.
// It WRAPS the existing Design -> QC contract (assured-qc-design/1, validated by @assured/spec); it does not redefine it.
// Privacy and integrity rules enforced here: pseudonymous student ids only, and no per-clone truth in a student-facing file.
import { QC_SPEC_SCHEMA, validateDesignSpec } from "@assured/spec";

export const ACADEMY_SCHEMA = "assured-academy-project/1";
export const WETLAB_SCHEMA = "assured-academy-wetlab/1";
export const STAGES = Object.freeze(["strategy", "design", "wetlab", "qc", "submitted"]);
export const STRATEGIES = Object.freeze(["knockout", "deletion", "snp_hdr", "tag_small_hdr", "tag_large_hdr", "reporter_hdr", "base_edit", "prime_edit"]);
export const CLONE_CALLS = Object.freeze(["wild_type", "het_indel", "biallelic_ko", "hdr_het", "hdr_hom", "blocking_only", "mosaic", "unreadable"]);
export const CLONE_DECISIONS = Object.freeze(["expand", "re_clone", "discard"]);
export const EQUIPMENT_TIERS = Object.freeze(["high_throughput", "frugal"]);
export const CLONING_METHODS = Object.freeze(["automated_dispenser", "manual_limiting_dilution"]);

const FORBIDDEN_KEYS = new Set(["truth", "cloneTruth", "answerKey", "alleles", "trueGenotype"]);
const EMAILISH = /@|\s/;
const stageIndex = (s) => STAGES.indexOf(s);

function walkKeys(value, visit, trail = "") {
  if (Array.isArray(value)) return value.forEach((v, i) => walkKeys(v, visit, `${trail}[${i}]`));
  if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) { visit(k, `${trail}.${k}`); walkKeys(v, visit, `${trail}.${k}`); }
}

export function createProject({ missionId, studentId, cohort = null }) {
  return { schema: ACADEMY_SCHEMA, stage: "strategy", mission: { id: missionId }, student: { id: studentId, cohort }, strategy: null, design: null, wetlab: null, qc: null };
}

/** Validate a student-facing project. `design` is checked with the same validator Assured QC uses. */
export function validateAcademyProject(project) {
  const errors = []; const warnings = []; const fail = (m) => errors.push(m);
  if (!project || typeof project !== "object") return { ok: false, errors: ["The project file is not a JSON object."], warnings };
  if (project.schema !== ACADEMY_SCHEMA) fail(`Unsupported schema "${project.schema}" (expected ${ACADEMY_SCHEMA}).`);
  const stage = stageIndex(project.stage);
  if (stage < 0) fail(`stage must be one of ${STAGES.join(", ")}.`);
  if (!project.mission || typeof project.mission.id !== "string" || !project.mission.id) fail("mission.id is required.");
  const sid = project.student && project.student.id;
  if (typeof sid !== "string" || !sid) fail("student.id is required.");
  else if (EMAILISH.test(sid)) fail("student.id must be a pseudonymous code (no names, e-mail addresses or spaces).");

  // integrity: nothing that reveals the simulated truth may travel in a student-facing file
  walkKeys(project, (key, trail) => { if (FORBIDDEN_KEYS.has(key)) fail(`${trail.slice(1)}: per-clone truth / answer keys must not be embedded in a student project.`); });

  if (stage >= 1 && !project.strategy) fail("strategy is required from the design stage on.");
  if (project.strategy && !STRATEGIES.includes(project.strategy.choice)) fail(`strategy.choice must be one of ${STRATEGIES.join(", ")}.`);

  if (stage >= 1 || project.design) {
    if (!project.design) fail("design (an assured-qc-design/1 object) is required from the design stage on.");
    else {
      if (project.design.schema !== QC_SPEC_SCHEMA) fail(`design.schema must be ${QC_SPEC_SCHEMA}.`);
      const check = validateDesignSpec(project.design);
      check.errors.forEach((e) => fail(`design: ${e}`)); check.warnings.forEach((w) => warnings.push(`design: ${w}`));
    }
  }
  if (stage >= 2 || project.wetlab) {
    const w = project.wetlab;
    if (!w) fail("wetlab record is required from the wet-lab stage on.");
    else {
      if (w.schema !== WETLAB_SCHEMA) fail(`wetlab.schema must be ${WETLAB_SCHEMA}.`);
      if (!w.choices || !EQUIPMENT_TIERS.includes(w.choices.equipment)) fail(`wetlab.choices.equipment must be one of ${EQUIPMENT_TIERS.join(", ")}.`);
      if (!w.choices || !CLONING_METHODS.includes(w.choices.cloning)) fail(`wetlab.choices.cloning must be one of ${CLONING_METHODS.join(", ")}.`);
      if (!w.outcome || !Number.isInteger(w.outcome.seed)) fail("wetlab.outcome.seed (integer) is required so the plate can be regenerated for grading.");
    }
  }
  if (stage >= 3 || project.qc) {
    const q = project.qc;
    if (!q || !Array.isArray(q.calls) || !q.calls.length) fail("qc.calls (one entry per clone) is required from the QC stage on.");
    else {
      const seen = new Set();
      q.calls.forEach((c, i) => {
        if (!c.clone || seen.has(c.clone)) fail(`qc.calls[${i}]: clone id missing or duplicated.`); seen.add(c.clone);
        if (!CLONE_CALLS.includes(c.call)) fail(`qc.calls[${i}] (${c.clone}): call must be one of ${CLONE_CALLS.join(", ")}.`);
        if (!CLONE_DECISIONS.includes(c.decision)) fail(`qc.calls[${i}] (${c.clone}): decision must be one of ${CLONE_DECISIONS.join(", ")}.`);
      });
      if (q.selectedClone && !seen.has(q.selectedClone)) fail("qc.selectedClone is not one of the called clones.");
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}
