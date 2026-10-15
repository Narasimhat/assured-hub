# Assured Genome Studio

> **Unified In-Silico Design, Reagent Ordering, and Sanger Trace QC for CRISPR Genome Engineering**

Assured Genome Studio unites the computational power of **Assured CRISPR Design** and **Assured QC** into an end-to-end, privacy-preserving, and democratized genome editing suite.

---

## Key Features Democratizing Genome Engineering

1. **Zero-Friction In-Silico Design**:
   - **Integrated Ensembl & MANE Select Lookup**: Type any gene symbol (e.g. `APOE`, `SCN5A`, `TP53`) and the studio automatically retrieves the canonical coding sequence, exon boundaries, and coordinates—no manual GenBank file editing required.
   - **Rigorous Safety Gates**: Cutting Frequency Determination (CFD) residual activity scoring ($\le 0.023$) and synonymous PAM/seed blocking mutations prevent re-cutting of edited alleles.
   - **Thermodynamic Primer Design**: Automated PCR and sequencing primer design with calibrated $3'$-end stability and outside-homology margins.

2. **One-Click Reagent Ordering**:
   - Instant export of pre-formatted order rows for **IDT** (Alt-R crRNAs, Ultramer/Megamer ssODNs, PCR primers), **Synthego** (modified sgRNAs), and **Twist Bioscience**.
   - Downloadable order CSVs and one-click clipboard copying.

3. **Direct In-Memory Design-to-QC Handoff**:
   - No JSON file exporting and re-uploading needed: once reagents are ordered and experimental clones are Sanger sequenced, the design specification is handed directly into the trace QC engine in-memory.

4. **Sanger Chromatogram Deconvolution & Clone Prioritization**:
   - Drag-and-drop `.ab1` files with automatic control/edited trace pairing.
   - Explicitly separates **intended HDR edit %** from **silent blocking-only conversion %**, eliminating false-positive clone selection.
   - **Functional Knockout Assessment**: Models coding frame translation, premature termination codons, nonsense-mediated decay (NMD) 50–55 nt rule, and translation restarts.
   - **Actionable Decision Engine**: 96-well plate heatmap and prioritized ranking of top candidate clones for expansion.

5. **100% Client-Side Privacy**:
   - All computation (trace alignment, mixture modeling, GenBank parsing) runs locally in the browser or worker threads. No proprietary target genes, patient data, or trace files are uploaded to any external server.

---

## Project Structure

```
Assured_Studio/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── engine/
│   │   ├── design/        # In-silico CRISPR design engine (CFD, codons, primers)
│   │   └── qc/            # Sanger chromatogram deconvolution & NMD engine
│   ├── services/
│   │   ├── ensembl.js     # Ensembl REST API & MANE Select retriever
│   │   ├── storage.js     # IndexedDB local project persistence
│   │   └── vendorExport.js# IDT, Synthego, Twist ordering generator
│   ├── components/
│   │   ├── layout/        # Header, stepper navigation, project drawer
│   │   ├── design/        # Design wizard, locus viewer, CFD cards
│   │   ├── order/         # Vendor order sheets and CSV export
│   │   └── qc/            # Trace dropzone, deconvolution table, plate heatmap
│   ├── styles/            # Clean, modern scientific UI stylesheet
│   ├── App.jsx
│   └── main.jsx
└── test/
    └── integration.test.js
```

---

## Development & Usage

### 1. Start Local Development Server
```bash
npm run dev
```
Starts the local development server at `http://localhost:5180`.

### 2. Run Integration Tests
```bash
npm test
```
Executes Node test runner across in-silico knockout and point mutation designs with CFD blocking.

### 3. Production Build
```bash
npm run build
```
Creates an optimized static bundle in `dist/`.
