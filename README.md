# assured-hub

Monorepo for the ASSURED Academy & Virtual Bench: the Design app, the QC app, the learner-facing Academy UI, a headless Academy core, and two shared packages.
Built from pinned commits (QC `462d246`, Design `820b196`) as a single initial commit; the git history of those two repositories is not carried over (the originals keep it). See `docs/ARCHITECTURE.md` for what exists, `docs/ACADEMY_TIERS.md` for the three-tier Academy and the Bench hand-off, `docs/AUDIT_2026-10-16.md` for the audit that preceded them, `docs/TEST_REPORT.md` for what was verified, `docs/FINDINGS.md` for defects found and what is still illustrative, and `docs/MIGRATION.md` for how the apps were changed and a history-preserving alternative. The nested `.github/workflows` inside `apps/*` are inert (GitHub only reads the root); the root `.github/workflows/ci.yml` is the one that runs.

```
apps/qc                              Assured_QC (Vite + React), one file changed
apps/design                          Assured_CRISPR_Design whole repo (app in assured-crispr-designer/, serverless in api/), six files changed
apps/studio                          ASSURED Bench: design engine, order sheets, trace QC and clone decisions in one app
apps/academy-core                    missions, project envelope, wet-lab simulator, grader, tools, verified designs and UI data generator
apps/academy-ui                      learner-facing app (React + TypeScript + Tailwind): three learner tiers, curriculum, pipeline workbench, missions, real traces
packages/assured-spec                assured-qc-design/1 contract: schema id, edit kinds, validator
packages/assured-rules               engine limits, donor tiers, lab conventions
packages/assured-protocol            ASSURED and CRISPR-MiX parameters, culture conventions, IsoCell yields, donor-ICC power, off-target assays - every value with its provenance
tests/contract                       Design export must validate with the shared validator; the Academy-to-Bench hand-off must round-trip
demo/                                graded demo submissions and one full plate with traces and QC output
docs/                                ARCHITECTURE.md, ACADEMY_TIERS.md, AUDIT_2026-10-16.md, FINDINGS.md, MIGRATION.md, STUDIO_REVIEW.md, TEST_REPORT.md, refactor.patch
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

Simulator parameters are illustrative teaching defaults, not measured values. This applies to
`apps/academy-core/src/simulator/params.js` and to `packages/assured-protocol/src/wetlabModel.js`;
both say so in the file and in the UI. Everything else in `@assured/protocol` carries a provenance
level of `published`, `owner-stated` or `illustrative`, and the Academy renders it.
