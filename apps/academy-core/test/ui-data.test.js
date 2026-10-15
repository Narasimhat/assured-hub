import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUiData, renderFiles, CALL_TO_STATUS } from "../tools/build-ui-data.mjs";

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = buildUiData();
const rc = (s) => [...s].reverse().map((c) => ({ A: "T", C: "G", G: "C", T: "A" }[c])).join("");
const genbank = (acc) => { const t = readFileSync(path.join(CORE, "references", `${acc}.gb`), "utf8"); return t.slice(t.indexOf("ORIGIN") + 6).replace(/\/\/[\s\S]*$/, "").replace(/[^acgtn]/gi, "").toUpperCase(); };
const REF = { "mission-apoe": ["NG_007084.2", "apoe_r176c_run.reconstructed.design.json"], "mission-hbb": ["NG_059281.1", "HBB_E7V.engine.design.json"] };
const design = (f) => JSON.parse(readFileSync(path.join(CORE, "data", "designs", f), "utf8"));

test("the generated files on disk are exactly what the generator produces (no drift)", () => {
  const { texts, copies } = renderFiles(data);
  for (const { path: p, content } of texts) assert.ok(existsSync(p) && readFileSync(p, "utf8") === content, `${path.basename(p)} has drifted: run npm run build:ui-data`);
  for (const { from, to } of copies) assert.ok(existsSync(to) && Buffer.compare(readFileSync(from), readFileSync(to)) === 0, `${path.basename(to)} is not a byte-identical copy`);
});

test("each mission's design window equals the stored GenBank record, and every guide and donor is checked against that record", () => {
  for (const m of data.missions) {
    const [acc, file] = REF[m.id], gb = genbank(acc), d = design(file), win = d.reference.sequence.toUpperCase(), found = gb.indexOf(win);
    assert.ok(found >= 0 && gb.indexOf(win, found + 1) === -1, `${m.id}: the design window must occur exactly once in ${acc}`);
    for (const g of m.recommendedGuides) {
      const fw = win.indexOf(g.sequence), re = win.indexOf(rc(g.sequence));
      assert.ok(g.strand === "+" ? fw >= 0 : re >= 0, `${m.id} ${g.name}: spacer not on its stated strand of ${acc}`);
      const site = g.strand === "+" ? fw : re, pam = g.strand === "+" ? win.slice(site + 20, site + 23) : rc(win.slice(site - 3, site));
      assert.equal(pam, g.pam); assert.match(pam, /^[ACGT]GG$/);
      assert.equal(g.cutPosition, g.strand === "+" ? site + 17 : site + 3);
      assert.ok(g.cutDist <= 15, `${m.id} ${g.name}: cut is ${g.cutDist} bp from the edit`);
    }
    for (const s of m.ssodns) {
      assert.equal(s.sequence.length, 127); assert.equal(s.totalLength, 127);
      assert.equal(s.pamDistalArm, 36); assert.equal(s.pamProximalArm, 91);
      const sense = s.strand === "-" ? rc(s.sequence) : s.sequence, at = win.indexOf(sense.slice(0, 20));
      assert.ok(at >= 0, `${m.id} ${s.name}: donor start is not in ${acc}`);
      const diffs = [...sense].flatMap((c, k) => (c !== win[at + k] ? [at + k] : []));
      const g = m.recommendedGuides.find((x) => x.name === s.forGuide), declared = [...d.donors[m.ssodns.indexOf(s)].carriesMarkers].sort((a, b) => a - b);
      assert.deepEqual(diffs, declared, `${m.id} ${s.name}: the donor differs from ${acc} at ${diffs}, but the design declares ${declared}`);
      const dist = g.strand === "+" ? g.cutPosition - at : at + 127 - g.cutPosition;
      assert.equal(dist, 36, `${m.id} ${s.name}: the PAM-distal arm is ${dist}, not 36`);
    }
  }
});

