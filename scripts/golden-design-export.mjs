// Golden-file check: export the QC hand-off for the repo's seven design cases and write it to a file.
// usage: node golden-design-export.mjs <designer-app-root> <out.json> [<qc-root-for-validator-parity>]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const [root, out, qcRoot] = process.argv.slice(2);
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const { runDesign } = await imp("src/designEngine.js");
const { buildQcDesignSpec } = await imp("src/qcExport.js");
const fixture = (n) => readFileSync(path.join(root, "test", "fixtures", n), "utf8");
const CASES = {
  nr2f2_block: ["ct", "nr2f2-ng016753.gb", "", "GGGGS3-SD40-GGGGS-V5", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true }],
  nr2f2_ssodn: ["ct", "nr2f2-ng016753.gb", "", "2xHA-only", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true }],
  nr2f2_opposite: ["ct", "nr2f2-ng016753.gb", "", "2xHA-only", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true, customGuides: ["CAGTTTTAACTGGCCGTATA", "ATTTATTGAATTGCCATATA"] }],
  tagme_nt: ["nt", "synthetic-tagging.gb", "", "N:EGFP-Linker", "", { expectedGene: "TAGME", donorFormat: "auto", autoTrimArms: true }],
  tagme_it: ["it", "synthetic-tagging.gb", "F50", "SPOT", 250, { expectedGene: "TAGME" }],
  apoe_snp: ["pm", "apoe-r154s.gb", "R176C", "", 250, { expectedGene: "APOE", deliveryMethod: "rnp", coDeliveryBlocking: true }],
  tagme_ko: ["ko", "synthetic-tagging.gb", "", "", 400, { expectedGene: "TAGME" }],
};
const specs = {};
for (const [key, [type, file, mutation, tag, arm, options]] of Object.entries(CASES)) {
  const result = runDesign(type, fixture(file), mutation, tag, arm, options);
  if (result.err) throw new Error(`${key}: ${result.err}`);
  specs[key] = buildQcDesignSpec(result);
}
const body = { cases: specs };
if (qcRoot) {
  const orig = await import(pathToFileURL(path.join(qcRoot, "src", "designSpec.js")).href);
  body.validate = Object.fromEntries(Object.entries(specs).map(([k, s]) => [k, orig.validateDesignSpec(s)]));
}
writeFileSync(out, JSON.stringify(body, null, 1));
console.log("wrote", out, Object.keys(specs).length, "cases");
