// How closely does Assured QC's own readout recover the simulated truth? Reads <platesDir>/*/plate.truth.json and */qc/results.csv.
// usage: node evaluate-plates.mjs <platesDir> <out.csv>
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseCsv } from "../../qc/src/sheet.js";
import { callFromQcRow } from "../src/grader/index.js";
const [dir, outCsv] = process.argv.slice(2);
const rows = [];
for (const name of readdirSync(dir).sort()) {
  const tp = path.join(dir, name, "plate.truth.json"), rp = path.join(dir, name, "qc", "results.csv"), cp = path.join(dir, name, "qc", "recommendation.csv");
  if (!existsSync(tp) || !existsSync(rp)) continue;
  const truth = JSON.parse(readFileSync(tp, "utf8")); const byClone = new Map(truth.clones.map((c) => [c.clone, c]));
  const [head, ...body] = parseCsv(readFileSync(rp, "utf8")); const idx = Object.fromEntries(head.map((h, i) => [h, i]));
  const [rh, ...rb] = parseCsv(readFileSync(cp, "utf8")); const ri = Object.fromEntries(rh.map((h, i) => [h, i]));
  const ranked = rb.filter((r) => r[ri.rank] !== "").sort((a, b) => Number(a[ri.rank]) - Number(b[ri.rank])); const top = ranked.length ? ranked[0][ri.sample] : null;
  const best = truth.clones.filter((c) => c.expected.tier === "best").map((c) => c.clone);
  for (const r of body) {
    const row = Object.fromEntries(head.map((h) => [h, r[idx[h]]])); const t = byClone.get(row.sample);
    rows.push({ plate: name, mission: name.split("_")[0], clone: row.sample, truth: t.call, qc_call: callFromQcRow(row), qc_clone_call: row.clone_call, top_is_best: top !== null && best.includes(top) });
  }
}
writeFileSync(outCsv, ["plate,mission,clone,truth,qc_call,qc_clone_call,top_is_best", ...rows.map((r) => [r.plate, r.mission, r.clone, r.truth, r.qc_call, r.qc_clone_call, r.top_is_best].join(","))].join("\n"));
const agree = rows.filter((r) => r.truth === r.qc_call).length;
const plates = [...new Set(rows.map((r) => r.plate))];
const topOk = plates.filter((p) => rows.find((r) => r.plate === p).top_is_best).length;
const per = {}; for (const r of rows) { per[r.mission] ||= [0, 0]; per[r.mission][1] += 1; if (r.truth === r.qc_call) per[r.mission][0] += 1; }
const conf = {}; for (const r of rows) if (r.truth !== r.qc_call) { const k = `${r.truth} -> ${r.qc_call} (${r.qc_clone_call})`; conf[k] = (conf[k] || 0) + 1; }
console.log(JSON.stringify({ plates: plates.length, clones: rows.length, agree, pct: Math.round(1000 * agree / rows.length) / 10, perMission: per, rank1IsBestOnPlates: `${topOk}/${plates.length}`, disagreements: conf }, null, 1));
