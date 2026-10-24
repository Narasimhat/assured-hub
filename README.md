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

## Enzyme support in the Hub

The bundled **Bench** (`/studio/`) and **Design** (`/design/`) apps support SpCas9,
AsCas12a, LbCas12a and Mad7 with the same modification workflow: paired knockouts,
nearby point edits, matched donors, primers, reports and exports. This synchronizes
Assured_CRISPR_Design PR #24 and assured-bench PR #2 into the Hub's local copies.
Enzyme records (config 1.1.0) live in `@assured/spec/enzyme-config`; both design
engines and the shared QC validator consume those records. The standalone QC
and Bench QC entry points use the same enzyme-aware validator, including
reverse-read PAM and staggered-cut geometry.

Cas9 remains the default. Cas12a/Mad7 activity and CFD scores are uncalibrated;
canonical-PAM findings are categorical. Full crRNA ordering requires a verified
repeat and documentation, and vendor compatibility must be checked. Nominal cut
offsets, repeat documentation, reference-tool comparisons and genome-wide
specificity still require validation. Academy's existing teaching presets remain
illustrative and do not establish experimental performance for the new enzymes.
