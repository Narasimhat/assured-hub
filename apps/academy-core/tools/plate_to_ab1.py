"""Turn a simulated plate (plate.truth.json from the Academy simulator) into synthetic Sanger traces, using Assured_QC's own generator (scripts/sim_ab1.py).
Writes <out>/control.ab1, <out>/<well>.ab1 for every clone, <out>/samples.csv (a QC sample sheet) and <out>/plate.manifest.json (student-facing, no truth).
Usage: python plate_to_ab1.py <plate.truth.json> <out dir> [--qc-scripts <path to Assured_QC/scripts>]
Traces follow the generator's linear mixture model with synthetic noise; they are not real chromatograms."""
import argparse, csv, json, os, sys
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("truth"); ap.add_argument("out")
ap.add_argument("--qc-scripts", default=os.path.join(os.path.dirname(__file__), "..", "..", "qc", "scripts"))
a = ap.parse_args()
sys.path.insert(0, os.path.abspath(a.qc_scripts))
from sim_ab1 import BASES, amplitude_profile, signals_from_alleles, write_ab1

truth = json.load(open(a.truth, encoding="utf-8"))
ref = truth["controlSequence"]; L = len(ref)
os.makedirs(a.out, exist_ok=True)

def fit(seq, length, seed):
    """Same convention as Assured_QC's make_qc_fixtures.py: trim a longer allele, pad a shorter one with random bases (the read runs past the amplicon end)."""
    rng = np.random.default_rng(seed)
    return seq[:length] if len(seq) >= length else seq + "".join(rng.choice(list(BASES), length - len(seq)))

amp = amplitude_profile(L, seed=1)
sig, _ = signals_from_alleles([(ref, 1.0)], amp, seed=truth["seed"])
write_ab1(os.path.join(a.out, "control.ab1"), ref, sig, seed=truth["seed"])

rows, manifest = [], []
for i, clone in enumerate(truth["clones"]):
    seed = truth["seed"] * 1000 + i
    alleles = [(fit(al["sequence"], L, seed + k), al["fraction"]) for k, al in enumerate(clone["alleles"])]
    assert abs(sum(f for _, f in alleles) - 1) < 1e-3, clone["clone"]
    # renormalise the rounded fractions so the generator's own assertion-free mixture sums to exactly 1
    tot = sum(f for _, f in alleles); alleles = [(s, f / tot) for s, f in alleles]
    sig, comp = signals_from_alleles(alleles, amp, seed=seed)
    name = f"{clone['clone']}.ab1"
    write_ab1(os.path.join(a.out, name), "".join(BASES[int(np.argmax(r))] for r in comp), sig, seed=seed)
    rows.append({"sample": clone["clone"], "edited": name, "control": "control.ab1", "type": "clone"})
    manifest.append({"clone": clone["clone"], "file": name})

with open(os.path.join(a.out, "samples.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.DictWriter(fh, fieldnames=["sample", "edited", "control", "type"]); w.writeheader(); w.writerows(rows)
json.dump({"schema": "assured-academy-plate/1", "seed": truth["seed"], "control": "control.ab1", "clones": manifest, "note": "Synthetic traces from a simulator; not real chromatograms."},
          open(os.path.join(a.out, "plate.manifest.json"), "w", encoding="utf-8"), indent=1)
print(f"wrote control + {len(rows)} traces to {a.out} (amplicon {L} bp)")
