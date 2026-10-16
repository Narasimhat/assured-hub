import test from "node:test";
import assert from "node:assert/strict";

import {
  SOURCES, PROVENANCE_LEVELS, stated, describe, collectSources,
  ASSURED, CRISPR_MIX, PROTOCOLS, pulseSummary, pulseVariants, NUCLEASE,
  HYPOXIA, GELTREX, MEDIA, CULTURE_DEVIATIONS,
  ISOCELL, projectCloneYield, planSeedbank,
  PENALTIES, scoreRun, baseline, MODEL_PROVENANCE,
  ICC_REFERENCE, effectiveN, compareDesigns, effectiveNCurve,
  ASSAYS, REGULATORY_RULES, recommendPanel, ASSAY_CLASSES,
  PERSONAS, PERSONA_IDS, getPersona, explainFor,
} from "../src/index.js";

import { MAX_GUIDE_CUT_DISTANCE } from "@assured/rules";

test("every source has a citation, and published ones have a DOI or URL", () => {
  for (const [id, source] of Object.entries(SOURCES)) {
    assert.equal(source.id, id, `${id} id mismatch`);
    assert.ok(source.short && source.citation, `${id} missing short or citation`);
  }
  assert.equal(SOURCES.ASSURED_2023.doi, "10.1016/j.xpro.2023.102406");
  assert.equal(SOURCES.CRISPR_MIX_2026.doi, "10.1016/j.omtn.2025.102820");
});

