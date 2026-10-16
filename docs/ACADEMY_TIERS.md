# The three-tier Academy

What was added on top of the Academy described in `docs/ARCHITECTURE.md`, and the rules it follows.
The pre-change state and the reasoning are in `docs/AUDIT_2026-10-16.md`.

## Three rules

1. **Bench is read-only to Academy.** No Academy module imports `apps/studio/src`. The only change to
   Bench is an additive URL-fragment intake that hands its payload to the `parseProject` the Import
   button already uses.
2. **Numbers live in `@assured/protocol`, with provenance, and nowhere else.**
3. **Routes are hash routes, and modules that already worked were routed in rather than rewritten.**

## `packages/assured-protocol`

Plain ESM, one workspace dependency (`@assured/rules`), hand-written `.d.ts` so the TypeScript app and
the JavaScript apps can both read it. 28 unit tests.

| Module | Holds |
|---|---|
| `sources.js` | Citation registry and `stated(value, unit, provenance, sourceId)`. No number enters the package without one. |
| `protocols.js` | ASSURED and CRISPR-MiX as **two separate variants**, plus a re-export of the engine limits from `@assured/rules`. |
| `culture.js` | Hypoxia, Geltrex cold chain, Matrigel scaling, E8 to StemFlex, CloneR2, and the six scorable deviations with their mechanisms. |
| `isocell.js` | 256-chamber yield chain and seedbank planning. |
| `wetlabModel.js` | The Tier 3 scoring model. Teaching penalties over protocol baselines. |
| `icc.js` | Design-effect model for the isogenic argument. |
| `offTarget.js` | Nine assays, four classes, six regulatory rules, and a panel recommender that reports its own gaps. |
| `personas.js` | The three tiers, as data. |

### Provenance levels

`published` (a paper, with a DOI), `owner-stated` (the platform specification, attributed to a paper
but not confirmed against the published text here), `illustrative` (a teaching default, not measured).
Every level is rendered to the learner by `ProvenanceBadge`, and the smoke test fails if a tier page
with a computed outcome does not carry a "Teaching model" notice.

### Two things the specification would have broken, and what was done instead

**The Neon pulse.** `apps/academy-ui/src/data/benchDefaults.ts` records 1200 V / **30 ms** / 1 pulse,
cited to the ASSURED STAR Protocols paper. The specification asks for **20 ms**, which is CRISPR-MiX.
Both are correct for their own protocol. They are kept as two variants; a test asserts they stay
different, and the Tier 3 simulator uses "the other protocol's pulse" as its wrong answer rather than
an invented one.

**The donor ICC.** The specification quotes a median donor ICC of 43.2% over 9,013 genes in 51 donors.
A literature search did not find it. It is therefore not a constant: `ICC_REFERENCE.medianIcc` is a
starting value marked `owner-stated`, the Tier 4 explorer exposes ICC as a slider, a test asserts the
isogenic design wins at every ICC above zero, and the page states that the source was not located.
Add the citation and the caveat can go.

## The tiers

| Tier | Route | Page | Sections |
|---|---|---|---|
| 1 School & college students | `#/tier/student` | `TierStudents` | `PatientJourney` then `ExonSandbox` |
| 2 Research labs: PhD students, postdocs & PIs | `#/tier/lab` | `TierResearchLab` | `WetLabSimulator`, `PowerAndCrisprMix`, `OffTargetMatrix`, as three tabs |
| 3 Pluripotent stem cell core facilities | `#/tier/core` | `TierCoreFacility` | `CoreOperations` |

Pages compose sections from `components/tiers/sections/`; each section renders standalone and is
smoke-rendered on its own as well as through its page.

| Section | Interactive piece |
|---|---|
| `PatientJourney` | Six-step blood-draw-to-model timeline, ethics, glossary. No numbers anywhere. |
| `ExonSandbox` | Exon/isoform map with live feedback on knockout target choice; cut-distance and donor-blocking checks for knock-in, against the engine's own limits. |
| `WetLabSimulator` | Nine-step state machine; six scorable deviations plus design quality; live pool score, surviving clones and edited clones, with the mechanism for each loss. |
| `PowerAndCrisprMix` | Design-effect explorer with an ICC slider; CRISPR-MiX stoichiometry, strand choice and refractory loci; RNA-seq and XCI notes. |
| `OffTargetMatrix` | Panel recommender over nine assays with gap reporting, plus the expectations a reviewer will hold the evidence to. |
| `CoreOperations` | Plate and seedbank planner; ISSCR five tenets as a 23-item checklist persisted locally. |

The persona switcher changes which material is shown and how deeply it is explained. It hides nothing:
any tier can open any other tier's page.

### What happened to the six-tier draft

