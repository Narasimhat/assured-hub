# Studio review — first pass

Goal: move from a target to a usable design, an order sheet, and interpretable clone screening with fewer opportunities to lose or mix work.

## Fixed: experiment state and the starting screen

- Start with a blank target instead of a preselected APOE experiment.
- Store design inputs in the experiment as they change. Previously, saving before generating a design or navigating away discarded draft settings.
- Show the selected experiment's inputs immediately; reset temporary view state when the project changes.
- Clear derived design, schematic, release status, and QC results when design inputs change. Generating a replacement design clears previous QC results as well.
- Persist the engine's `coDeliveryBlocking` setting and read legacy `coDelivery` settings.
- Persist manually uploaded reference metadata and use its gene consistently.
- Add an editable experiment name, shorter step labels, reference-loading guidance, wrapping header controls, and save/import failure messages.
- Reject unrelated JSON and malformed top-level fields on import; supply missing defaults and IDs for older Studio exports. This is structural validation, not scientific validation of imported results.

Validation: 11 Studio tests passed, including five regression tests for project state/import. Studio production build passed (existing large-bundle warning). Native Chrome verification confirmed input retention across navigation, a clean New experiment, and restoration of gene, mutation, name, and co-delivery from an IndexedDB save. Ensembl lookup and full trace analysis were not exercised in this pass.

## Next: QC input identity and handoff

Observed in `apps/studio/src/components/qc/QcView.jsx`:

1. `handleRunQc` silently uses the first uploaded file if no control is recognized. Require an explicit control selection and show which samples it applies to.
2. A loaded demo spec takes precedence over the project spec and is not cleared when user files are added. Isolate demo sessions and show the active reference/design prominently.
3. Demo URLs begin with `/demo_traces` and `/drive_data`, although the hub serves Studio under `/studio/`. Resolve bundled files relative to Vite's base and reject unsuccessful fetch responses before parsing.
4. Uploaded trace buffers and the selected chromatogram live only in the QC component. Navigating away loses them, while persisted results remain. Make the results-only reopening state explicit or retain a QC session across step changes.

## Later: reduce the amount of information shown at once

- Move optional design controls into an expandable section, after validating defaults and prerequisites for each edit type.
- Give empty Order and Select clones screens a direct button to the required preceding step.
- Audit release wording: the design screen currently defaults a missing procurement status to `ready`.
- Split large engine bundles after the workflow is stable.

Changes are local; nothing has been pushed or deployed.

## TP53 C-terminal FLAG follow-up

- Reproduced Ensembl lookup HTTP 500 on 2026-10-15. Network/time-out failures and service errors now produce actionable messages instead of raw `Failed to fetch`.
- TP53 (or ENSG00000141510, human only) falls back during outages to bundled NCBI RefSeqGene NG_017013.2. The screen explicitly identifies the source and pinned transcript NM_000546.5 / protein NP_000537.3. This is a RefSeqGene record, not an inferred GRCh38 genomic interval or a claim of current MANE selection. No other target or species is substituted.
- The bundled record retains the upstream DNA and coordinates, selecting variant 1 annotations to exclude neighbouring genes and alternative isoforms. `public/references/tp53-provenance.json` records source URL and checksums; `scripts/build-tp53-reference.mjs` reproduces the selection.
- FLAG was offered in the UI but absent from the engine. Added a minimal terminal FLAG preset (DYKDDDDK; C-terminal stop included) and surfaced returned engine errors before rendering a result.
- The design screen now uses the engine's actual procurement summary and displays standing requirements, instead of assuming that a missing summary means ready.
- 16 Studio tests pass. The new tests cover server/network outages, unsupported targets/species, missing references, pinned reference identity and CDS completeness, and TP53 C-terminal FLAG translation/schematic/QC export. Production build passes with the existing bundle-size warning.

Still outstanding: Ensembl's live negative-strand GenBank conversion needs its own validation before depending on it when the service recovers; other unsupported tag choices in the dropdown also need reconciliation with engine presets. The TP53 fallback is deliberately limited to the checked, bundled reference.

