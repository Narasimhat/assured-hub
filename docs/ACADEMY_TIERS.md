# The six-tier Academy

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
| `personas.js` | The six tiers, as data. |

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

| Tier | Route | Component | Interactive piece |
|---|---|---|---|
| 1 Laypersons & patient advocates | `#/tier/public` | `Tier1PatientJourney` | Six-step blood-draw-to-model timeline, ethics, glossary. No numbers. |
| 2 Students | `#/tier/student` | `Tier2ExonSandbox` | Exon/isoform map with live feedback on KO target choice; cut-distance and donor-blocking checks for KI against the engine's own limits. |
| 3 Bench users | `#/tier/bench` | `Tier3WetLabSimulator` | Nine-step state machine; six scorable deviations plus design quality; live pool score, surviving clones and edited clones with the mechanism for each loss. |
| 4 Principal scientists | `#/tier/scientist` | `Tier4PowerExplorer` | Design-effect explorer with ICC slider; CRISPR-MiX stoichiometry, strand choice and refractory loci; analysis notes. |
| 5 Core facilities | `#/tier/core` | `Tier5CoreFacility` | Plate and seedbank planner; ISSCR five tenets as a 23-item checklist persisted locally. |
| 6 CGT & CMC | `#/tier/cgt` | `Tier6OffTargetMatrix` | Panel recommender over nine assays with gap reporting; regulatory rules; GMP transition notes. |

The persona switcher changes which material is shown and how deeply it is explained. It hides nothing:
any tier can open any other tier's page.

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
| `packages/assured-protocol/test/protocol.test.js` | 28 tests: provenance is legal everywhere, the two pulse widths stay apart, Table 7 totals 15 uL, every deviation lowers the outcome and returns a mechanism, omitting CloneR2 drops below the 46-clone benchmark, design quality is scored against `@assured/rules` and not a copy, the isogenic design wins at every ICC above zero, a recommended IND panel is always orthogonal and verified. |
| `apps/studio/test/academyHandoff.test.js` | 7 tests: round trip, unrelated fragments ignored, damaged payload reports instead of throwing, non-experiment JSON refused, design output cannot be injected, unicode survives, `clearHandoff` keeps other fragment state. |
| `tests/contract/academy-bench-handoff.test.js` | 5 tests pinning the two encoders together. |
| `apps/academy-ui/scripts/render-smoke.cjs` | Extended from 55 to 74 renders: every tier page, every tier named by `@assured/protocol`, the App at all 13 routes including an unknown one, "Teaching model" present on every page with a computed outcome, both pulse widths present, and the ICC caveat present. |

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
