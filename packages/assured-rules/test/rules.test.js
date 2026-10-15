import test from "node:test";
import assert from "node:assert/strict";
import { MAX_BLOCKING_CHANGES, MAX_GUIDE_CUT_DISTANCE, MIN_PAIR_CUT_SEPARATION, DONOR_FORMATS, SSODN_BELOW_INSERT_BP, AAV_ABOVE_INSERT_BP, recommendDonorFormat, LAB_CONVENTIONS } from "../src/index.js";

test("engine limits keep the values the design tool shipped with", () => {
  assert.equal(MAX_BLOCKING_CHANGES, 3);
  assert.equal(MAX_GUIDE_CUT_DISTANCE, 15);
  assert.equal(MIN_PAIR_CUT_SEPARATION, 10);
});

test("donor tiers: ssODN below 120 bp, block between, cloned/AAV above 500 bp", () => {
  assert.equal(SSODN_BELOW_INSERT_BP, 120);
  assert.equal(AAV_ABOVE_INSERT_BP, 500);
  assert.equal(recommendDonorFormat(60).format, "ssodn");
  assert.equal(recommendDonorFormat(119).format, "ssodn");
  assert.equal(recommendDonorFormat(120).format, "block");
  assert.equal(recommendDonorFormat(500).format, "block");
  assert.equal(recommendDonorFormat(501).format, "aav");
  assert.equal(recommendDonorFormat(0).format, "block", "unknown insert length assumes a block");
});

test("lab conventions agree with the engine's default arms (drift check)", () => {
  assert.equal(LAB_CONVENTIONS.donorByClass.tag_large.armBp, DONOR_FORMATS.block.defaultArm);
  assert.equal(LAB_CONVENTIONS.donorByClass.reporter.armBp, DONOR_FORMATS.aav.defaultArm);
  assert.equal(LAB_CONVENTIONS.donorByClass.snp.format, "ssodn");
});

test("lab convention is two guides for every edit kind", () => {
  for (const [kind, n] of Object.entries(LAB_CONVENTIONS.minGuides)) assert.equal(n, 2, kind);
});
