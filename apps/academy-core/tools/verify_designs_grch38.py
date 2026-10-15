"""Verify Academy designs (assured-qc-design/1 files) against the human reference (GRCh38) using Ensembl REST.
usage: python verify_designs_grch38.py <out.csv> <design.json>=<GENE> [...]     e.g. APOE_R176C.engine.design.json=APOE
Checks per design: reference window vs GRCh38; genomic coordinate and base of the intended edit; each guide's PAM, cut distance and occurrences within
the gene region (NOT genome-wide: off-target specificity is not assessed); each donor's differences from the reference and its arm lengths.
Needs network access to rest.ensembl.org. Ensembl's public API is occasionally flaky; requests are retried."""
import csv, json, os, sys, time
import requests

GENES = {  # gene region to fetch (GRCh38), gene orientation, and the coordinate/base the mission claims
    "APOE": dict(chrom="19", start=44899000, end=44912000, strand=1, edit_coord=44908822, edit_ref_gene_orientation="C", label="rs7412 (p.Arg176Cys)"),
    "HBB": dict(chrom="11", start=5222000, end=5232000, strand=-1, edit_coord=5227002, edit_ref_gene_orientation="A", label="rs334 (p.Glu7Val, legacy Glu6Val)"),
}
RC = str.maketrans("ACGT", "TGCA")
rc = lambda s: s.translate(RC)[::-1]

def fetch(g):
    url = f"https://rest.ensembl.org/sequence/region/human/{g['chrom']}:{g['start']}..{g['end']}:{g['strand']}?content-type=application/json"
    for k in range(7):
        try:
            r = requests.get(url, timeout=90)
            if r.status_code == 200: return r.json()["seq"].upper()
        except requests.RequestException: pass
        time.sleep(4 * (k + 1))
    raise SystemExit("Ensembl did not answer; try again later")

def verify(path, gene, region):
    g = GENES[gene]; spec = json.load(open(path, encoding="utf-8")); win = spec["reference"]["sequence"].upper(); n = len(win); rows = []
    add = lambda check, ok, detail: rows.append(dict(design=os.path.basename(path), gene=gene, check=check, result="OK" if ok else "PROBLEM", detail=detail))
    anchor = win[n // 2: n // 2 + 30]; i0 = region.find(anchor) - n // 2
    if region.find(anchor) < 0: add("reference window found in GRCh38", False, "anchor not found"); return rows
    seg = region[i0: i0 + n]; mm = sum(1 for a, b in zip(win, seg) if a != b); add("reference window vs GRCh38", mm == 0, f"{n} bp, {mm} mismatches")
    coord = lambda p: g["start"] + i0 + p if g["strand"] == 1 else g["end"] - (i0 + p)
    p_edit = (g["edit_coord"] - g["start"]) - i0 if g["strand"] == 1 else (g["end"] - g["edit_coord"]) - i0
    base = win[p_edit] if 0 <= p_edit < n else "?"
    add("edit site coordinate and base", base == g["edit_ref_gene_orientation"], f"{g['label']}: chr{g['chrom']}:{g['edit_coord']:,} is design position {p_edit}; gene-orientation base {base} (expected {g['edit_ref_gene_orientation']})")
    mk = {m["pos"]: m for m in spec["markers"]}
    add("edit site is changed by the donor(s)", p_edit in mk, f"marker at {p_edit}: {mk.get(p_edit, {}).get('change')}")
    add("hand-off flags the edit site as role 'intended'", mk.get(p_edit, {}).get("role") == "intended",
        f"exported role is '{mk.get(p_edit, {}).get('role')}'" + ("" if mk.get(p_edit, {}).get("role") == "intended" else " (Design export labels the edit 'blocking': see docs/FINDINGS.md. Assured QC output is unaffected; code that reads the role directly is)"))
    for gd in spec["guides"]:
        sp = gd["spacer"].upper(); st, en = gd["protospacerStart"], gd["protospacerEnd"]
        site = win[st:en]; site_ok = (site == sp) if gd["strand"] == "+" else (rc(site) == sp)
        pam = win[en:en + 3] if gd["strand"] == "+" else rc(win[st - 3:st])
        cut = en - 3 if gd["strand"] == "+" else st + 3; dist = cut - p_edit
        occ = region.count(sp) + region.count(rc(sp))
        add(f"guide {gd['name']}: spacer at stated site, 20 nt", site_ok and len(sp) == 20, f"{len(sp)} nt, strand {gd['strand']}, site matches: {site_ok}")
        add(f"guide {gd['name']}: PAM is NGG", pam[1:] == "GG", f"PAM {pam} (stated {gd['pam']})")
        add(f"guide {gd['name']}: cut within 15 bp of the edit", abs(dist) <= 15 and cut == gd["cut"], f"cut {cut} (stated {gd['cut']}), {dist:+d} bp from the edit")
        add(f"guide {gd['name']}: exported offsetFromEdit equals cut minus edit position", gd.get("offsetFromEdit") == dist, f"geometry gives {dist:+d}, hand-off says {gd.get('offsetFromEdit')}" + ("" if gd.get("offsetFromEdit") == dist else " (the UI data computes distances from geometry; see docs/FINDINGS.md)"))
        add(f"guide {gd['name']}: occurrences in the gene region", occ == 1, f"{occ} exact matches in the {len(region):,} bp region (genome-wide specificity NOT assessed)")
    for d in spec["donors"]:
        s, e = d["refStart"], d["refEnd"]; dseq = d["sequence"].upper(); diffs = [s + k for k, (a, b) in enumerate(zip(win[s:e], dseq)) if a != b]
        add(f"donor {d['name'][:34]}: length and differences", len(dseq) == e - s == 127 and sorted(diffs) == sorted(d["carriesMarkers"]), f"{len(dseq)} nt; differs from reference at {diffs}; declared markers {sorted(d['carriesMarkers'])}")
        gd = spec["guides"][(d.get("guide") or 1) - 1]; left, right = gd["cut"] - s, e - gd["cut"]
        add(f"donor {d['name'][:34]}: asymmetric 36/91 arms about the cut", sorted([left, right]) == [36, 91], f"arms {left} / {right} around the cut of {gd['name']}")
    return rows

if __name__ == "__main__":
    out, items = sys.argv[1], sys.argv[2:]; regions = {}; allrows = []
    for it in items:
        path, gene = it.split("="); regions.setdefault(gene, fetch(GENES[gene])); allrows += verify(path, gene, regions[gene])
    with open(out, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["design", "gene", "check", "result", "detail"]); w.writeheader(); w.writerows(allrows)
    bad = [r for r in allrows if r["result"] != "OK"]; print(f"{len(allrows)} checks, {len(bad)} problems"); [print("  PROBLEM:", r["design"], "|", r["check"], "|", r["detail"]) for r in bad]
