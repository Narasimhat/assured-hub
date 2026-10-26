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

## Enzyme-aware trace analysis

QC 0.6.0 is bundled in `/qc/` and Bench `/studio/`. Mad7, AsCas12a and
LbCas12a imports and manual entry use the shared nuclease registry and validator.
Indels, adaptive larger events and paired deletions model the staggered cut span;
alignment uses both strand boundaries. Existing HDR/partial-conversion, genotype,
clone-ranking and report workflows are retained. Reports/CSV record the enzyme,
config, analysis model and both predicted cuts. Computational fixtures and browser
AB1 checks cover the added paths; enzyme-specific laboratory calibration remains
pending. See `apps/qc/README.md` for assumptions and limitations.

## Shared SNP donor policy

All enzymes now use the Cas9-style SNP donor policy: exactly 127 nt, asymmetric
36/91 cut-centered reference windows (with the same sequence-end handling), and
opposite-guide ordering. Stale tag format, arm-length or strand settings do not
change a SNP donor. Matched donors retain shared blockers for co-delivery where
feasible; otherwise the design falls back or flags the incompatible geometry.
Synonymous PAM disruption is preferred. If unavailable, synonymous PAM-proximal
seed changes are proposed with full protein/splice checks and an explicit
unscored-protection warning. Tag format/arm controls remain available for tags.

SNP donor policy 2 places the 91 nt flank toward the PAM and the 36 nt flank
on the opposite side of the nominal target-strand cut. This mirrors the reference
layout for 5′-PAM Cas12a/Mad7 while retaining Cas9's 3′-PAM behavior. The policy is
a computational design heuristic; enzyme-specific HDR and strand preferences
still require experimental validation.

### Workflow agent

In Bench's Design screen, fetch or upload a reference, choose the modification and fill its details, then use **Workflow agent → Compare enzymes and recommend**. Select the enzymes available in your lab and choose protection-first, closest-cut, or fewer-blocking-changes priority. The agent runs the existing design engine for each enzyme in a cancellable Web Worker, with no remote model calls. The full knockout, protein-substitution, internal-tag and terminal-tag tools supply the calculations.

Blocked or incomplete designs cannot be recommended. Configured release gates precede the chosen priority; exact ties remain ties, with alphabetical display only. Cut distance, computed guide–donor protection, documented blocking changes and primer checks explain the ranking. This is a rule-based decision agent, not a calibrated predictor of experimental efficiency. It does not compare base editing or prime editing in this version. Exact genomic SNPs are included after the variant is entered in the Genomic SNP tool and its design button is used; the agent can compare alternatives even when the initial enzyme has no guide. Missing genome-wide specificity or activity evidence stays unknown. SpRY PAM-only substitutions do not become blocking protection.

**Use [enzyme] design** adopts the computed result into the normal report, Order and QC path. The agent records its version, enzyme-config version, priority, compared/excluded enzymes, reference/input SHA-256, reasoning and limitations. Recommendation JSON and the applied design's HTML/QC JSON retain that record; saved Bench projects retain it too. Changing design inputs clears the recommendation and previous QC, and cancels a running comparison. Guide sequences, direct-repeat verification and prior weak-protection acknowledgements are not transferred between enzymes.

The next-step checklist explains donor/pair use and screening. Existing AssuredQC clone decisions and ranking remain the source for downstream clone selection; final clones still need independent confirmation. Comparison does not send orders, change delivery conditions, or choose an unsupported editing technology.

Workflow agent 1.1.0 also compares exact genomic SNPs using the existing forward/reverse-coordinate, allele, blocking-policy and nucleotide-assertion checks. Applied genomic options retain the standard report/ordering/QC handoff and recommendation evidence. A genomic variant edit cancels comparison and clears the captured request; returning to the tool restores the saved reference/variant. External splice-check results are not silently transferred to different blocker sets.

The Workflow agent starts compact. Open **Comparison settings** to restrict enzymes or change priorities, **Compare options and choose a design** to inspect candidates, and **Evidence, ranking details and export** for the audit. Applying a design collapses the agent and opens the full design report.


Workflow agent 1.2.0 loads the shared Lindel model lazily for SpCas9 knockout comparisons, so its selected guide pair matches the outcome-ranked standard Designer path. Other enzymes and HDR edits never receive the SpCas9 model. Recommendation reasons/audits record whether Lindel was applied or why the engine used its fallback; missing predictions remain unknown. Predicted loss-of-function allele shares are not cutting efficiency and are not compared as cross-enzyme performance scores. Stored model weights/failure messages are removed from agent requests, and a later comparison retries a failed model load.
