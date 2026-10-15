// Make an authentic FLAWED design for the demo by asking the real Design engine for a single custom guide far from the edit.
// usage: node make-flawed-design.mjs <outDir>   (writes flawed-m1.qc-design.json)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_GUIDE_CUT_DISTANCE } from "@assured/rules";
import { validateDesignSpec } from "@assured/spec";
import { runDesign } from "../../design/assured-crispr-designer/src/designEngine.js";
import { buildQcDesignSpec } from "../../design/assured-crispr-designer/src/qcExport.js";
const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, "..", "..", "design", "assured-crispr-designer", "test", "fixtures");
const outDir = process.argv[2]; mkdirSync(outDir, { recursive: true });
const ref = JSON.parse(readFileSync(path.join(here, "..", "missions", "m1-snp-apoe-r176c", "design.qc-design.json"), "utf8"));
const editPos = ref.reference.offset + ref.markers.find((m) => m.role === "intended").pos;       // index in the uploaded GenBank sequence
const gb = readFileSync(path.join(FIX, "apoe-r154s.gb"), "utf8");
const seq = gb.split(/ORIGIN/i)[1].replace(/[^acgtACGT]/g, "").toUpperCase();
const rc = (s) => [...s].reverse().map((b) => ({ A: "T", C: "G", G: "C", T: "A" }[b])).join("");
const cands = [];
for (let i = 0; i + 23 <= seq.length; i += 1) {
  if (/^[ACGT]GG$/.test(seq.slice(i + 20, i + 23))) cands.push({ spacer: seq.slice(i, i + 20), cut: i + 17, strand: "+" });
  if (/^CC[ACGT]$/.test(seq.slice(i, i + 3))) cands.push({ spacer: rc(seq.slice(i + 3, i + 23)), cut: i + 6, strand: "-" });
}
const far = cands.map((c) => ({ ...c, d: Math.abs(c.cut - editPos) })).filter((c) => c.d >= 20 && c.d <= 30).sort((a, b) => a.d - b.d);
console.log("edit index", editPos, "| candidate far guides:", far.slice(0, 4).map((c) => `${c.strand}${c.cut}(d=${c.d})`).join(" "));
let made = null;
for (const c of far) {
  const res = runDesign("pm", gb, "R176C", "", 250, { expectedGene: "APOE", deliveryMethod: "rnp", coDeliveryBlocking: true, customGuides: [c.spacer] });
  if (res.err) { console.log("engine refused", c.spacer, "->", res.err); continue; }
  const spec = buildQcDesignSpec(res); const v = validateDesignSpec(spec);
  if (!v.ok) { console.log("exported design invalid:", v.errors.slice(0, 2)); continue; }
  made = { spec, c }; break;
}
if (!made) { console.log("NO FLAWED DESIGN PRODUCED"); process.exit(2); }
writeFileSync(path.join(outDir, "flawed-m1.qc-design.json"), JSON.stringify(made.spec, null, 1));
console.log(JSON.stringify({ guides: made.spec.guides.map((g) => ({ name: g.name, strand: g.strand, cut: g.cut, offsetFromEdit: g.offsetFromEdit })), donors: made.spec.donors.map((d) => d.format), markers: made.spec.markers.map((m) => `${m.role}:${m.guide}`), limit: MAX_GUIDE_CUT_DISTANCE }));
