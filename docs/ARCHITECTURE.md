# ASSURED Academy & Virtual Bench: architecture

Status: the Design and QC apps, a headless Academy core and the learner-facing Academy UI (`apps/academy-ui`) are in one repository. The UI shows real designs and real traces; see `docs/FINDINGS.md` for what was corrected when it was imported and what is still illustrative.

## The four stages and what implements each

| Stage | What the student does | Implemented by | State |
|---|---|---|---|
| 1. Strategy | Chooses KO / deletion / SNP-HDR / small-tag HDR / large-tag HDR | `apps/academy-core/missions/*/mission.json` (3 missions) and `src/envelope.js` (strategy vocabulary) | data + schema only, no UI |
| 2. Design | Designs guides and donor in the Design app and exports the QC design file | `apps/design` (unchanged behaviour), contract in `packages/assured-spec` | existing app |
| 3. Wet lab | Chooses bench set-up; receives the outcome a pooled-trace readout would give and a blinded 12-clone plate | `apps/academy-core/src/simulator` (seeded, headless) + `tools/plate_to_ab1.py` (traces via Assured_QC's own `sim_ab1.py`) | headless engine, no UI |
| 4. QC | Reads traces in Assured QC, calls each clone, decides expand / re-clone / discard, selects one clone | `apps/qc` (unchanged behaviour); calls recorded in the project file | existing app |
| Grading | Scores design and plate | `apps/academy-core/src/grader` | working, tested |

## One file travels between stages: `assured-academy-project/1`

It **wraps** the existing Design to QC contract (`assured-qc-design/1`) instead of redefining it:

```
{ schema: "assured-academy-project/1", stage, mission:{id}, student:{id, cohort},
   strategy:{choice}, design:<assured-qc-design/1>,
   wetlab:{schema:"assured-academy-wetlab/1", choices, outcome:{seed, ...observables}},
   qc:{calls:[{clone, call, decision}], selectedClone} }
```

Rules enforced by `validateAcademyProject`: pseudonymous student ids only (no names, e-mail addresses or spaces); the embedded design must pass the same validator Assured QC uses; per-clone truth keys (`truth`, `cloneTruth`, `answerKey`, `alleles`, `trueGenotype`) are refused anywhere in a student file.

## How blinding and grading work

- The plate is a pure function of **(student's design, bench choices, seed)**. The grader regenerates the truth from the project itself, so no answer key travels with a student file.
- Seeds should be issued per student by the cohort roster. `gradePlate(project, {assignedSeed})` refuses a project carrying a different seed.
- Because the **student's own design** feeds the simulator, design quality changes the plate through mechanisms the Design app already records: guide count, `offsetFromEdit`, and which donor carries which silent blocking marker.
- Plates are conditioned to hold at least one best clone and one decoy (mosaic or blocking-only) so they are solvable. Each truth file records `conditioning` (attempts, satisfied). A flawed design therefore still gets a best clone on its plate, which makes it look less bad than an unconditioned plate would.

## Shared packages (the point of the monorepo)

| Package | Holds | Read by |
|---|---|---|
| `@assured/spec` | `QC_SPEC_SCHEMA`, `EDIT_KINDS`, `validateDesignSpec`, `reverseSpec` (moved verbatim from Assured_QC `src/designSpec.js`) | Design (`qcExport.js`), QC (`designSpec.js` is now a re-export), Academy |
| `@assured/rules` | engine limits (`MAX_GUIDE_CUT_DISTANCE`=15, `MIN_PAIR_CUT_SEPARATION`=10, `MAX_BLOCKING_CHANGES`=3), donor tiers (`DONOR_FORMATS`, ssODN below 120 bp, cloned/AAV above 500 bp, `recommendDonorFormat`), and `LAB_CONVENTIONS` | Design (`designEngine.js`, `pairBlocking.js`, `donorFormat.js`), grader |

`LAB_CONVENTIONS` (two guides always; donors carry blocking changes for all guides; ssODN for SNPs and HA/V5, block with 250 bp arms, AAV with 500 bp arms) is **stated by the lab, not derived from the engine**, and every grader check says whether its source is `engine`, `convention`, `contract` or `key`. `test/rules.test.js` fails if the lab's arm lengths drift from the engine's defaults.

## Simulator parameters are placeholders

Every rate in `src/simulator/params.js` (cut probability, HDR rate, partial conversion, survival, polyclonality, pooled-readout noise) is an **illustrative teaching default**: not measured, and not from the ASSURED protocol. Calibrate with the lab's own data before using plates for assessment. Not modelled: frame-preserving indels, genotype-dependent survival. The equipment tier only decides whether a single-cell dispenser exists; there are no instrument-specific parameters.

## Privacy model

- Assured QC analyses traces entirely in the browser. The design app's lookups I found send a gene symbol and organism to its own `/api/*` endpoints; I did not find a caller for the primer-specificity endpoint.
- Student files carry only a pseudonymous id and cohort code. Do not add names or e-mail addresses.
- Real patient sequences (Bench Mode) should stay client-side. Check MDC/BIH hosting, IP and data-handling expectations before running a public classroom platform on a personal Vercel account.

## The learner-facing app: `apps/academy-ui`

React 18, TypeScript and Tailwind, imported from `Narasimhat/Assured_Academy` at `4ab6f72`. Its data layer no longer holds hand-typed designs. The flow is:

```
apps/academy-core/data/designs/*.design.json        Design-engine output (assured-qc-design/1), validated with @assured/spec
apps/academy-core/data/real_trace_qc/*              Assured QC output for the shipped traces + comparison with the lab's own calls
apps/academy-core/data/verification_grch38.csv      offline GRCh38 checks per design
apps/academy-core/references/*.gb, *.uniprot.json   NG_007084.2, NG_059281.1, MYD88 (Q99836)
            |  tools/build-ui-data.mjs (asserts codons, 36/91 arms, guides in window, call vocabulary)
            v
apps/academy-ui/src/data/generated/*.ts             missions, preset projects, examples, sample-file catalogue
apps/academy-ui/public/sample_data/**               real .ab1 files, designs, references, tables (copied byte for byte)
```

`npm run build:ui-data` regenerates; the `ui-data` test fails if anything on disk has drifted. Clone calls in the UI come from Assured QC output and are shown next to the lab's own call; the CSV import path labels its colour rule as the app's rule. The free-form design tool is a labelled teaching sketch, not the Design engine. The Virtual Lab is a decision game with no invented numbers. Deploy it as its own Vercel project with Root Directory `apps/academy-ui`.

## Not built

Cohort codes and authentication, PDF bench checklist, troubleshooting tree, SorCS1 missions from the paper (needs the reference sequence), a ClinVar-driven case selector, wiring the calibrated `academy-core` simulator into the UI (the Virtual Lab outcomes are still illustrative), and any Vercel deployment of the Academy app.
