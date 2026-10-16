// Server-render smoke test for the Academy UI. It transpiles src/ with the TypeScript compiler (into .smoke-build/, which is
// git-ignored and sits inside this package so React resolves from the monorepo root), then renders every stage for every preset
// and for custom-design projects, and fails on a thrown error or on a stale or broken string in the HTML. tsc proves the types;
// this proves the components do not crash on the data they are given. Run: npm run test:smoke -w assured-academy-ui
"use strict";
const fs = require("fs"), path = require("path"), ts = require("typescript");
const ROOT = path.resolve(__dirname, ".."), SRC = path.join(ROOT, "src"), OUT = path.join(ROOT, ".smoke-build");

function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])); }
fs.rmSync(OUT, { recursive: true, force: true });
for (const f of walk(SRC)) {
  if (!/\.(ts|tsx)$/.test(f) || /main\.tsx$/.test(f)) continue;
  const js = ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const dest = path.join(OUT, path.relative(SRC, f)).replace(/\.(ts|tsx)$/, ".js");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, js);
}
fs.writeFileSync(path.join(OUT, "package.json"), '{"type":"commonjs"}');

const R = (p) => require(path.join(OUT, p));
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
const React = require("react"), { renderToString } = require("react-dom/server");
const { PRESET_PROJECTS } = R("data/generated/presets.generated.js"), { DESIGN_EXAMPLES } = R("data/generated/examples.generated.js");
const { runTeachingDesign } = R("utils/designEngine.js"), { DEFAULT_BENCH } = R("data/benchDefaults.js");
const noop = () => {};
const STAGES = { Stage1: ["Stage1Design"], Stage2: ["Stage2Order"], Stage3: ["Stage3Bench"], Stage4: ["Stage4QC"], Stage5: ["Stage5Publish"] };
const stage = (name) => R(`components/pipeline/${name}.js`)[name];
const BAD = [/\bundefined\b/, /\bNaN\b/, /\[object Object\]/, /Lonza/, /CB-150/, /CA-137/, /Y-27632/, /phosphorothioate/i, /\bPTO\b/, /Telugu et al/, /Exon 1/, /NM_002468/, /Kazusa/, /guarantee/i, /peer-reviewed/i, /\$\\to\$/, /\$R\^2\$/, /MDC Berlin Core/];
const problems = []; let rendered = 0;
const text = (html) => html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
function render(name, element) {
  try {
    const html = renderToString(element); rendered += 1;
    const hits = BAD.filter((re) => re.test(html)).map(String);
    if (hits.length) problems.push(`${name}: ${hits.join(" ")}`);
    return html;
  } catch (e) { problems.push(`${name}: THROWS ${String(e.message).slice(0, 160)}`); return ""; }
}
const expect = (name, cond) => { if (!cond) problems.push(`expectation failed: ${name}`); };

const projects = [...PRESET_PROJECTS];
for (const ex of DESIGN_EXAMPLES) {
  const t = runTeachingDesign({ gene: ex.gene, diseaseName: ex.diseaseName, sequence: ex.sequence, mode: ex.mode, editPosition: ex.editPosition, altBase: ex.altBase });
  projects.push({ ...PRESET_PROJECTS[0], id: `custom-${ex.gene}`, target: t, bench: { ...DEFAULT_BENCH }, clones: [], provenance: ["sketch"], verification: undefined });
}
projects.push({ ...PRESET_PROJECTS[0], id: "custom-ko", target: runTeachingDesign({ gene: "KOX", diseaseName: "x", sequence: DESIGN_EXAMPLES[0].sequence, mode: "KNOCKOUT", editPosition: 150 }), bench: { ...DEFAULT_BENCH }, clones: [], provenance: ["sketch"], verification: undefined });
projects.push({ ...PRESET_PROJECTS[0], id: "learner", bench: { ...DEFAULT_BENCH, isBenchCompleted: true, valuesSource: "user-entered", condition: "2gRNA-KI", reactions: 2 } });
for (const p of projects) for (const [s, [name]] of Object.entries(STAGES)) render(`${p.id} / ${s}`, React.createElement(stage(name), { project: p, onUpdateProject: noop, onProceed: noop }));

// the harness must be able to fail
let threw = false; try { renderToString(React.createElement(stage("Stage1Design"), { project: { ...PRESET_PROJECTS[0], target: null }, onUpdateProject: noop, onProceed: noop })); } catch { threw = true; }
expect("harness reports a crash for a null target", threw);