The first implementation had six tiers, adding a patient/public tier and a CGT industry & CMC tier.
The platform owner narrowed it to three. Nothing built was thrown away:

- The patient-journey timeline, glossary and ethics became **part one of the student tier**. It is the
  right reading level for a school pupil and the right starting point for a first-year undergraduate,
  and it still serves a patient or family member who finds it.
- The off-target assay matrix moved into the **research-lab tier**, because choosing what off-target
  evidence to generate is the decision a PI makes and then has to defend. The regulatory expectations
  stayed with it; the toggle that read "IND-enabling" now reads "heading for a clinical programme".
- The **GMP, CMC and IND-filing material was dropped**, since no remaining tier is an industry
  audience. It is in git history at `c4f148d` if it is ever wanted back.

`protocol.test.js` has a test named "the material from the retired tiers is still taught somewhere",
which fails if a later edit quietly drops the plain-language entry point, the germline ethics or the
off-target material along with the tiers they used to live in.

## Routes that were already built and now have one

`#/workbench` (the five-stage pipeline), `#/simulator` (Virtual Lab), `#/missions` (the GRCh38-verified
rare-disease missions), `#/tools` (the 21 real sample files), `#/frugal` (the low-resource worksheet).
All of these were compiled and smoke-rendered before this change and reachable by nobody.

## The Bench hand-off

```
Academy                                            Bench
apps/academy-ui/src/services/benchBridge.ts   -->  apps/studio/src/services/academyHandoff.js
benchHandoffUrl({gene, editType, ...})             readHandoff(location.hash) -> parseProject
         ../studio/#handoff=<base64url JSON>
```

- The payload is in the **fragment**, so it never reaches a server.
- Bench validates with `parseProject`, the same function the Import button uses. Nothing else is trusted.
- `designResult`, `qcResults`, `status` and `qcDesignSpec` are **stripped on arrival**: a link must not
  be able to put engine output into a workspace without the engine having run. Tested.
- The fragment is removed from the address bar once applied, so a reload does not re-apply it.
- The encoder exists on both sides because the two apps are separate builds.
  `tests/contract/academy-bench-handoff.test.js` transpiles the Academy's TypeScript encoder and feeds
  its output to Bench's real decoder; it fails the moment they disagree.

## Tests

| Where | What |
|---|---|
| `packages/assured-protocol/test/protocol.test.js` | 29 tests: provenance is legal everywhere, the two pulse widths stay apart, Table 7 totals 15 uL, every deviation lowers the outcome and returns a mechanism, omitting CloneR2 drops below the 46-clone benchmark, design quality is scored against `@assured/rules` and not a copy, the isogenic design wins at every ICC above zero, a recommended panel for a clinical programme is always orthogonal and verified, and the retired tiers' material is still taught. |
| `apps/studio/test/academyHandoff.test.js` | 7 tests: round trip, unrelated fragments ignored, damaged payload reports instead of throwing, non-experiment JSON refused, design output cannot be injected, unicode survives, `clearHandoff` keeps other fragment state. |
| `tests/contract/academy-bench-handoff.test.js` | 5 tests pinning the two encoders together. |
| `apps/academy-ui/scripts/render-smoke.cjs` | Extended from 55 to 74 renders: every tier page, every section on its own, every tier named by `@assured/protocol`, the App at all 10 routes including an unknown one, "Teaching model" present wherever something is computed, both pulse widths present, the ICC caveat present, and the folded-in material (journey, glossary, germline, off-target assays) still rendering while the dropped GMP section does not. |

## Known limits

- **The Tier 3 penalties are teaching defaults.** They are not measured effect sizes. The page says so,
  the module says so, and `MODEL_PROVENANCE` is rendered next to the result. Replace them with the
  lab's own numbers before using the simulator for assessment.
- **No SorCS1 sequence.** `NG_029120` is not in `apps/academy-core/references/`, and this repository
  does not ship sequence that no reference record backs (see `docs/FINDINGS.md`). The Tier 2 exon map
  is an explicitly-labelled schematic; sequence-level work hands off to Bench. Shipping the record and
  generating the designs with `tools/design-from-refseq.mjs` would upgrade it, with its own verification.
- **No lint.** This repository has no ESLint config; `tsc --strict` and the smoke test are the gate.
- **Accessibility of the newly routed modules.** `ToolLaunchpad` and the other previously unreachable
  components are weaker than the curriculum path (div-based controls, icons without `aria-hidden`).
  Routing them in does not fix that. The new tier pages were written to the standard of the curriculum
  path; the older modules still need a pass.
- **Not built:** cohort accounts, assessment that counts, PDF SOP export, a troubleshooting tree,
  wiring `academy-core`'s calibrated simulator into the Tier 3 page in place of the model in
  `wetlabModel.js`.
