// Headless, seeded Stage 3 simulator: turns a student's design plus their bench choices into (a) a student-facing wet-lab record and
// (b) a truth file for the grader and the trace generator. The student's own design drives the result: guide-to-edit distance,
// whether the donor carries silent blocking changes for each guide, and how many guides they chose all change the plate.
// Parameters are illustrative teaching defaults (see params.js).
import { MAX_GUIDE_CUT_DISTANCE } from "@assured/rules";
import { validateDesignSpec } from "@assured/spec";
import { PARAMS } from "./params.js";
import { makeRng } from "./rng.js";
import { WETLAB_SCHEMA, EQUIPMENT_TIERS, CLONING_METHODS } from "../envelope.js";

export const PLATE_TRUTH_SCHEMA = "assured-academy-plate-truth/1";
export const SUPPLEMENTS = Object.freeze(["none", "rocki", "clone_r"]);
const HDR_KINDS = new Set(["snp", "tag_small", "tag_large", "reporter", "internal_tag", "terminal_tag"]);

const donorCarries = (donor, marker) => (Array.isArray(donor.carriesMarkers) ? donor.carriesMarkers.includes(marker.pos) : donor.refStart <= marker.pos && marker.pos < donor.refEnd);
const subAt = (seq, pos, base) => seq.slice(0, pos) + base + seq.slice(pos + 1);

export function amplicon(spec) {
  const ref = spec.reference.sequence; const fw = (spec.primers || []).find((p) => p.strand === "+"); const rv = (spec.primers || []).find((p) => p.strand === "-");
  if (fw && rv && rv.end > fw.start) return { start: fw.start, end: rv.end, source: "primers" };
  const cuts = (spec.guides || []).map((g) => g.cut); const lo = Math.max(0, Math.min(...cuts) - 250); const hi = Math.min(ref.length, Math.max(...cuts) + 250);
  return { start: lo, end: hi, source: "cut window (no primers in design)" };
}

/** Build everything a clone sampler needs from a validated design. Throws on designs the simulator cannot interpret. */
export function buildContext(spec) {
  const check = validateDesignSpec(spec); if (!check.ok) throw new Error(`design does not validate: ${check.errors.join("; ")}`);
  const win = amplicon(spec); const ref = spec.reference.sequence; const a = win.start;
  const wt = ref.slice(win.start, win.end);
  const kind = spec.design.editKind; const hasDonor = HDR_KINDS.has(kind) && (spec.donors || []).length > 0;
  const guides = (spec.guides || []).map((g) => ({ ...g, c: g.cut - a, dist: Math.abs(g.offsetFromEdit ?? 0) }));
  guides.forEach((g) => { if (g.c < 20 || g.c > wt.length - 20) throw new Error(`guide ${g.name} cuts outside the sequenced amplicon`); });
  const markers = spec.markers || [];
  const inWin = (m) => m.pos >= a && m.pos < win.end;
  const subs = (list) => list.filter(inWin).reduce((s, m) => { if (s[m.pos - a] !== m.ref) throw new Error(`marker at ${m.pos} does not match the reference`); return subAt(s, m.pos - a, m.alt); }, wt);
  const donors = (spec.donors || []).map((d) => {
    const spliced = d.sequence.length !== d.refEnd - d.refStart;
    const intended = spliced ? wt.slice(0, d.refStart - a) + d.sequence + wt.slice(d.refEnd - a) : subs(markers.filter((m) => donorCarries(d, m)));
    if (!spliced && intended.slice(d.refStart - a, d.refEnd - a) !== d.sequence) throw new Error(`donor ${d.name} does not equal the reference with its markers applied`);
    const blockingOnly = subs(markers.filter((m) => m.role === "blocking" && donorCarries(d, m)));
    return { ...d, intendedSeq: intended, blockingOnlySeq: blockingOnly };
  });
  const protectedBy = (donor, guide) => markers.some((m) => (m.role === "blocking" || m.role === "intended") && m.guide === guide.index && donorCarries(donor, m));
  return { spec, kind, hasDonor, win, wt, guides, donors, protectedBy, desired: hasDonor ? "hdr_hom" : "biallelic_ko" };
}

