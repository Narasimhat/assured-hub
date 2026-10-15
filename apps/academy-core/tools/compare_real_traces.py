#!/usr/bin/env python3
"""Join Assured QC output for the shipped real traces to the lab's own CSV calls (stdlib only).

Join key: sha256 of each shipped .ab1 == the `sha256` column of the lab CSV. File names are NOT used,
because the UI names files by plate well while the lab CSVs number clones.

usage: compare_real_traces.py <out.csv>      (paths are relative to apps/academy-core)
"""
import csv, hashlib, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); CORE = os.path.dirname(HERE)
SAMPLE = os.path.join(CORE, "..", "academy-ui", "public", "sample_data")
RT = os.path.join(CORE, "data", "real_trace_qc")

DATASETS = [
    dict(label="APOE R176C", dir="apoe", lab="Synthego_ICE_Analysis_batch.csv", engine="apoe.engine_results.csv", stem=lambda f: f[:-4],
         detail=lambda r: f"R176C signal {r['R176C_T_signal_pct']}%, indel g1 {r['indel_pct_guide1']}%"),
    dict(label="MYD88 KO", dir="myd88", lab="Synthego_ICE_Analysis_2023_08_09_1691566838.csv", engine="myd88.engine_results.csv", stem=lambda f: f[:-4],
         detail=lambda r: (r["dominant_deletions"] or r["error"] or "").strip()),
]

# Explicit rule for the `agreement` column. Anything not listed is reported as 'differs', never silently dropped.
#   lab recommendation  -> engine clone_call values counted as the same genotype class
RULES = {
    "APOE R176C": {"First choice": {"homozygous_edit"}, "Not SNP candidate": {"homozygous_indel", "heterozygous_indel", "compound_heterozygous"}, "Resequence": {"mixed"}},
    "MYD88 KO": {"First choice": {"homozygous_indel"}, "Backup": {"homozygous_indel"}, "Review mixed trace": {"mixed"}},
}

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f: h.update(f.read())
    return h.hexdigest()

def main(out):
    rows = []
    for ds in DATASETS:
        # the lab CSVs carry a UTF-8 BOM, hence utf-8-sig
        lab = {r["sha256"]: r for r in csv.DictReader(open(os.path.join(SAMPLE, ds["dir"], ds["lab"]), newline="", encoding="utf-8-sig"))}
        eng = {r["sample"]: r for r in csv.DictReader(open(os.path.join(RT, ds["engine"]), newline="", encoding="utf-8"))}
        for f in sorted(os.listdir(os.path.join(SAMPLE, ds["dir"]))):
            if not f.endswith(".ab1") or f == "Ctrl.ab1": continue
            h = sha(os.path.join(SAMPLE, ds["dir"], f)); lr = lab.get(h); er = eng.get(ds["stem"](f))
            if lr is None or er is None: raise SystemExit(f"{f}: no lab row by sha256 ({lr is None}) or no engine row ({er is None})")
            rec = lr["recommendation"].strip(); same = er["clone_call"] in RULES[ds["label"]].get(rec, set())
            rows.append(dict(dataset=ds["label"], file=f, lab_clone=lr["clone"], lab_recommendation=rec, lab_detail=ds["detail"](lr),
                             engine_call=er["clone_call"], engine_result=er["result"], engine_intended_pct=er["intended_edit_pct"],
                             engine_edited_pct=er["edited_pct"], engine_decision=er["decision"], engine_confidence=er["confidence"],
                             agreement="agrees" if same else ("lab had no call" if rec in ("Resequence", "") and ds["label"] == "MYD88 KO" else "differs")))
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    print(f"{len(rows)} clones; agrees {sum(r['agreement'] == 'agrees' for r in rows)}, lab had no call {sum(r['agreement'] == 'lab had no call' for r in rows)}, differs {sum(r['agreement'] == 'differs' for r in rows)}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(RT, "comparison.csv"))
