import test from "node:test";
import assert from "node:assert/strict";

import { readHandoff, buildHandoffUrl, toBase64Url, handoffParam, clearHandoff, HANDOFF_PARAM } from "../src/services/academyHandoff.js";

const VALID = { name: "Academy: APOE R176C", gene: "APOE", editType: "pm", mutation: "R176C" };

test("a hand-off round-trips through the URL fragment", () => {
  const url = buildHandoffUrl("https://example.org/studio/", VALID);
  assert.ok(url.startsWith("https://example.org/studio/#handoff="));
  const hash = url.slice(url.indexOf("#"));
  const result = readHandoff(hash);
  assert.equal(result.error, null);
  assert.equal(result.project.gene, "APOE");
  assert.equal(result.project.editType, "pm");
  assert.equal(result.project.name, "Academy: APOE R176C");
  // parseProject's defaults are applied
  assert.equal(result.project.homologyArmLength, 400);
  assert.ok(result.project.id);
});

test("no fragment, or an unrelated fragment, is not a hand-off", () => {
  assert.equal(readHandoff(""), null);
  assert.equal(readHandoff("#"), null);
  assert.equal(readHandoff("#/tier/bench"), null);
  assert.equal(readHandoff("#other=1"), null);
  assert.equal(handoffParam("#other=1"), null);
  assert.equal(readHandoff(undefined), null);
});

test("a damaged payload reports an error instead of throwing", () => {
  const result = readHandoff("#handoff=!!!not-base64!!!");
  assert.equal(result.project, null);
  assert.match(result.error, /damaged/);
});

test("valid base64 that is not a Bench experiment is refused by parseProject", () => {
  const notAProject = toBase64Url(JSON.stringify({ hello: "world" }));
  const result = readHandoff(`#handoff=${notAProject}`);
  assert.equal(result.project, null);
  assert.match(result.error, /does not describe a Bench experiment/);

  const badEditType = toBase64Url(JSON.stringify({ gene: "APOE", editType: "wat" }));
  assert.equal(readHandoff(`#handoff=${badEditType}`).project, null);

  const notJson = toBase64Url("this is not json");
  assert.equal(readHandoff(`#handoff=${notJson}`).project, null);
});

test("a hand-off cannot inject design output or QC results", () => {
  const sneaky = {
    ...VALID,
    designResult: { guides: [{ sequence: "AAAAAAAAAAAAAAAAAAAA", score: 100 }] },
    qcResults: [{ clone: "A1", call: "homozygous" }],
    status: "ready",
  };
  const hash = buildHandoffUrl("", sneaky).slice(1);
  const result = readHandoff(`#${hash.slice(hash.indexOf(HANDOFF_PARAM))}`);
  assert.equal(result.error, null);
  assert.equal(result.project.designResult, null, "design output must come from the engine, not from a link");
  assert.deepEqual(result.project.qcResults, []);
  assert.equal(result.project.status, null);
  assert.equal(result.project.qcDesignSpec, null);
});

test("unicode survives the encoding", () => {
  const url = buildHandoffUrl("", { gene: "APOE", editType: "pm", name: "Beispiel: 5% O₂, 37 °C" });
  const result = readHandoff(url);
  assert.equal(result.project.name, "Beispiel: 5% O₂, 37 °C");
});

test("clearHandoff removes only the hand-off and keeps any other fragment state", () => {
  const calls = [];
  const history = { replaceState: (_s, _t, url) => calls.push(url) };

  clearHandoff({ pathname: "/studio/", search: "", hash: `#${HANDOFF_PARAM}=abc&tab=design` }, history);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "/studio/#tab=design");

  clearHandoff({ pathname: "/studio/", search: "", hash: `#${HANDOFF_PARAM}=abc` }, history);
  assert.equal(calls[1], "/studio/");

  // nothing to clear: history is not touched
  clearHandoff({ pathname: "/studio/", search: "", hash: "#tab=design" }, history);
  assert.equal(calls.length, 2);
});
