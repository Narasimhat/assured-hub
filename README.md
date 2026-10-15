# assured-hub

Local monorepo skeleton for the ASSURED Academy & Virtual Bench: the Design app, the QC app, a headless Academy layer, and two shared packages.
Built from pinned commits (QC `462d246`, Design `820b196`) as a single initial commit; the git history of those two repositories is not carried over (the originals keep it). Status: skeleton. See `docs/ARCHITECTURE.md` for what exists, `docs/TEST_REPORT.md` for what was verified, and `docs/MIGRATION.md` for how the apps were changed and a history-preserving alternative. The nested `.github/workflows` inside `apps/*` are inert (GitHub only reads the root); the root `.github/workflows/ci.yml` is the one that runs.

```
apps/qc                              Assured_QC (Vite + React), one file changed
apps/design                          Assured_CRISPR_Design whole repo (app in assured-crispr-designer/, serverless in api/), six files changed
apps/academy                         missions, project envelope, wet-lab simulator, grader, tools   (no UI yet)
packages/assured-spec                assured-qc-design/1 contract: schema id, edit kinds, validator
packages/assured-rules               engine limits, donor tiers, lab conventions
tests/contract                       Design export must validate with the shared validator
demo/                                graded demo submissions and one full plate with traces and QC output
docs/                                ARCHITECTURE.md, MIGRATION.md, TEST_REPORT.md, refactor.patch
```

Academy tools (run from `apps/academy`):

```
node tools/build-missions.mjs                       # regenerate the 3 missions from the real Design engine
python tools/run_plate.py <design.json> <seed> <outDir>   # simulate -> synthetic traces -> Assured QC engine
node tools/make-submission.mjs ...                  # QC-processed plate -> student project (see file header)
node tools/grade-project.mjs <project.json> <key.json> <out.json> [assignedSeed]
node tools/evaluate-plates.mjs <platesDir> <out.csv>   # QC readout vs simulated truth
```

`node_modules` are not included. `npm install` at the root creates the workspace links; I could not run that step where this was built.
Simulator parameters are illustrative teaching defaults, not measured values.
