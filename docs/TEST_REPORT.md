# Test report

Host: Windows, Node 26.10.0 / npm 11.19.1 (conda env), Python 3.11. Sandboxed: piped child processes are blocked, so every test file was run in its own `node --test --test-isolation=none` process (equivalent to the default one-process-per-file mode). On a normal machine use `npm test`.

## 1. Refactor did not change behaviour

| Suite | Baseline (pinned originals) | After refactor (hub) |
|---|---|---|
| Assured QC | 36 files, 220/220 tests pass | 36 files, 220/220 pass |
| Assured CRISPR Design | 20 files ran, 304/304 pass | 20 files, 304/304 pass |

`cli-runner.test.js` (Design) is excluded in both columns: it spawns child processes, which this sandbox blocks (it timed out in the baseline too).

- **Golden export:** the QC design hand-off exported by the Design app for its seven test designs is byte-identical before and after (59,427 bytes, SHA-256 `905099b04dba3bd2...`). The original QC validator and the `@assured/spec` validator give identical verdicts on all seven.
- **Static import check** (stand-in for the build that could not run): every import specifier in both apps and both packages resolves.

| Scope | Files | Import specifiers | Unresolved |
|---|---|---|---|
| QC app (hub) | 109 | 438 | 0 |
| Design app (hub) | 50 | 242 | 0 |
| @assured/spec | 3 | 2 | 0 |
| @assured/rules | 4 | 3 | 0 |
| QC original | 109 | 438 | 0 |
| Design original | 50 | 237 | 0 |

- **Two regressions found by the baseline and fixed:** root `"type": "module"` broke the Design `api/` functions; `audit-claims.test.js` grepped source text for a constant that moved (the only existing test edited, see `MIGRATION.md`).
- **Not run:** `vite build` for either app (sandbox blocks the esbuild service). Builds are unverified.

## 2. New tests

| Suite | Files | Tests | Pass |
|---|---|---|---|
| `@assured/spec` | 1 | 3 | 3 |
| `@assured/rules` | 1 | 4 | 4 |
| Design to QC contract | 1 | 2 | 2 |
| Academy (envelope 5, simulator 7, grader 10) | 3 | 22 | 22 |

Simulator tests check mechanisms, not only that code runs: a donor without silent blocking changes yields under 0.6x the HDR alleles; cuts 25 to 28 bp from the edit yield under 0.5x; one guide edits fewer alleles than two (0.547 vs 0.794 of alleles in the knockout mission); the frugal tier has no dispenser.

## 3. Does Assured QC recover the simulated plates?

25 plates (3 missions x seeds 101 to 108, plus seed 20261015), 300 clones. Each plate was simulated, turned into synthetic traces with Assured_QC's own generator, and analysed by Assured QC's own CLI. QC's call, mapped to the Academy vocabulary by the shipped `callFromQcRow`, was compared with the simulated truth.

- **Exact agreement: 293/300 clones (97.7%).** By mission: m1 107/108, m2 96/96, m3 90/96.
- QC's rank-1 recommendation is a truth-best clone on **25/25** plates.
- The 7 disagreements are all QC `mixed` calls on clones that are not mosaic in the truth (6 blocking-only clones in m3, 1 biallelic knockout in m1).
- First pass agreement was 91.3%. Eighteen of the 25 misses were my mapping missing two QC labels (`homozygous_wt`, `two_partials`); the engine was right, I extended the mapping and re-measured with the shipped code.
- **Caveat:** the traces and the QC engine share one linear-mixture model (both come from Assured_QC), so this measures **pipeline self-consistency, not accuracy on real chromatograms**. The QC README itself notes there is no sequencing-confirmed truth for its laboratory pairs.

## 4. Grading demo (APOE R176C SNP mission, three seeds, each end to end)

"Reference solver" = reference design, QC's readout as calls, QC rank-1 selected. "Flawed" = a design the real Design engine produced with one guide cutting 20 bp from the edit (limit 15), then expanding and selecting a clone QC flagged as a decoy.

| Student | Seed | Overall | Design | Plate | Selected | Critical | Failed design checks |
|---|---|---|---|---|---|---|---|
| S-good-201 | 201 | 100 | 100 | 100 | A01 (best) | - | - |
| S-good-202 | 202 | 100 | 100 | 100 | A06 (best) | - | - |
| S-good-203 | 203 | 100 | 100 | 100 | A07 (best) | - | - |
| S-flawed-201 | 201 | 76 | 84 | 68 | A02 (decoy) | unsafe-expansion,unsafe-selection | guide-count,cut-distance:APOE_gRNA1 |
| S-flawed-202 | 202 | 73 | 84 | 62 | A01 (decoy) | unsafe-expansion,unsafe-selection | guide-count,cut-distance:APOE_gRNA1 |
| S-flawed-203 | 203 | 74 | 84 | 64 | A08 (decoy) | unsafe-expansion,unsafe-selection | guide-count,cut-distance:APOE_gRNA1 |

Reference solver mean overall: 100. Flawed mean overall: 74.3. Plates differ across seeds. Plate and design weights (0.4 calls, 0.3 decisions, 0.3 selection; 50/50 design/plate) are pedagogical choices, not rules. Plates are conditioned to hold a best clone and a decoy, which flatters flawed designs.

## 5. Update: CI on GitHub's Linux runner (after publishing)

The first run of `.github/workflows/ci.yml` (run 38729203493, commit `ae9f08b`) concluded **success** for every step: root `npm install`, the test suites of `@assured/spec`, `@assured/rules`, Assured QC, Assured CRISPR Design (including `cli-runner.test.js`, which the sandbox could not run), and Academy, the contract tests, and `vite build` for both apps. This closes three items listed as unverified above: the builds, `cli-runner.test.js`, and a root `npm install`. I read step conclusions only, not the logs, so per-suite test counts from that run are not reported here. The lockfile that run generated (149 package entries, five workspace packages) was committed and CI now installs with `npm ci`.

Still not verified: a Vercel deployment of either app from this repository.
