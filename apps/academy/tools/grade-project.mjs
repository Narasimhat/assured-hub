// usage: node grade-project.mjs <project.json> <answer-key.json> <out.json> [assignedSeed]
import { readFileSync, writeFileSync } from "node:fs";
import { gradeProject } from "../src/grader/index.js";
import { validateAcademyProject } from "../src/envelope.js";
const [projectPath, keyPath, out, assigned] = process.argv.slice(2);
const project = JSON.parse(readFileSync(projectPath, "utf8")); const key = JSON.parse(readFileSync(keyPath, "utf8"));
const v = validateAcademyProject(project); if (!v.ok) { console.error("project does not validate:", v.errors); process.exit(2); }
const report = gradeProject(project, key, { assignedSeed: assigned === undefined ? null : Number(assigned) });
writeFileSync(out, JSON.stringify({ student: project.student.id, mission: project.mission.id, ...report }, null, 1));
console.log(JSON.stringify({ student: project.student.id, overall: report.overall, design: report.design.score, plate: report.plate.score, critical: report.critical }));
