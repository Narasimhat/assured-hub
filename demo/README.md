# Demo

Outputs from running the Academy pipeline end to end (see `docs/TEST_REPORT.md`, section 4).

- `projects/`, `reports/`, `demo_grading.csv`: three seeds, a reference-solver submission and a flawed one, and how the grader scored them.
- `plates/good_s201/`: one full plate: synthetic traces (`ab1/`), Assured QC output (`qc/`), the student-facing wet-lab record, and `plate.truth.json` (the answer file).
- `qc_vs_truth.csv`: Assured QC's call vs the simulated truth for 300 clones.

The traces are synthetic, not real chromatograms. `qc/run.json` originally recorded absolute paths of the machine it ran on; they were rewritten as repo-relative paths before publishing.
