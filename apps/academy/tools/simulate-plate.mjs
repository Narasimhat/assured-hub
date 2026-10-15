// usage: node simulate-plate.mjs <design.qc-design.json> <seed> <outDir> [equipment cloning supplement]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { simulate } from "../src/simulator/index.js";
const [designPath, seedArg, outDir, equipment = "high_throughput", cloning = "automated_dispenser", supplement = "clone_r"] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(designPath, "utf8"));
const { record, truth } = simulate(spec, { equipment, cloning, supplement }, Number(seedArg));
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "wetlab.record.json"), JSON.stringify(record, null, 1));      // student-facing
writeFileSync(path.join(outDir, "plate.truth.json"), JSON.stringify(truth, null, 1));          // NOT student-facing
console.log(JSON.stringify({ seed: Number(seedArg), calls: truth.clones.map((c) => c.call), conditioning: truth.conditioning }));
