# FAIR workflow in Assured Hub

The FAIR edition of `assured-hub` keeps the unified Bench workflow in this repository. Design and QC standalone FAIR repositories remain independently deployed; changes here do not automatically update them. Review this branch and deploy it as a separate Hub FAIR Vercel project; do not merge into the original Hub `main` to publish the FAIR edition.

## Current workflow

1. Design: review guides/donor and reference, including existing release gates.
2. Order: review reagent and procurement requirements.
3. Trace Analysis: load control and edited AB1 files, check pairing, then run Assured QC. The bridge captures SHA-256 of the same original input buffers sent to workers, effective per-sample design specifications and analysis settings. No raw bytes cross the bridge.
4. Reports: inspect clone results and sequence candidate decisions.
5. FAIR Passport: fill the twelve shared metadata fields, clone and parental identifiers, reference assembly, a selected SpCas9 guide, and any reported biological claims. The active experiment, effective QC design specifications and QC analysis are automatically attached as JSON snapshots. Reattach every original control/edited trace: creation refuses files whose bytes do not cover the captured input manifest. Download the passport and its snapshots.

An older saved analysis has no captured fingerprints. Run it again before creating a workflow passport. Imported reports and manual overrides are represented by the actual QC task specifications; the experiment snapshot also retains the intended Bench design. One selected spacer in the passport does not replace the full multi-guide design in those snapshots.

Save stores passport history with the experiment in IndexedDB (or the app's existing localStorage fallback). Export includes it in the .assured JSON backup. Import verifies each stored passport's record hash. Raw AB1 bytes remain separate; export is not a raw-file archive. Historical passports are retained after design changes and continue to describe their original snapshots. Current run provenance is cleared when design inputs change, preventing a new design from reusing an old run.

Auditor mode accepts a downloaded passport, or a record from the experiment's history. Select an evidence entry and compare its file. This verifies only that entry, not all files at once or the biological claims. Keep original snapshot files with each passport; snapshots change when you modify the experiment.

## Shared implementation

`packages/assured-provenance` is used by `apps/studio`, `apps/qc` and `apps/design/assured-crispr-designer`. It supplies metadata screening, canonical JSON hashing, the `assured-ipsc-passport/1` envelope and Creator/Auditor UI. Its engine originated from the tested standalone FAIR apps. Passport envelope compatibility is retained; workflow snapshots are ordinary `design` and `analysis` evidence entries.

`apps/qc/src/runProvenance.js` captures worker-input fingerprints. `apps/studio/src/services/passportWorkflow.js` selects snapshots and checks attached originals against them. There is no managed server-side storage or verified issuer identity. The optional Sepolia integration adds independently checked hash anchors and separate proofs; see [Sepolia anchoring](SEPOLIA_ANCHORING.md). A user who replaces both the data and the entire self-issued record can create another internally consistent record. Preserve an independently trusted original to make comparison meaningful.

## Limits

The metadata score measures twelve fields' completeness plus HTTPS URL syntax, not formal FAIR certification. Schemas, identifiers, repository reachability and licenses are not independently validated. The passport form supports a selected 20-base SpCas9 guide and optional matching spacer+NGG target context; it does not map the guide to a genome or validate other nuclease modes. Optional QC evidence is unassessed. Editing fractions, genotype, identity and cell QC are not established by a hash. The QC engine remains a sequence-based assay with its documented scientific limitations.

Limits remain 20 attachments, 50 MB per file, 200 MB total. Three automatic workflow snapshots leave room for 17 attached files. A large run may exceed this first passport version's attachment limits. Passport history can consume browser storage; export backups and handle quota errors using the existing Save error message. The version is ordinary JSON, not JSON-LD or a certified CoA.

## Recommended next releases

1. Publish this tested branch to a separate Hub FAIR Vercel project (root directory: repository root; `npm ci`; `npm run build`; output `dist`). Set its production branch to `fair-production`; retain `main` for the original Hub.
2. Add a complete evidence ZIP export, bulk manifest verification, and versioned schemas/migrations, with a shared test corpus covering standalone and Hub passports.
3. Add lab-specific QC policies, explicit assay methods and acceptance criteria, dated reviewer decisions, and validation against known outcomes. Keep teaching/simulated datasets visibly separate from experimental records.
4. Add organization identity, access controls and managed record retention after deciding where sensitive sequence data may be hosted. Browser-local persistence is not a managed audit archive.
5. Pilot the implemented Sepolia ledger receipts, add trusted issuer identities and a reviewed production-network policy, then expose persistent registry/QR links. Anchor only hashes, never raw sequences or identifiable metadata.
6. Add a CoA/PDF export with qualified claims, then subscriptions and facility administration once the pilot workflow is validated.

## Validation

Run `npm test` and `npm run build` from the repository root. The root test script includes the shared provenance package, all scientific engines, Studio workflow tests, hand-off contracts and Academy render smoke tests. Browser QA should cover QC worker execution, refusal of an unrelated trace, passport creation, snapshot downloads, Save/reload and Export/Import history, and auditor match/mismatch checks under the assembled `/studio/`, `/design/`, `/qc/` and `/academy/` paths.

The initial root regression run exposed stale Academy catalogue byte counts and hashes from CRLF/LF drift. The FAIR branch normalizes the two affected source CSVs and their published copies to LF, pins catalogue text inputs with .gitattributes, preserves AB1/ABI as binary, and regenerates the advertised byte counts and SHA-256 values from the shipped bytes. No scientific table values or trace bytes are changed. After correction, all constituent suites pass (636 tests), the Academy UI smoke test renders 67 components without problems, generated-data checks pass, and the full hub builds. The browser workflow was exercised with the bundled APOE practice data, including project Export/Import and IndexedDB Save/reload.