test("stated() refuses an unknown provenance or an unknown source", () => {
  assert.throws(() => stated(1, "V", "probably", "ASSURED_2023"), /provenance/);
  assert.throws(() => stated(1, "V", "published", "NO_SUCH_PAPER"), /source/);
  const ok = stated(1200, "V", "published", "ASSURED_2023");
  assert.equal(ok.value, 1200);
  assert.match(describe(ok), /1200 V \(Published: Ludwik/);
});

test("collectSources walks a tree and returns registry order", () => {
  const found = collectSources({ a: ASSURED.electroporation, b: CRISPR_MIX.rnp });
  const ids = found.map((s) => s.id);
  assert.ok(ids.includes("ASSURED_2023"));
  assert.ok(ids.includes("PLATFORM_SPEC"));
  assert.deepEqual(ids, [...new Set(ids)], "no duplicates");
});

test("every stated value anywhere in the package declares a legal provenance", () => {
  const seen = [];
  (function walk(node, path) {
    if (!node || typeof node !== "object") return;
    if (typeof node.provenance === "string" && "value" in node) {
      seen.push(path);
      assert.ok(PROVENANCE_LEVELS.includes(node.provenance), `${path} has provenance "${node.provenance}"`);
      assert.ok(SOURCES[node.sourceId], `${path} has unknown source "${node.sourceId}"`);
      return;
    }
    for (const [key, child] of Object.entries(node)) walk(child, `${path}.${key}`);
  })({ ASSURED, CRISPR_MIX, HYPOXIA, GELTREX, MEDIA, ISOCELL, ICC_REFERENCE, NUCLEASE, ASSAYS }, "root");
  assert.ok(seen.length > 25, `expected many stated values, found ${seen.length}`);
});

test("the two protocols keep their own pulse width; they are not merged", () => {
  assert.equal(ASSURED.electroporation.pulseWidthMs.value, 30, "ASSURED is 30 ms (STAR Protocols)");
  assert.equal(CRISPR_MIX.electroporation.pulseWidthMs.value, 20, "CRISPR-MiX is 20 ms");
  assert.equal(ASSURED.electroporation.voltage.value, CRISPR_MIX.electroporation.voltage.value);
  assert.equal(pulseSummary("assured"), "1200 V, 30 ms, 1 pulse");
  assert.equal(pulseSummary("crispr-mix"), "1200 V, 20 ms, 1 pulse");
  assert.throws(() => pulseSummary("nope"), /Unknown protocol/);
  assert.equal(pulseVariants().length, Object.keys(PROTOCOLS).length);
});

test("the ASSURED Table 7 copy matches the Academy UI's own copy", () => {
  // benchDefaults.ts is the UI's copy of the same table. If one changes, this fails.
  assert.deepEqual(Object.keys(ASSURED.rnpTable), ["1gRNA-KO", "2gRNA-KO", "1gRNA-KI", "2gRNA-KI"]);
  for (const [key, row] of Object.entries(ASSURED.rnpTable)) {
    const total = row.cas9 + row.gRNA1 + (row.gRNA2 || 0) + (row.ssodn || 0) + row.rBuffer;
    assert.equal(total, ASSURED.rnpTableTotalUl.value, `${key} does not total 15 uL`);
  }
});

test("CRISPR-MiX stoichiometry is 3:1 sgRNA to Cas9 with donors at twice the sgRNA", () => {
  const { sgRNA, cas9, pooledSsodn } = CRISPR_MIX.rnp;
  assert.equal(sgRNA.value / cas9.value, 3);
  assert.equal(pooledSsodn.value / sgRNA.value, 2);
});

test("CRISPR-MiX names both responsive and refractory loci", () => {
  const responsive = CRISPR_MIX.loci.filter((l) => l.behaviour === "responsive").map((l) => l.gene);
  const refractory = CRISPR_MIX.loci.filter((l) => l.behaviour === "refractory").map((l) => l.gene);
  assert.deepEqual(responsive, ["PLN", "TPM1", "TNNT2"]);
  assert.deepEqual(refractory, ["KCNH2", "RBM20"]);
});

test("every culture deviation has a mechanism and a matching penalty", () => {
  for (const d of CULTURE_DEVIATIONS) {
    assert.ok(d.mechanism.length > 80, `${d.key} mechanism is too thin to teach from`);
    assert.ok(d.correct && d.deviation, `${d.key} missing correct/deviation pair`);
    assert.ok(PENALTIES[d.key], `${d.key} has no penalty in the wet-lab model`);
  }
  assert.equal(Object.keys(PENALTIES).length, CULTURE_DEVIATIONS.length);
});

test("IsoCell yield follows the stated chain and flags its own assumptions", () => {
  const perfect = projectCloneYield({ poolScore: 1 });
  assert.equal(perfect.singleCellChambers, 70);
  assert.equal(perfect.survivors, 45.5); // 70 * 0.65
  assert.ok(Math.abs(perfect.survivors - ISOCELL.survivingClones.value) < 1);
  assert.equal(perfect.editedClones, perfect.survivors);
  assert.ok(perfect.meetsTarget);
  assert.equal(perfect.caveats.length, 3);

  const weak = projectCloneYield({ poolScore: 0.05, clonesNeeded: 5 });
  assert.ok(weak.editedClones < 5);
  assert.ok(!weak.meetsTarget);
  assert.ok(weak.platesForTarget >= 2);

  const zero = projectCloneYield({ poolScore: 0 });
  assert.equal(zero.editedClones, 0);
  assert.equal(zero.platesForTarget, null);

  // out-of-range input is clamped, not propagated as NaN
  const silly = projectCloneYield({ poolScore: 7 });
  assert.equal(silly.editedClones, silly.survivors);
});

test("seedbank planning", () => {
  const plan = planSeedbank({ clonesToBank: 5 });
  assert.equal(plan.totalVials, 250);
  assert.equal(plan.freezeRuns, Math.ceil(250 / 12));
});

test("a clean run reproduces the protocol baseline", () => {
  const ko = scoreRun({ editKind: "knockout", deviations: [], guideCount: 2 });
  assert.equal(ko.poolScorePercent, 79.5);
  assert.equal(ko.findings.length, 0);
  assert.equal(ko.verdict.level, "good");
  assert.ok(ko.meetsBenchmark);
  assert.equal(ko.provenance, MODEL_PROVENANCE);

  const ki = scoreRun({ editKind: "knockin", deviations: [], guideCount: 2, cutToEditBp: 3 });
  assert.equal(ki.poolScorePercent, 57.5);
  assert.ok(Math.abs(ki.poolScorePercent - baseline("knockin").poolScore * 100) < 1e-9);
});

test("every deviation lowers the outcome and returns its mechanism", () => {
  const clean = scoreRun({ editKind: "knockout" });
  for (const key of Object.keys(PENALTIES)) {
    const run = scoreRun({ editKind: "knockout", deviations: [key] });
    const worse = run.poolScorePercent < clean.poolScorePercent || run.survivingClones < clean.survivingClones;
    assert.ok(worse, `${key} changed nothing`);
    assert.equal(run.findings.length, 1);
    assert.ok(run.findings[0].mechanism.length > 80, `${key} returned no mechanism`);
  }
});

test("omitting CloneR2 drops survival below the 46-clone IsoCell benchmark", () => {
  const run = scoreRun({ editKind: "knockout", deviations: ["noCloneR2"] });
  assert.ok(run.survivingClones < ISOCELL.survivingClones.value, "survival should fall below the benchmark");
  assert.ok(!run.meetsBenchmark);
  assert.equal(run.findings[0].severity, "critical");
  assert.match(run.findings[0].mechanism, /E-cadherin|ROCK/);
});

test("normoxia and warm Geltrex both penalise survival, and they compound", () => {
  const one = scoreRun({ deviations: ["normoxia"] });
  const two = scoreRun({ deviations: ["normoxia", "warmGeltrex"] });
  assert.ok(two.survivingClones < one.survivingClones);
  assert.equal(two.findings.length, 2);
});

test("deviations are de-duplicated and unknown keys throw", () => {
  const once = scoreRun({ deviations: ["normoxia"] });
  const twice = scoreRun({ deviations: ["normoxia", "normoxia"] });
  assert.equal(twice.poolScorePercent, once.poolScorePercent);
  assert.throws(() => scoreRun({ deviations: ["ultraviolet"] }), /Unknown deviation/);
});

test("design quality is scored against the engine's own limits, not against a copy", () => {
  const inside = scoreRun({ editKind: "knockin", cutToEditBp: MAX_GUIDE_CUT_DISTANCE });
  const outside = scoreRun({ editKind: "knockin", cutToEditBp: MAX_GUIDE_CUT_DISTANCE + 1 });
  assert.ok(!inside.findings.some((f) => f.key === "cutTooFar"));
  assert.ok(outside.findings.some((f) => f.key === "cutTooFar"));
  assert.ok(outside.poolScorePercent < inside.poolScorePercent);

  const oneGuide = scoreRun({ editKind: "knockout", guideCount: 1 });
  assert.ok(oneGuide.findings.some((f) => f.key === "tooFewGuides"));

  const unblocked = scoreRun({ editKind: "knockin", cutToEditBp: 2, donorBlocksAllGuides: false });
  assert.ok(unblocked.findings.some((f) => f.key === "donorNotBlocking"));
  assert.match(unblocked.findings.find((f) => f.key === "donorNotBlocking").mechanism, /cut again|re-?cut/i);
});

test("findings come back worst first", () => {
  const run = scoreRun({ editKind: "knockin", deviations: ["normoxia", "noCloneR2"], cutToEditBp: 2 });
  assert.equal(run.findings[0].severity, "critical");
});

test("a run with nothing surviving reads as failed, not as marginal", () => {
  const run = scoreRun({ editKind: "knockin", deviations: ["noCloneR2", "noRecoveryMedium", "warmGeltrex", "normoxia"] });
  assert.equal(run.verdict.level, "failed");
});

test("effective n: extra lines from one donor are eaten by the design effect", () => {
  const one = effectiveN({ donors: 1, linesPerDonor: 1, icc: 0.432 });
  const six = effectiveN({ donors: 1, linesPerDonor: 6, icc: 0.432 });
  assert.equal(one.effectiveN, 1);
  assert.ok(six.effectiveN < 2.5, `six lines from one donor gave effective n of ${six.effectiveN}`);
  const noClustering = effectiveN({ donors: 1, linesPerDonor: 6, icc: 0 });
  assert.equal(noClustering.effectiveN, 6);
});

test("the isogenic design wins at any ICC above zero, and ties at zero", () => {
  for (const icc of [0.1, 0.2, 0.432, 0.6, 0.9]) {
    const { designs } = compareDesigns({ icc, totalSamples: 6 });
    const isogenic = designs.find((d) => d.id === "isogenic");
    const three = designs.find((d) => d.id === "unmatched-3");
    assert.ok(isogenic.effectiveN > three.effectiveN, `isogenic lost at ICC ${icc}`);
  }
  const atZero = compareDesigns({ icc: 0, totalSamples: 6 });
  assert.equal(atZero.designs.find((d) => d.id === "isogenic").designEffect, 1);
  assert.ok(atZero.caveats.length >= 3, "the isogenic claim must ship with its caveats");
});

test("the ICC reference says plainly that its source was not located", () => {
  assert.equal(ICC_REFERENCE.medianIcc.provenance, "owner-stated");
  assert.match(ICC_REFERENCE.caution, /No publication was found/);
  assert.equal(effectiveNCurve({ icc: 0.4, maxDonors: 12 }).length, 12);
});

test("off-target assays are complete and classified", () => {
  for (const assay of ASSAYS) {
    assert.ok(ASSAY_CLASSES[assay.class], `${assay.id} has unknown class ${assay.class}`);
    assert.ok(assay.principle && assay.material && assay.constraints, `${assay.id} is underspecified`);
  }
  assert.ok(ASSAYS.some((a) => a.class === "in-situ"));
  assert.ok(ASSAYS.some((a) => a.class === "in-vitro"));
  assert.ok(ASSAYS.some((a) => a.role === "verification"));
  assert.equal(ASSAYS.find((a) => a.id === "aid-seq").dnaInput.value, 2);
  assert.equal(ASSAYS.find((a) => a.id === "circle-seq").dnaInput.value, 25);
});

test("a recommended panel is always orthogonal and verified for an IND", () => {
  const panel = recommendPanel({ cellType: "hipsc", dnaAvailability: "abundant", indEnabling: true });
  assert.ok(panel.assays.some((a) => a.class === "in-situ"));
  assert.ok(panel.assays.some((a) => a.class === "in-vitro"));
  assert.ok(panel.assays.some((a) => a.role === "verification"));
  assert.deepEqual(panel.gaps, []);
  assert.equal(panel.rules, REGULATORY_RULES);
});

test("limited DNA selects the low-input assay; primary cells select the tag-free assay", () => {
  const limited = recommendPanel({ dnaAvailability: "limited" });
  assert.ok(limited.assays.some((a) => a.id === "aid-seq"));
  assert.ok(!limited.assays.some((a) => a.id === "circle-seq"));

  const primary = recommendPanel({ cellType: "primary" });
  assert.ok(primary.assays.some((a) => a.id === "discover-seq"));
  assert.ok(!primary.assays.some((a) => a.id === "guide-seq"));
});

test("multiplexed editing adds a structural assay; research-only skips verification and says so", () => {
  const multi = recommendPanel({ multiplexed: true });
  assert.ok(multi.assays.some((a) => a.class === "structural"));

  const research = recommendPanel({ indEnabling: false });
  assert.ok(!research.assays.some((a) => a.role === "verification"));
  assert.deepEqual(research.gaps, []);
});

test("six personas, unique ids, unique routes, each with an objective", () => {
  assert.equal(PERSONAS.length, 6);
  assert.deepEqual(PERSONAS.map((p) => p.tier), [1, 2, 3, 4, 5, 6]);
  assert.equal(new Set(PERSONA_IDS).size, 6);
  assert.equal(new Set(PERSONAS.map((p) => p.route)).size, 6);
  for (const p of PERSONAS) {
    assert.ok(p.objective.length > 30, `${p.id} objective is too thin`);
    assert.ok(p.teaches.length >= 4, `${p.id} lists too few topics`);
    assert.match(p.route, /^\/tier\//);
  }
  assert.equal(getPersona("bench").tier, 3);
  assert.equal(getPersona("nobody"), null);
});

test("explainFor falls back to the nearest depth that has a variant", () => {
  const variants = { public: "plain words", scientist: "variance components" };
  assert.equal(explainFor(variants, "public"), "plain words");
  assert.equal(explainFor(variants, "scientist"), "variance components");
  assert.equal(explainFor(variants, "student"), "plain words", "student is nearer to public than to scientist");
  assert.equal(explainFor(variants, "cgt"), "variance components", "cgt is nearer to scientist");
  assert.equal(explainFor({}, "bench"), "");
});