test("the amino-acid changes are the ones the missions claim", () => {
  const edits = Object.fromEntries(data.missions.map((m) => [m.id, m.silentChanges.join(" | ")]));
  assert.match(edits["mission-apoe"], /p\.D172D \(GAC>GAT\)/); assert.match(edits["mission-apoe"], /p\.L177L \(CTG>CTA\)/);
  assert.match(edits["mission-hbb"], /p\.L4L \(CTG>CTT\)/); assert.match(edits["mission-hbb"], /p\.P6P \(CCT>CCG\)/);
  const hbb = data.projects.find((p) => p.id === "proj-hbb-e7v-design"); assert.match(hbb.target.aminoAcidChange, /Glu7Val/);
  assert.ok(data.missions.every((m) => !m.silentChanges.some((c) => /p\.R176C|p\.E7V/.test(c))), "the intended edit is not listed as a blocking change");
});

test("CACNB2 and CEP83 are retired from the verified set, with reasons", () => {
  const ids = data.missions.map((m) => m.id);
  assert.ok(!ids.includes("mission-cacnb2") && !ids.includes("mission-cep83"));
  assert.deepEqual(data.unverified.map((u) => u.id).sort(), ["mission-cacnb2", "mission-cep83"]);
  assert.ok(data.unverified.every((u) => u.reason.length > 60));
});

test("the UI's clone status map covers exactly the call categories the QC engine can emit", () => {
  const src = readFileSync(path.join(CORE, "..", "qc", "src", "genotype.js"), "utf8");
  const emitted = new Set([...src.matchAll(/"((?:homozygous|heterozygous|edit_plus|two_partials|compound_heterozygous|mixed|unclear)[a-z_]*)"/g)].map((m) => m[1]).filter((c) => c !== "homozygous"));
  assert.deepEqual([...emitted].sort(), Object.keys(CALL_TO_STATUS).sort(), "genotype.js and CALL_TO_STATUS disagree: update the generator and the UI status table");
});

test("real-trace data: every trace file exists, every clone is matched to the lab table, and the agreement summary is the one reported", () => {
  const clones = data.projects.flatMap((p) => p.clones);
  assert.equal(clones.length, 10);
  for (const c of clones) { assert.ok(existsSync(path.join(CORE, "..", "academy-ui", "public", c.ab1TraceUrl)), c.ab1TraceUrl); assert.ok(c.labCall && c.engineCall); }
  const by = (a) => clones.filter((c) => c.labCall.agreement === a).length;
  assert.deepEqual([by("agrees"), by("lab had no call"), by("differs")], [9, 1, 0]);
});

test("GRCh38 check counts shown in the UI come from the verification table", () => {
  const v = Object.fromEntries(data.missions.map((m) => [m.id, m.verification]));
  assert.deepEqual([v["mission-apoe"].passed, v["mission-apoe"].total], [18, 18]);
  assert.equal(v["mission-hbb"].failed.length, 2);
  assert.ok(v["mission-hbb"].failed.some((c) => /role 'intended'/.test(c)) && v["mission-hbb"].failed.some((c) => /offsetFromEdit/.test(c)));
});

test("every design's stated reference.offset is its window's position in the stored GenBank record", () => {
  for (const [file, acc] of [["apoe_r176c_run.reconstructed.design.json", "NG_007084.2"], ["APOE_R176C.engine.design.json", "NG_007084.2"], ["HBB_E7V.engine.design.json", "NG_059281.1"]]) {
    const d = design(file), gb = genbank(acc), at = gb.indexOf(d.reference.sequence.toUpperCase());
    assert.ok(at >= 0 && gb.indexOf(d.reference.sequence.toUpperCase(), at + 1) === -1, `${file}: window not unique in ${acc}`);
    assert.equal(d.reference.offset, at, `${file}: stated offset ${d.reference.offset} but the window sits at ${at} in ${acc}`);
  }
});
