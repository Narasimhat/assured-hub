import test from "node:test";
import assert from "node:assert/strict";
import { QC_SPEC_SCHEMA, EDIT_KINDS, validateDesignSpec, reverseSpec } from "../src/index.js";

test("schema id and edit kinds are the published contract", () => {
  assert.equal(QC_SPEC_SCHEMA, "assured-qc-design/1");
  assert.deepEqual(EDIT_KINDS, ["knockout", "deletion", "snp", "tag_small", "tag_large", "reporter", "internal_tag", "terminal_tag"]);
});

test("validator refuses non-objects, wrong schema and non-DNA references", () => {
  assert.equal(validateDesignSpec(null).ok, false);
  const wrong = validateDesignSpec({ schema: "other/9", reference: { sequence: "ACGT" }, design: { editKind: "knockout" } });
  assert.equal(wrong.ok, false);
  assert.ok(wrong.errors.some((e) => /Unsupported schema/.test(e)));
  const nonDna = validateDesignSpec({ schema: QC_SPEC_SCHEMA, reference: { sequence: "ACGTNX" }, design: { editKind: "knockout" } });
  assert.ok(nonDna.errors.some((e) => /A, C, G and T only/.test(e)));
});

test("reverseSpec exists and mirrors the reference", () => {
  const spec = { reference: { sequence: "AACG", mirrored: false }, guides: [], donors: [], markers: [], primers: [] };
  const flipped = reverseSpec(spec);
  assert.equal(flipped.reference.sequence, "CGTT");
  assert.equal(flipped.reference.mirrored, true);
});
