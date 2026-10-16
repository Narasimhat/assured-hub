// The Academy encodes a Bench hand-off; Bench decodes it. The two live in different apps and
// different languages, so the encoder is written twice. This test is what keeps them one format.
//
// It transpiles the Academy's TypeScript encoder and feeds its output to Bench's real decoder.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

import { readHandoff, buildHandoffUrl, HANDOFF_PARAM } from "../../apps/studio/src/services/academyHandoff.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const bridgeTs = path.join(root, "apps", "academy-ui", "src", "services", "benchBridge.ts");

/** Load the Academy's TypeScript encoder as a module, without building the whole app. */
async function loadBridge() {
  const source = fs.readFileSync(bridgeTs, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const outDir = fs.mkdtempSync(path.join(root, "node_modules", ".handoff-contract-"));
  const outFile = path.join(outDir, "benchBridge.mjs");
  fs.writeFileSync(outFile, js);
  try {
    return await import(pathToFileURL(outFile).href);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

test("the Academy and Bench agree on the hand-off parameter name", async () => {
  const bridge = await loadBridge();
  assert.equal(bridge.HANDOFF_PARAM, HANDOFF_PARAM);
});

test("every Bench edit type survives an Academy hand-off", async () => {
  const bridge = await loadBridge();
  for (const editType of ["ko", "pm", "ct", "nt", "it"]) {
    const url = bridge.benchHandoffUrl({ name: `Lesson: ${editType}`, gene: "APOE", editType, mutation: "R176C" });
    const decoded = readHandoff(url.slice(url.indexOf("#")));
    assert.equal(decoded.error, null, `${editType} was rejected: ${decoded && decoded.error}`);
    assert.equal(decoded.project.editType, editType);
    assert.equal(decoded.project.gene, "APOE");
    assert.equal(decoded.project.name, `Lesson: ${editType}`);
  }
});

test("optional fields are carried when present and omitted when absent", async () => {
  const bridge = await loadBridge();

  const full = bridge.benchHandoffUrl({
    name: "Tier 2 sandbox",
    gene: "SORCS1",
    editType: "ko",
    tag: "FLAG",
    homologyArmLength: 250,
    options: { maxBlockingChanges: 3, coDeliveryBlocking: true },
  });
  const decodedFull = readHandoff(full.slice(full.indexOf("#")));
  assert.equal(decodedFull.project.homologyArmLength, 250);
  assert.equal(decodedFull.project.options.coDeliveryBlocking, true);
  assert.equal(decodedFull.project.options.maxBlockingChanges, 3);

  const minimal = bridge.benchHandoffUrl({ name: "Minimal", gene: "TP53", editType: "ko" });
  const decodedMinimal = readHandoff(minimal.slice(minimal.indexOf("#")));
  assert.equal(decodedMinimal.error, null);
  // Bench's own defaults fill the gaps rather than the Academy guessing them.
  assert.equal(decodedMinimal.project.homologyArmLength, 400);
  assert.equal(decodedMinimal.project.tag, "FLAG");
});

test("the Academy encoder produces the same payload as Bench's own", async () => {
  const bridge = await loadBridge();
  const payload = { name: "Same", gene: "PLN", editType: "pm", mutation: "R14del" };
  const fromAcademy = bridge.benchHandoffUrl(payload, "../studio/");
  const fromBench = buildHandoffUrl("../studio/", payload);
  assert.equal(fromAcademy, fromBench);
});

test("the hand-off is a fragment, so the payload never reaches a server", async () => {
  const bridge = await loadBridge();
  const url = bridge.benchHandoffUrl({ name: "x", gene: "APOE", editType: "pm" });
  assert.ok(url.includes("#"), "payload must be in the fragment");
  assert.ok(!url.slice(0, url.indexOf("#")).includes(HANDOFF_PARAM), "payload must not be in the path or query");
});
