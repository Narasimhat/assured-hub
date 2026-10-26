# ASSUREDChain ← Assured Design / Assured QC bridge

This folder holds the integration that belongs in
[`Narasimhat/ASSUREDChain-Windows`](https://github.com/Narasimhat/ASSUREDChain-Windows)
(the Cursor agent could not push to that repository).

## What it does

| ASSUREDChain step | Assured tool | Integration |
|---|---|---|
| **Design Log** (`1_Design_Log.py`) | [Assured Design FAIR](https://assured-design-fair.vercel.app/) | Launch + import `assured-qc-design/1` JSON into guides/donors/primers |
| **Assessment Log** (`4_Assessment_Log.py`) | [Assured QC FAIR](https://assured-qc-fair.vercel.app/) | Launch + import results CSV/JSON into indel/HDR % and cloning decision |

## Apply to ASSUREDChain-Windows

```bash
cd ASSUREDChain-Windows
git checkout -b cursor/integrate-assured-design-qc-9b1d
git am path/to/assured-hub/integrations/assuredchain/0001-Integrate-Assured-Design-and-Assured-QC-into-ASSURED.patch
# or: git apply path/to/assured-hub/integrations/assuredchain/assuredchain-design-qc.diff
python scripts/test_assured_tools.py -v
```

Optional `.env` overrides (also in the patch `.env.template`):

```
ASSURED_DESIGN_URL=https://assured-design-fair.vercel.app/
ASSURED_QC_URL=https://assured-qc-fair.vercel.app/
ASSURED_HUB_FAIR_URL=https://assured-hub-fair.vercel.app/
```

## Local smoke test (parsers only)

```bash
python integrations/assuredchain/test_assured_tools.py -v
```
