// Grade a student's clone calls and decisions against the plate truth.
// The truth is REGENERATED from the project (design + bench choices + seed) with the same deterministic simulator, so no answer key
// has to travel with a student file. If the roster assigned a seed, pass it in: a project whose seed differs is refused.
import { simulate } from "../simulator/index.js";
import { gradeDesign } from "./gradeDesign.js";

export function regenerateTruth(project) {
  const w = project.wetlab; return simulate(project.design, w.choices, w.outcome.seed).truth;
}

export function gradePlate(project, { assignedSeed = null, truth = null } = {}) {
  const issues = [];
  if (assignedSeed !== null && project.wetlab.outcome.seed !== assignedSeed) return { score: 0, refused: `seed ${project.wetlab.outcome.seed} is not the seed assigned to this student (${assignedSeed})`, perClone: [], critical: ["seed-mismatch"] };
  const t = truth || regenerateTruth(project);
  const calls = new Map((project.qc.calls || []).map((c) => [c.clone, c]));
  const perClone = t.clones.map((c) => {
    const s = calls.get(c.clone);
    return { clone: c.clone, truth: c.call, expectedDecision: c.expected.decision, tier: c.expected.tier, submittedCall: s ? s.call : null, submittedDecision: s ? s.decision : null,
      callCorrect: !!s && s.call === c.call, decisionCorrect: !!s && s.decision === c.expected.decision,
      unsafeExpansion: !!s && s.decision === "expand" && c.expected.decision !== "expand" };
  });
  const missing = perClone.filter((p) => p.submittedCall === null).map((p) => p.clone);
  if (missing.length) issues.push(`no call submitted for ${missing.join(", ")}`);
  const n = perClone.length || 1;
  const callScore = perClone.filter((p) => p.callCorrect).length / n;
  const decisionScore = perClone.filter((p) => p.decisionCorrect).length / n;
  const bestClones = t.clones.filter((c) => c.expected.tier === "best").map((c) => c.clone);
  const sel = project.qc.selectedClone || null; const selTruth = sel ? t.clones.find((c) => c.clone === sel) : null;
  const selectionScore = !bestClones.length ? (sel ? 0 : 1) : selTruth ? (selTruth.expected.tier === "best" ? 1 : selTruth.expected.tier === "acceptable" ? 0.5 : 0) : 0;
  const unsafe = perClone.filter((p) => p.unsafeExpansion).map((p) => p.clone);
  const critical = []; if (unsafe.length) critical.push("unsafe-expansion"); if (sel && selTruth && !["best", "acceptable"].includes(selTruth.expected.tier)) critical.push("unsafe-selection");
  const score = Math.round(100 * (0.4 * callScore + 0.3 * decisionScore + 0.3 * selectionScore));
  return { score, breakdown: { callScore, decisionScore, selectionScore, weights: { calls: 0.4, decisions: 0.3, selection: 0.3, note: "pedagogical weights, not a rule" } },
    bestClones, selected: sel, selectedTier: selTruth ? selTruth.expected.tier : null, unsafeExpansions: unsafe, critical, issues, perClone,
    conditioning: t.conditioning };
}

export function gradeProject(project, key, options = {}) {
  const design = gradeDesign(project, key); const plate = gradePlate(project, options);
  return { overall: Math.round(0.5 * design.score + 0.5 * plate.score), design, plate, critical: [...design.critical, ...plate.critical] };
}
