// Build a student-facing project from a QC-processed plate.
// usage: node make-submission.mjs <plateDir> <designPath> <missionId> <studentId> <strategy> <mode> <out.json>
//   mode "reads-qc"  : calls = Assured QC's readout (mapped), expands the clones that meet the goal, selects QC's rank-1 clone
//   mode "picks-decoy": same calls, but expands and selects a clone QC flagged as blocking-only or mixed (the mistake the grader exists to catch)
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsv } from "../../qc/src/sheet.js";
import { callFromQcRow, decisionForCall } from "../src/grader/index.js";
import { buildContext } from "../src/simulator/index.js";
import { createProject, validateAcademyProject } from "../src/envelope.js";
const [plateDir, designPath, missionId, studentId, strategy, mode, out] = process.argv.slice(2);
const design = JSON.parse(readFileSync(designPath, "utf8")); const wetlab = JSON.parse(readFileSync(path.join(plateDir, "wetlab.record.json"), "utf8"));
const table = (p) => { const [h, ...b] = parseCsv(readFileSync(p, "utf8")); return b.map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
const rows = table(path.join(plateDir, "qc", "results.csv")); const rec = table(path.join(plateDir, "qc", "recommendation.csv"));
const ctx = buildContext(design);
const calls = rows.map((r) => { const call = callFromQcRow(r); return { clone: r.sample, call, decision: decisionForCall(call, ctx.desired, ctx.hasDonor) }; });
const rank1 = rec.filter((r) => r.rank !== "").sort((a, b) => Number(a.rank) - Number(b.rank))[0];
let selected = rank1 ? rank1.sample : null;
if (mode === "picks-decoy") {
  const decoy = calls.find((c) => c.call === "blocking_only" || c.call === "mosaic");
  if (decoy) { decoy.decision = "expand"; selected = decoy.clone; }
}
const project = { ...createProject({ missionId, studentId }), stage: "qc", strategy: { choice: strategy }, design, wetlab, qc: { calls, selectedClone: selected } };
const v = validateAcademyProject(project);
if (!v.ok) { console.error("invalid project:", v.errors); process.exit(2); }
writeFileSync(out, JSON.stringify(project, null, 1));
console.log(JSON.stringify({ studentId, mode, selected, expanded: calls.filter((c) => c.decision === "expand").map((c) => c.clone) }));
