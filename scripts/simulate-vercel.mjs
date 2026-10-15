// Run the install and build commands a Vercel project would run, in a clean checkout, and check the output directory.
// usage: node scripts/simulate-vercel.mjs <project root directory, e.g. apps/qc>
// Reads <root>/vercel.json (installCommand, buildCommand, outputDirectory) with Vercel's defaults for anything missing.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
const root = path.resolve(process.argv[2]);
const cfg = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8"));
const install = cfg.installCommand || "npm install", build = cfg.buildCommand || "npm run build", out = cfg.outputDirectory || "dist";
for (const [label, cmd] of [["install", install], ["build", build]]) {
  console.log(`\n$ (${label}, cwd ${root}) ${cmd}`);
  const r = spawnSync("bash", ["-c", cmd], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) { console.error(`${label} failed with status ${r.status}`); process.exit(1); }
}
const index = path.join(root, out, "index.html");
if (!existsSync(index)) { console.error(`missing ${index}`); process.exit(1); }
console.log(`\nOK: ${path.join(out, "index.html")} exists (${readFileSync(index).length} bytes)`);
