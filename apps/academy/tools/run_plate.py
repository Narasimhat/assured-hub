"""One command from a student's design to QC results on a blinded plate:
   simulate (Node) -> synthetic traces (Python, Assured_QC's sim_ab1) -> Assured QC engine (Node CLI).
Usage: python run_plate.py <design.qc-design.json> <seed> <out dir> [--node node] [--equipment high_throughput] [--cloning automated_dispenser] [--supplement clone_r]
Writes <out>/wetlab.record.json (student-facing), <out>/plate.truth.json (NOT student-facing), <out>/ab1/ and <out>/qc/ ."""
import argparse, os, subprocess, sys, tempfile

here = os.path.dirname(os.path.abspath(__file__)); academy = os.path.dirname(here); apps = os.path.dirname(academy)
ap = argparse.ArgumentParser()
ap.add_argument("design"); ap.add_argument("seed"); ap.add_argument("out")
ap.add_argument("--node", default="node"); ap.add_argument("--equipment", default="high_throughput")
ap.add_argument("--cloning", default="automated_dispenser"); ap.add_argument("--supplement", default="clone_r")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
empty = tempfile.NamedTemporaryFile(delete=False); empty.close()   # explicit empty stdin (portable; avoids relying on the NUL device)

def step(cmd, cwd):
    with open(empty.name, "rb") as stdin:
        r = subprocess.run(cmd, cwd=cwd, stdin=stdin, capture_output=True, text=True)
    if r.returncode != 0: sys.exit(f"step failed: {' '.join(map(str, cmd))}\n{r.stdout}\n{r.stderr}")
    return r.stdout

step([a.node, os.path.join(here, "simulate-plate.mjs"), a.design, a.seed, a.out, a.equipment, a.cloning, a.supplement], academy)
ab1 = os.path.join(a.out, "ab1")
step([sys.executable, os.path.join(here, "plate_to_ab1.py"), os.path.join(a.out, "plate.truth.json"), ab1, "--qc-scripts", os.path.join(apps, "qc", "scripts")], academy)
qc = os.path.join(apps, "qc")
step([a.node, os.path.join(qc, "cli", "assured-qc.mjs"), "run", ab1, "--design", a.design, "--sheet", os.path.join(ab1, "samples.csv"), "--out", os.path.join(a.out, "qc")], qc)
os.unlink(empty.name)
print("done:", a.out)
