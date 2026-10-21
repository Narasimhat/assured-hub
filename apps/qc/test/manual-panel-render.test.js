import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadSpec, loadTrace } from "./helpers.js";
import { checkManual, previewManual, toPlanInput } from "../src/manualInput.js";

// Server-renders the Trace Analysis page and the gRNA/donor panel in each state. The JSX is transpiled with TypeScript's
// transpileModule (no bundler needed); the test is skipped, with the reason, where TypeScript or React is not installed.
const here = path.dirname(fileURLToPath(import.meta.url)); const src = path.join(here, "..", "src");
const require = createRequire(import.meta.url);
let ts = null; let skip = false;
try { ts = require("typescript"); require("react"); require("react-dom/server"); } catch (e) { skip = `typescript, react or react-dom is not installed (${e.code || e.message})`; }

const apoe = loadSpec("apoe_r176c_snp"); const control = loadTrace("apoe_control.ab1"); const ref = apoe.reference.sequence;
const edit = apoe.markers.find((m) => m.role === "intended"); const blocking = apoe.markers.filter((m) => m.role === "blocking");
const donorWith = (positions) => { const s = ref.split(""); positions.forEach((p) => { s[p] = apoe.markers.find((m) => m.pos === p).alt; }); return s.slice(edit.pos - 60, edit.pos + 60).join(""); };
const A = donorWith([edit.pos, blocking[0].pos]); const B = donorWith([edit.pos, blocking[blocking.length - 1].pos]); const G = apoe.guides.map((g) => g.spacer);

let build = null; let React = null; let renderToString = null; let QuickStart = null; let ManualSequences = null;
test("the QC UI files transpile and load", { skip }, async () => {
  build = fs.mkdtempSync(path.join(here, "..", ".render-build-"));
  // Components are written as <Name>.component.mjs: src/ holds iceExport.js and IceExport.jsx, which a case-insensitive file system would merge.
  const rewrite = (code) => code.replace(/(from\s+["']\.\/[^"']+)\.jsx(["'])/g, "$1.component.mjs$2");
  for (const f of fs.readdirSync(src)) {
    const text = fs.readFileSync(path.join(src, f), "utf8");
    if (f.endsWith(".jsx")) {
      const js = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
      fs.writeFileSync(path.join(build, f.replace(/\.jsx$/, ".component.mjs")), rewrite(js));
    } else if (f.endsWith(".js")) fs.writeFileSync(path.join(build, f), rewrite(text));
  }
  React = (await import("react")).default; renderToString = (await import("react-dom/server")).renderToString;
  QuickStart = (await import(pathToFileURL(path.join(build, "QuickStart.component.mjs")).href)).default;
  ManualSequences = (await import(pathToFileURL(path.join(build, "ManualSequences.component.mjs")).href)).default;
  assert.equal(typeof QuickStart, "function"); assert.equal(typeof ManualSequences, "function");
});
test.after(() => { if (build) fs.rmSync(build, { recursive: true, force: true }); });

const html = (el) => renderToString(el).replace(/<!-- -->/g, ""); // the renderer separates adjacent text nodes with comments
const panel = (over = {}) => {
  const guideRows = over.guideRows || [{ text: "" }, { text: "" }]; const donorRows = over.donorRows || [{ name: "", text: "" }];
  return React.createElement(ManualSequences, { guideRows, donorRows, setGuideRows() {}, setDonorRows() {}, manual: checkManual({ guideRows, donorRows, nuclease: "SpCas9" }), nuclease: "SpCas9", setNuclease() {}, disabled: false, canCheck: false, onCheck() {}, checking: false, preview: null, ...over });
};

test("Trace Analysis shows the gRNA and donor panel from the start, not inside a collapsed block", { skip }, () => {
  const out = html(React.createElement(QuickStart));
  assert.match(out, /No design file\? Enter your gRNA and donor sequences/);
  assert.equal((out.match(/id="q-guide-\d"/g) || []).length, 2, "two gRNA boxes, as the lab convention is two guides");
  assert.match(out, /id="q-donor-0"/); assert.match(out, /Add another donor/); assert.match(out, /Add gRNA/); assert.match(out, /id="q-nuc-manual"/);
  assert.doesNotMatch(out, /Guide sequence\(s\) if there is no design/, "the old single-line box is gone");
  assert.doesNotMatch(out, /<details/, "nothing is hidden before traces are loaded");
});

test("panel: entries with errors are marked and the analysis is not offered a check", { skip }, () => {
  const out = html(panel({ guideRows: [{ text: "ACGT" }, { text: G[1] }], donorRows: [{ name: "", text: A }], canCheck: true }));
  assert.match(out, /aria-invalid="true"/); assert.match(out, /4 nt: a SpCas9 \(NGG\) gRNA is 17-24 nt/); assert.match(out, /Fix the entries marked above before analysing/);
  assert.doesNotMatch(out, /Check against the control trace/);
});

test("panel: ready entries offer the check only once traces are loaded", { skip }, () => {
  const rows = { guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "ssODN A", text: A }, { name: "ssODN B", text: B }] };
  const waiting = html(panel({ ...rows, canCheck: false })); assert.match(waiting, /2 gRNAs and 2 donors ready/); assert.match(waiting, /Add your control and sample traces below/); assert.doesNotMatch(waiting, /Check against the control trace/);
  const ready = html(panel({ ...rows, canCheck: true })); assert.match(ready, /Check against the control trace/); assert.match(ready, /Remove donor 2/);
});

test("panel: the preview shows the gRNA sites, PAMs, cuts and the changes each donor carries", { skip }, () => {
  const rows = { guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "ssODN A", text: A }, { name: "ssODN B", text: B }] };
  const input = toPlanInput(checkManual({ ...rows, nuclease: "SpCas9" }));
  const preview = { control: "control.ab1", ...previewManual({ control, guides: input.guides, donor: input.donor }) };
  const out = html(panel({ ...rows, canCheck: true, preview }));
  assert.match(out, /Checked against control\.ab1/); assert.match(out, /Cut between/); assert.match(out, /AGG/); assert.match(out, /ssODN A/); assert.match(out, /ssODN B/);
  assert.match(out, /intended edit/); assert.match(out, /blocking change/); assert.doesNotMatch(out, /None of these changes is marked as the intended edit/);
});

test("panel: with one donor the preview says that no change is marked as the intended edit", { skip }, () => {
  const rows = { guideRows: [{ text: G[0] }, { text: G[1] }], donorRows: [{ name: "", text: A }] };
  const input = toPlanInput(checkManual({ ...rows, nuclease: "SpCas9" }));
  const out = html(panel({ ...rows, canCheck: true, preview: { control: "control.ab1", ...previewManual({ control, guides: input.guides, donor: input.donor }) } }));
  assert.match(out, /None of these changes is marked as the intended edit/); assert.match(out, /not classified/);
});

test("panel: a planner error is shown as text", { skip }, () => {
  const rows = { guideRows: [{ text: "GATTACAGATTACAGATTACA" }], donorRows: [{ name: "", text: "" }] };
  const out = html(panel({ ...rows, canCheck: true, preview: { control: "control.ab1", ...previewManual({ control, guides: ["GATTACAGATTACAGATTACA"] }) } }));
  assert.match(out, /was not found in the control sequence/);
});