const WT = (ctx) => ({ kind: "wt", label: "wild type", sequence: ctx.wt });
function indelAt(ctx, rng, g) {
  const n = rng.weighted(PARAMS.indel.sizes); const c = g.c; const w = ctx.wt;
  if (n < 0) { const m = -n; const k = Math.floor(m / 2); return { kind: "indel", label: `-${m} at ${g.name}`, sequence: w.slice(0, c - k) + w.slice(c - k + m) }; }
  const ins = n === 1 ? w[c - 1] : w.slice(c - 2, c);
  return { kind: "indel", label: `+${n} at ${g.name}`, sequence: w.slice(0, c) + ins + w.slice(c) };
}
const hdrProb = (d) => PARAMS.hdr.maxPerCut * (d <= PARAMS.hdr.flatWithinBp ? 1 : Math.exp(-(d - PARAMS.hdr.flatWithinBp) / PARAMS.hdr.decayBp));
const partialProb = (d) => Math.min(PARAMS.partialConversion.max, PARAMS.partialConversion.base + PARAMS.partialConversion.perBp * d);

export function sampleAllele(ctx, rng) {
  const cutting = ctx.guides.filter(() => rng() < PARAMS.pCutPerGuide);
  if (!cutting.length) return WT(ctx);
  if (ctx.hasDonor) {
    const g = cutting.reduce((best, x) => (x.dist < best.dist ? x : best));
    if (rng() < hdrProb(g.dist)) {
      const donor = ctx.donors.find((d) => d.guide === g.index) || ctx.donors[0];
      for (const other of ctx.guides) if (!ctx.protectedBy(donor, other) && rng() < PARAMS.recutIfUnprotected) return indelAt(ctx, rng, other);
      return rng() < partialProb(g.dist)
        ? { kind: "blocking_only", label: `blocking changes only (${donor.name || donor.format})`, sequence: donor.blockingOnlySeq }
        : { kind: "hdr_intended", label: `intended edit (${donor.name || donor.format})`, sequence: donor.intendedSeq };
    }
  }
  if (cutting.length >= 2 && rng() < PARAMS.indel.pBetweenCuts) {
    const [x, y] = cutting.map((g) => g.c).sort((p, q) => p - q);
    return { kind: "indel", label: `deletion between cuts (-${y - x} bp)`, sequence: ctx.wt.slice(0, x) + ctx.wt.slice(y) };
  }
  return indelAt(ctx, rng, cutting[rng.int(cutting.length)]);
}

export function classify(ctx, alleles) {
  const n = (k) => alleles.filter((a) => a.kind === k).length;
  if (ctx.hasDonor) {
    if (n("hdr_intended") === 2) return "hdr_hom";
    if (n("hdr_intended") === 1) return "hdr_het";
    if (n("blocking_only") >= 1) return "blocking_only";
  }
  const edited = alleles.filter((a) => a.kind !== "wt").length;
  return edited === 0 ? "wild_type" : edited === 1 ? "het_indel" : "biallelic_ko";
}

function mergeAlleles(list) {
  const out = new Map();
  for (const { allele, fraction } of list) { const key = allele.sequence; const cur = out.get(key); if (cur) cur.fraction += fraction; else out.set(key, { ...allele, fraction }); }
  return [...out.values()].map((x) => ({ ...x, fraction: Math.round(x.fraction * 1e6) / 1e6 }));
}

export function sampleClone(ctx, rng, cloning) {
  const diploid = () => [sampleAllele(ctx, rng), sampleAllele(ctx, rng)];
  const polyclonal = rng() < PARAMS.polyclonal[cloning];
  if (!polyclonal) { const al = diploid(); return { call: classify(ctx, al), polyclonal: false, alleles: mergeAlleles(al.map((allele) => ({ allele, fraction: 0.5 }))) }; }
  const w = 0.2 + 0.6 * rng(); const a1 = diploid(); const a2 = diploid();
  return { call: "mosaic", polyclonal: true, alleles: mergeAlleles([...a1.map((allele) => ({ allele, fraction: w / 2 })), ...a2.map((allele) => ({ allele, fraction: (1 - w) / 2 }))]) };
}

