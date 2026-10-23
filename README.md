# assured-hub

Monorepo for the ASSURED Academy & Virtual Bench: the Design app, the QC app, the learner-facing Academy UI, a headless Academy core, and two shared packages.
Built from pinned commits (QC `462d246`, Design `820b196`) as a single initial commit; the git history of those two repositories is not carried over (the originals keep it). See `docs/ARCHITECTURE.md` for what exists, `docs/TEST_REPORT.md` for what was verified, `docs/FINDINGS.md` for defects found and what is still illustrative, and `docs/MIGRATION.md` for how the apps were changed and a history-preserving alternative. The nested `.github/workflows` inside `apps/*` are inert (GitHub only reads the root); the root `.github/workflows/ci.yml` is the one that runs.

```
apps/qc                              Assured_QC (Vite + React), one file changed
apps/design                          Assured_CRISPR_Design whole repo (app in assured-crispr-designer/, serverless in api/), six files changed
apps/academy-core                    missions, project envelope, wet-lab simulator, grader, tools, verified designs and UI data generator
apps/academy-ui                      learner-facing app (React + TypeScript + Tailwind): curriculum, pipeline workbench, missions, real traces
packages/assured-spec                assured-qc-design/1 contract: schema id, edit kinds, validator
packages/assured-rules               engine limits, donor tiers, lab conventions
tests/contract                       Design export must validate with the shared validator
demo/                                graded demo submissions and one full plate with traces and QC output
docs/                                ARCHITECTURE.md, FINDINGS.md, MIGRATION.md, TEST_REPORT.md, refactor.patch
```

Academy UI data (from the repository root):

```
npm run build:ui-data        # regenerate apps/academy-ui/src/data/generated and the copied sample files
npm run check:ui-data        # fail if they have drifted
npm run test:ui              # server-render every stage for every preset
npm run build:ui             # tsc and vite build
```

Academy tools (run from `apps/academy-core`):

```
node tools/build-missions.mjs                       # regenerate the 3 missions from the real Design engine
python tools/run_plate.py <design.json> <seed> <outDir>   # simulate -> synthetic traces -> Assured QC engine
node tools/make-submission.mjs ...                  # QC-processed plate -> student project (see file header)
node tools/grade-project.mjs <project.json> <key.json> <out.json> [assignedSeed]
node tools/evaluate-plates.mjs <platesDir> <out.csv>   # QC readout vs simulated truth
```

`node_modules` are not included. `npm ci` at the root creates the workspace links.
Simulator parameters are illustrative teaching defaults, not measured values.

## FAIR workflow edition

The FAIR feature branch adds a fifth **FAIR Passport** step to Bench and shared provenance tools to Design and QC. Bench connects the active design, captured QC settings and original-input hashes to clone lineage, checks reattached originals, and retains passport history in saved/exported experiments. See [FAIR workflow and next releases](docs/FAIR_WORKFLOW.md). Records remain self-issued and unanchored; metadata completeness is not FAIR certification or biological validation. Deploy the FAIR edition as a separate Vercel project, leaving the original Hub's `main` unchanged.

The FAIR branch also supports optional [ASSUREDChain Sepolia anchoring](docs/SEPOLIA_ANCHORING.md) through a connected wallet, with a separate independently checked proof. Base passports remain self-issued; proof verification establishes a wallet transaction, not biological or regulatory approval.
