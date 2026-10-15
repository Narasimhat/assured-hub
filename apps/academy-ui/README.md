# ASSURED Academy: learner-facing app

React 18, TypeScript and Tailwind. Imported from `Narasimhat/Assured_Academy` at commit `4ab6f72` and changed so that what it shows is real or labelled as not. It is a static single-page app: no server, nothing is uploaded, and traces are read in the browser.

## What is real, and what is not

| Tab | What it shows | Status |
|---|---|---|
| Workbench (5 stages) | Three presets: APOE R176C and MYD88 knockout with real Sanger traces, HBB Glu7Val as an engine design with no traces | Designs come from the Assured CRISPR Design engine or, for APOE, are rebuilt from the lab run manifest (ssODNs reconstructed). Calls come from Assured QC and are shown beside the lab's own call. Bench values are Table 7 of the paper |
| Missions | APOE R176C and HBB Glu7Val with guides, ssODNs, blocking changes and GRCh38 check counts; CACNB2 and CEP83 shown as removed, with reasons | Generated and tested against the GenBank records |
| Training datasets | 21 real files with sizes and sha256 | Generated from files in the repository |
| Adapting the protocol | What the paper validated, what it names, what a lab must validate; a budget from your own prices | No prices or savings of its own |
| Academy | 12 lessons with quizzes | Statements about confluence, RNP mixes, electroporation, recovery, donor design, cloning and primer placement were corrected against the paper. **The rest is not audited line by line** |
| Virtual Lab | A decision game | Illustrative: no viability or efficiency numbers are predicted. Checks are against the published protocol |

The free-form "Try your own window" tool in Stage 1 is a teaching sketch, not the Design engine: it ranks NGG sites by distance to the target and lays out the 36/91 donor. It computes no efficiency or off-target score and designs no blocking change or primers.

Genome-wide specificity was not assessed for any design. Agreement of Assured QC with the lab's pipeline is not an independent genotype.

## Where the data comes from

`src/data/generated/*.ts` and the sample files under `public/sample_data/designs`, `references` and `real_trace_qc` are written by `apps/academy-core/tools/build-ui-data.mjs` from the verified designs, the Assured QC output and the GRCh38 check table. Do not edit them by hand. From the repository root:

```
npm run build:ui-data     # regenerate
npm run check:ui-data     # fail if anything has drifted (also checked by the academy-core tests)
```

## Develop, test, build

```
npm ci                                      # at the repository root
npm run dev -w assured-academy-ui
npm run test:ui                             # server-render every stage for every preset; fails on a crash or a stale string
npm run build:ui                            # tsc and vite build
```

`npm run dev:qc` and `npm run dev:design` start the other two apps from this package.

## Deploy

Create a separate Vercel project from this repository with **Root Directory** `apps/academy-ui`. `vercel.json` installs and builds from the repository root so the workspace links resolve. Returning visitors: the browser storage key was bumped to `assured_workbench_projects_v3` and the old key is removed on load, so nobody keeps the earlier hand-typed presets.

## Known limits

- The canvas chromatogram, downloads and clipboard need a real browser; the render smoke test cannot exercise them.
- The trace viewer centres on the edit (APOE) or the engine-inferred cut (MYD88) using `traceViewCentre`; for traces you load yourself it starts at a fixed base.
- Content decisions that are not mine: MDC/BIH wording in the footer and hub text, clearance to publish the real traces and lab tables, and the licence of the Design app. See `docs/FINDINGS.md`.