const expectedFor = (ctx, call) => {
  if (call === ctx.desired) return { tier: "best", decision: "expand" };
  if (ctx.hasDonor && call === "hdr_het") return { tier: "acceptable", decision: "expand" };
  if (call === "mosaic") return { tier: "decoy", decision: "re_clone" };
  return { tier: call === "blocking_only" ? "decoy" : "reject", decision: "discard" };
};

export function simulate(spec, choices, seed, options = {}) {
  if (!EQUIPMENT_TIERS.includes(choices.equipment)) throw new Error(`equipment must be one of ${EQUIPMENT_TIERS.join(", ")}`);
  if (!CLONING_METHODS.includes(choices.cloning)) throw new Error(`cloning must be one of ${CLONING_METHODS.join(", ")}`);
  if (!SUPPLEMENTS.includes(choices.supplement)) throw new Error(`supplement must be one of ${SUPPLEMENTS.join(", ")}`);
  if (choices.equipment === "frugal" && choices.cloning === "automated_dispenser") throw new Error("the frugal tier has no single-cell dispenser; choose manual_limiting_dilution");
  const ensure = { best: 1, decoys: 1, maxAttempts: 2000, ...(options.ensure || {}) };
  const ctx = buildContext(spec); const rng = makeRng(seed); const notes = [];

  const pSurvive = Math.min(1, PARAMS.survival.cloning[choices.cloning] * PARAMS.survival.supplement[choices.supplement]);
  let survivors = 0; for (let i = 0; i < PARAMS.wellsPlated; i += 1) if (rng() < pSurvive) survivors += 1;
  if (survivors < PARAMS.plateSize) notes.push(`only ${survivors} of ${PARAMS.wellsPlated} wells grew a clone; the plate is smaller than ${PARAMS.plateSize}`);
  const plateN = Math.min(PARAMS.plateSize, survivors);

  // pooled readout of the population the clones come from (what a pooled-trace ICE-style estimate would approximate)
  let edited = 0, hdr = 0; const POOL = 400;
  for (let i = 0; i < POOL; i += 1) { const al = sampleAllele(ctx, rng); if (al.kind !== "wt") edited += 1; if (al.kind === "hdr_intended") hdr += 1; }
  const noisy = (pct) => Math.max(0, Math.min(100, Math.round((pct + PARAMS.poolReadoutNoiseSd * rng.normal()) * 10) / 10));

  let clones = [], attempts = 0, satisfied = false;
  while (attempts < ensure.maxAttempts) {
    attempts += 1; clones = [];
    for (let i = 0; i < plateN; i += 1) clones.push(sampleClone(ctx, rng, choices.cloning));
    const best = clones.filter((c) => c.call === ctx.desired).length; const decoys = clones.filter((c) => c.call === "mosaic" || c.call === "blocking_only").length;
    if (best >= ensure.best && decoys >= ensure.decoys) { satisfied = true; break; }
  }
  if (!satisfied) notes.push("this design could not produce a plate with a best clone and a decoy; the plate is unconditioned and may contain no clone worth expanding");
  const wells = (i) => `${"ABCDEFGH"[Math.floor(i / 12)]}${String((i % 12) + 1).padStart(2, "0")}`;
  const truthClones = clones.map((c, i) => ({ clone: wells(i), ...c, expected: expectedFor(ctx, c.call) }));
  const record = { schema: WETLAB_SCHEMA, choices: { ...choices }, outcome: { seed, wellsPlated: PARAMS.wellsPlated, wellsWithGrowth: survivors, clonesPicked: plateN,
      bulkEditedPct: noisy(100 * edited / POOL), bulkHdrPct: ctx.hasDonor ? noisy(100 * hdr / POOL) : null, notes },
    parameters: PARAMS.provenance };
  const truth = { schema: PLATE_TRUTH_SCHEMA, DO_NOT_SHIP_TO_STUDENTS: true, seed, editKind: ctx.kind, desired: ctx.desired, amplicon: ctx.win, maxGuideCutDistance: MAX_GUIDE_CUT_DISTANCE,
    controlSequence: ctx.wt, bulk: { trueEditedPct: Math.round(1000 * edited / POOL) / 10, trueHdrPct: ctx.hasDonor ? Math.round(1000 * hdr / POOL) / 10 : null },
    conditioning: { ensure, attempts, satisfied }, clones: truthClones };
  return { record, truth };
}