Browser follow-up: native Chrome completed Fetch Gene → labelled TP53 fallback → Generate design, with C-terminal FLAG selected. The resulting screen rendered the TP53 FLAG schematic and the engine's standing specificity check. The current donor card and vendor exporter still contain generic ssODN wording; reconcile them with `donorFormat` in the next ordering pass.

## Terminal-tag guide alternatives — Studio and Design

Both engine copies now retain the existing terminal-tag guide selection and additionally enumerate the other candidates within ±30 bp. Studio and the standalone Design report preview show spacer, actual PAM, strand, signed distance as upstream/downstream, and protection against the current donor. The HTML reports include the same review table. The standalone engine now also includes the FLAG preset used by Studio.

Alternatives remain review candidates: generated donor sequences, selected guides, ordering lists and QC cut sites retain their selected-design meaning. CFD is calculated from the existing donor's blocking substitutions; insertion-disrupted targets are labelled structurally protected with no fabricated numerical CFD score. Unchanged alternative targets report CFD 1.0000 and no protection. Choosing a different guide requires regenerating its donor through the existing custom-guide path.

For TP53 C-terminal FLAG, the primary guide remains at −6 bp. Six alternatives appear at +15, −18, −19, +27, +28 and +29 bp. All six have intact targets in the current donor; this is displayed explicitly.

Validation: Studio's 16 tests and standalone Design's 321 tests pass. Five cross-tool regression tests cover the exact TP53 candidates, retained primary guide, actual PAMs and CFD values, N-terminal designs, custom-guide regeneration, unchanged QC guide count, and agreement between the engine copies. Native Chrome confirmed the Studio alternative table. Both production builds pass with existing bundle-size warnings.

Scope: this pass exposes alternatives for N- and C-terminal tags. Point mutations and internal tags retain their existing matched guide/donor selection behavior.

## Standalone Design reference fetching

Each Design request now has a Fetch gene reference button under Sequence input. It fetches the human symbol/Ensembl gene ID entered in Basic details, loads the GenBank data into that row, shows transcript/source metadata and errors, and clears previous generated results. Generation is disabled while fetching; a completed request cannot overwrite a reference or gene changed during the request. The standalone app bundles the same versioned TP53 fallback and provenance as Studio. Its dedicated deployment CSP permits the exact Ensembl REST origin. FLAG is now included in its terminal-tag dropdowns as well as its engine.

## Online QC sample loading

Confirmed the old root-relative demo URL returned HTTP 404 with a 79-byte error body, while the actual `/studio/demo_traces/` file returned HTTP 200 with 73,748 bytes. All three sample loaders now resolve their trace and spec assets beneath Vite's base. HTTP errors and non-ABIF/truncated responses are rejected during loading, and the dataset is committed only after its design spec also loads successfully. Replacing a dataset clears the preceding analysis and figure.

Validation: 19 Studio tests pass and its build succeeds. Downloaded the live synthetic control and three edited traces from the correct deployed paths, parsed and analysed all three clones; also downloaded and parsed the live APOE and MYD88 control traces.

## Landing and Academy purpose

The landing page now offers exactly two destinations: Genome Studio for experiments and Academy for teaching, training, and learning. Removed the root-to-Studio redirect. Design and QC remain in Studio's More tools menu, which also includes Home.

At the user's request, Academy is now a simple learning overview for foundations, guided examples and teaching/assessment. Its runtime no longer imports the duplicated five-stage workbench, mode switcher, embedded Studio, progress scores, or production tools. The overview explicitly says curriculum/training activities are being reorganized. Prior lesson/simulation source and saved learner data are retained for future curriculum work.

Validation: full hub build and Academy's existing 55-component smoke check pass. Server-rendered the new overview and confirmed its learning areas and Studio link are present, with no workbench, iframe, or Pro Mode in the rendered page.
