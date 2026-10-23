import test from "node:test";
import assert from "node:assert/strict";
import { planResearchRequest, AGENT_ACTIONS } from "../src/services/agentRouter.js";
test("routes design then QC", () => {
  const plan = planResearchRequest("Design a CRISPR knock-in and analyze Sanger traces");
  assert.equal(plan.action, AGENT_ACTIONS.DESIGN);
  assert.equal(plan.nextAction, AGENT_ACTIONS.QC);
  assert.equal(plan.requiresReview, true);
});
test("routes AB1 to QC", () => assert.equal(planResearchRequest("Analyze my .ab1 chromatogram").action, AGENT_ACTIONS.QC));
test("does not fabricate an action", () => assert.equal(planResearchRequest("hello").action, AGENT_ACTIONS.HELP));
test("handles empty input", () => assert.equal(planResearchRequest(" ").action, AGENT_ACTIONS.HELP));
