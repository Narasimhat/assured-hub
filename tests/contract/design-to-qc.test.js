// Contract: every design the Design app exports must pass the validator Assured QC uses, and the three
// codebases must read the same shared constants.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QC_SPEC_SCHEMA, validateDesignSpec } from "@assured/spec";
import { MAX_BLOCKING_CHANGES, MAX_GUIDE_CUT_DISTANCE, DONOR_FORMATS, recommendDonorFormat } from "@assured/rules";
import { runDesign } from "../../apps/design/assured-crispr-designer/src/designEngine.js";
import { buildQcDesignSpec, QC_SPEC_SCHEMA as DESIGN_SCHEMA } from "../../apps/design/assured-crispr-designer/src/qcExport.js";
import * as designEngine from "../../apps/design/assured-crispr-designer/src/designEngine.js";
import * as pairBlocking from "../../apps/design/assured-crispr-designer/src/pairBlocking.js";
import * as donorFormat from "../../apps/design/assured-crispr-designer/src/donorFormat.js";
import * as qcSpecShim from "../../apps/qc/src/designSpec.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (n) => readFileSync(path.join(here, "..", "..", "apps", "design", "assured-crispr-designer", "test", "fixtures", n), "utf8");
const CASES = {
  nr2f2_block: ["ct", "nr2f2-ng016753.gb", "", "GGGGS3-SD40-GGGGS-V5", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true }],
  nr2f2_ssodn: ["ct", "nr2f2-ng016753.gb", "", "2xHA-only", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true }],
  tagme_nt: ["nt", "synthetic-tagging.gb", "", "N:EGFP-Linker", "", { expectedGene: "TAGME", donorFormat: "auto", autoTrimArms: true }],
  tagme_it: ["it", "synthetic-tagging.gb", "F50", "SPOT", 250, { expectedGene: "TAGME" }],
  apoe_snp: ["pm", "apoe-r154s.gb", "R176C", "", 250, { expectedGene: "APOE", deliveryMethod: "rnp", coDeliveryBlocking: true }],
  tagme_ko: ["ko", "synthetic-tagging.gb", "", "", 400, { expectedGene: "TAGME" }],
};

test("every exported design validates against @assured/spec", () => {
  for (const [key, [type, file, mutation, tag, arm, options]] of Object.entries(CASES)) {
    const result = runDesign(type, fixture(file), mutation, tag, arm, options);
    assert.equal(result.err, undefined, `${key}: ${result.err}`);
    const spec = buildQcDesignSpec(result);
    const check = validateDesignSpec(spec);
    assert.equal(check.ok, true, `${key}: ${check.errors.join("; ")}`);
    assert.equal(spec.schema, QC_SPEC_SCHEMA);
  }
});

test("Design, QC and the package expose one schema constant and one set of limits", () => {
  assert.equal(DESIGN_SCHEMA, QC_SPEC_SCHEMA);
  assert.equal(qcSpecShim.QC_SPEC_SCHEMA, QC_SPEC_SCHEMA);
  assert.equal(qcSpecShim.validateDesignSpec, validateDesignSpec, "QC re-exports the package validator");
  assert.equal(designEngine.MAX_BLOCKING_CHANGES, MAX_BLOCKING_CHANGES);
  assert.equal(pairBlocking.MAX_GUIDE_CUT_DISTANCE, MAX_GUIDE_CUT_DISTANCE);
  assert.equal(donorFormat.DONOR_FORMATS, DONOR_FORMATS);
  assert.equal(donorFormat.recommendDonorFormat, recommendDonorFormat);
});