// content that must be present, or must be absent
const [apoe, myd88, hbb] = PRESET_PROJECTS; const props = (project) => ({ project, onUpdateProject: noop, onProceed: noop });
const s1 = renderToString(React.createElement(stage("Stage1Design"), props(apoe)));
expect("stage 1 highlights the 20-nt guide, 3-nt PAM, edit base and cut", (s1.match(/bg-cyan-950 text-cyan-300/g) || []).length + (s1.match(/bg-rose-500 text-white/g) || []).length === 20 && (s1.match(/bg-amber-900\/70/g) || []).length === 3 && (s1.match(/border-l-2 border-red-400/g) || []).length === 1);
expect("MYD88 stage 1 says no guides were recorded", /No guide sequences were recorded/.test(renderToString(React.createElement(stage("Stage1Design"), props(myd88)))));
const s4 = renderToString(React.createElement(stage("Stage4QC"), props(apoe)));
expect("stage 4 shows all 96 wells (rows A to H)", (s4.match(/rounded-full cursor-pointer/g) || []).length === 96);
expect("stage 4 names the engine version and the lab pipeline", /Assured QC 0\.5\.2/.test(s4) && /Lab pipeline/.test(s4));
expect("HBB stage 4 shows the empty state", /No clone data for HBB/.test(text(renderToString(React.createElement(stage("Stage4QC"), props(hbb))))));
const s2 = renderToString(React.createElement(stage("Stage2Order"), props(apoe)));
expect("stage 2 lists both guides and both donors", (s2.match(/Alt-R CRISPR-Cas9 gRNA, 2 nmol/g) || []).length >= 2 && (s2.match(/Alt-R HDR modified ssODN/g) || []).length >= 2);
const learner = projects[projects.length - 1], s5 = text(renderToString(React.createElement(stage("Stage5Publish"), { project: learner, onUpdateProject: noop })));
expect("methods draft uses the learner's own Table 7 choices", /RNP mixes followed Table 7 of the protocol for 2 gRNAs, knock-in/.test(s5));
const preset5 = text(renderToString(React.createElement(stage("Stage5Publish"), { project: apoe, onUpdateProject: noop })));
expect("methods draft does not state preset bench values as done", !/RNP mixes followed Table 7/.test(preset5) && /Delivery and cloning: not recorded/.test(preset5));

const c = (n, el) => render(n, el);
c("RareDiseaseHub", React.createElement(R("components/missions/RareDiseaseHub.js").RareDiseaseHub, { onSelectMissionForLab: noop }));
c("ToolLaunchpad", React.createElement(R("components/tools/ToolLaunchpad.js").ToolLaunchpad));
c("FrugalLabConfig", React.createElement(R("components/frugal/FrugalLabConfig.js").FrugalLabConfig));
c("AcademyHub", React.createElement(R("components/academy/AcademyHub.js").AcademyHub, { completedLessons: [], onPassQuiz: noop, onNavigateToSimulator: noop }));
c("CertificateModal", React.createElement(R("components/certificate/CertificateModal.js").CertificateModal, { onClose: noop, masteryPoints: 10, totalQuizzesPassed: 3 }));
c("VirtualLab", React.createElement(R("components/simulator/VirtualLab.js").VirtualLab, { onAwardMastery: noop }));
c("UnifiedPipeline", React.createElement(R("components/pipeline/UnifiedPipeline.js").UnifiedPipeline));
c("PatientJourneyTimeline", React.createElement(R("components/simulator/PatientJourneyTimeline.js").PatientJourneyTimeline));
c("Sorcs1DesignSandbox", React.createElement(R("components/simulator/Sorcs1DesignSandbox.js").Sorcs1DesignSandbox));
c("WetLabFailureSimulator", React.createElement(R("components/simulator/WetLabFailureSimulator.js").WetLabFailureSimulator));
c("DonorIccPowerSimulator", React.createElement(R("components/simulator/DonorIccPowerSimulator.js").DonorIccPowerSimulator));
c("IsoCellYieldCalculator", React.createElement(R("components/simulator/IsoCellYieldCalculator.js").IsoCellYieldCalculator));
c("OffTargetDecisionMatrix", React.createElement(R("components/simulator/OffTargetDecisionMatrix.js").OffTargetDecisionMatrix));
const PS = R("components/academy/PersonaSwitcher.js").PersonaSwitcher;
for (const p of ["layperson", "student", "technician", "scientist", "core_facility", "cgt_industry"]) {
  c(`PersonaSwitcher-${p}`, React.createElement(PS, { activePersonaId: p, onSelectPersona: noop }));
}
const App = require(path.join(OUT, "App.js")); c("App", React.createElement(App.default || App.App));
const curriculum = R("data/curriculum.js"); const tracks = curriculum.CURRICULUM || Object.values(curriculum).find(Array.isArray);
const LV = R("components/academy/LessonViewer.js").LessonViewer; let lessons = 0;
for (const tr of tracks) for (const l of tr.lessons) { lessons += 1; c(`lesson ${l.id}`, React.createElement(LV, { lesson: l, trackColor: "from-cyan-500 to-blue-600", isCompleted: false, onPassQuiz: noop })); }

fs.rmSync(OUT, { recursive: true, force: true });
console.log(`rendered ${rendered} components (${projects.length} projects x 5 stages, ${lessons} lessons, 8 tabs); ${problems.length} problem(s)`);
if (problems.length) { for (const p of problems) console.error("  " + p); process.exit(1); }
