# Applying the monorepo to the real repositories

**Update:** this repository was created by importing the files as one commit (not with `git subtree`), so it has no history from the two source repositories; the `git subtree` steps below are the alternative if you want that history. Everything else here still applies. The text below was written before the repository existed.

This folder was built from pinned commits: `Assured_QC` at `462d246` (branch `main`) and `Assured_CRISPR_Design` at `820b196` (branch `master`). The originals are untouched.

## What differs from the originals

Only eight existing files changed (`docs/refactor.patch`, generated with difflib; I reproduced all eight files byte for byte with an independent applier, but could not run `git apply` because git is not installed on the host I worked on):

| File | Change |
|---|---|
| `apps/qc/src/designSpec.js` | now re-exports from `@assured/spec` (was 150 lines; kept as a shim so old imports work) |
| `apps/qc/package.json` | + dependency `@assured/spec` |
| `apps/design/assured-crispr-designer/src/qcExport.js` | imports and re-exports `QC_SPEC_SCHEMA` |
| `.../src/designEngine.js` | imports and re-exports `MAX_BLOCKING_CHANGES` |
| `.../src/pairBlocking.js` | imports and re-exports `MAX_GUIDE_CUT_DISTANCE`, `MIN_PAIR_CUT_SEPARATION` |
| `.../src/donorFormat.js` | imports and re-exports the donor tiers and `recommendDonorFormat` |
| `.../test/audit-claims.test.js` | **the only existing test edited**: it grepped `designEngine.js` for the text `MAX_BLOCKING_CHANGES = 3`; it now checks the engine references the constant and asserts the value is 3 |
| `.../package.json` | + dependencies `@assured/rules`, `@assured/spec` |

## Steps (history-preserving import into a new repository)

```
mkdir assured-hub && cd assured-hub && git init -b main
git remote add qc https://github.com/Narasimhat/Assured_QC.git && git fetch qc
git subtree add --prefix=apps/qc 462d246
git remote add design https://github.com/Narasimhat/Assured_CRISPR_Design.git && git fetch design
git subtree add --prefix=apps/design 820b196
# copy from the delivered folder: packages/, apps/academy-core/, tests/, scripts/, docs/, demo/, package.json, README.md
git apply docs/refactor.patch
npm install            # creates ONE root lockfile and the @assured/* workspace links (not run by me)
git rm apps/qc/package-lock.json apps/design/assured-crispr-designer/package-lock.json   # once the root lockfile is committed
npm test -w @assured/spec -w @assured/rules -w assured-qc -w assured-crispr-designer -w assured-academy
```

Three things that went wrong while building this and are worth knowing:
1. **Do not set `"type": "module"` in the root `package.json`.** It turned the Design app's CommonJS `api/*.js` functions into ES modules (`require is not defined`). `api-lookups.test.js` caught it; the root manifest now omits it.
2. `qcExport.js` and QC's `designSpec.js` use CRLF line endings. The patch preserves them; if you re-save them in an editor that normalises line endings, git will show every line as changed.
3. Per-app `package-lock.json` files go stale once the apps depend on workspace packages. Use the single root lockfile.

## Vercel (not tested)

Keep both existing projects and their URLs. For each, set **Root Directory** to `apps/qc` and `apps/design` respectively and turn on *Include source files outside of the Root Directory*. The Design project must keep `apps/design` (not the nested app folder) as its root because its serverless functions live in `apps/design/api/`. Its current `vercel.json` runs `cd assured-crispr-designer && npm install`, which may not resolve `@assured/*` workspace links; the likely fix is to install and build from the hub root:

```
"installCommand": "cd ../.. && npm ci",
"buildCommand": "cd ../.. && npm run build -w assured-crispr-designer",
"outputDirectory": "assured-crispr-designer/dist"
```

I could not test this. Create a **preview** deployment per project and check it before touching any production domain, and keep the old repositories connected until both previews work.

## Verified here vs not verified

| Verified | Not verified |
|---|---|
| Both apps' unit tests unchanged after the refactor (see `TEST_REPORT.md`) | `vite build` for either app: the sandbox blocks Vite's esbuild service, so builds were never run. A static check found 0 unresolved imports instead. |
| Exported QC design file byte-identical before and after for 7 design cases | `git apply docs/refactor.patch` and `git subtree` commands |
| QC engine, run through its own CLI, reads simulated plates consistently | A root `npm install` and lockfile; Vercel preview deployments |
| Grader separates a correct from a flawed submission (demo) | `cli-runner.test.js` (Design): it spawns child processes, which the sandbox blocks (also blocked before the refactor) |

**Update after publishing:** the first CI run on GitHub's Linux runner verified the root `npm install`, `vite build` for both apps, and `cli-runner.test.js` (step conclusions only; see `TEST_REPORT.md`, section 5). The root lockfile it generated is committed. `git apply docs/refactor.patch` is moot here because the repository was created from the already-patched files. Still not verified: Vercel deployment.

## Decisions that are yours

1. **Licence.** `Assured_QC` is MIT. `Assured_CRISPR_Design` has no licence file, so by default all rights are reserved and others cannot legally reuse it. A shared package needs one answer for both.
2. **Hosting and data.** The apps sit under a personal Vercel account; check MDC/BIH expectations before a public classroom platform stores student data.
3. **Fixture provenance.** The three missions reuse reference fixtures from the Design test suite (`apoe-r154s.gb`, `synthetic-tagging.gb`, `nr2f2-ng016753.gb`). Their redistribution terms have not been reviewed and they are not clinical cases.
4. **Single-guide designs.** The lab convention is two guides always. The Design engine returned one guide for the N-terminal EGFP reporter case in its own tests (`tagme_nt`); the grader flags that as a convention finding, not an engine error.
5. **Instrument baseline.** The published ASSURED protocol delivers with the Neon system (10 µL kit); the first draft proposal named a Lonza 4D-Nucleofector. The simulator has no instrument-specific parameters, so nothing here depends on the answer, but the future equipment toggle will.
6. **Simulator calibration** with the lab's own numbers, and the SorCS1 missions from the paper once a reference sequence is chosen.

## Academy UI import (from `Narasimhat/Assured_Academy` at `4ab6f72`)

- Copied into `apps/academy-ui`; the previous headless `apps/academy` was renamed `apps/academy-core` (package `assured-academy-core`) and its references updated.
- Root workspaces now include `apps/academy-ui` and `apps/academy-core`; the lockfile was regenerated with no version changes to existing packages.
- Changed from the original: package renamed `assured-academy-ui`; `dev:qc` and `dev:design` point at the workspaces; `vercel.json` installs and builds from the repository root; the data layer, five pipeline stages, missions, sample datasets, frugal configurator, simulator wording, curriculum statements, certificate and README were rewritten as described in `docs/FINDINGS.md`.
- `public/sample_data/apoe/manifest.json` and the two lab CSVs were scrubbed of absolute paths, a local username and a project number (226 hits to 0); sha256 values and row counts are preserved and the 12 `.ab1` files are byte-identical.
- **Not done:** the leaked paths are still in the git history of `Assured_Academy`. A pull request scrubs the current files only.
