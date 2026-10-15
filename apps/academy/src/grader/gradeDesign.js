// Grade a student's DESIGN (an assured-qc-design/1 object) against the rules the design tool itself uses and the lab's conventions.
// Every check names its source so a student can tell an engine limit from a lab convention:
//   "engine"     - a limit read from @assured/rules (the design tool's own constants)
//   "convention" - the lab's stated convention (LAB_CONVENTIONS), not enforced by the design engine
//   "contract"   - the hand-off schema validator (@assured/spec)
import { validateDesignSpec } from "@assured/spec";
import { MAX_BLOCKING_CHANGES, MAX_GUIDE_CUT_DISTANCE, MIN_PAIR_CUT_SEPARATION, LAB_CONVENTIONS, DONOR_FORMATS } from "@assured/rules";

const HDR_KINDS = new Set(["snp", "tag_small", "tag_large", "reporter", "internal_tag", "terminal_tag"]);
const donorCarries = (d, m) => (Array.isArray(d.carriesMarkers) ? d.carriesMarkers.includes(m.pos) : d.refStart <= m.pos && m.pos < d.refEnd);
const STRATEGY_OK = { deletion: ["deletion", "knockout"], knockout: ["knockout", "deletion"] };

export function gradeDesign(project, key) {
  const checks = []; const add = (id, source, pass, detail, weight = 1, severity = "major") => checks.push({ id, source, pass: !!pass, detail, weight, severity });
  const spec = project.design;
  const v = spec ? validateDesignSpec(spec) : { ok: false, errors: ["no design submitted"] };
  add("valid-handoff", "contract", v.ok, v.ok ? "design validates against assured-qc-design/1" : v.errors.slice(0, 3).join("; "), 2, "critical");
  if (!v.ok) return summarise(checks);
  const kind = spec.design.editKind; const hdr = HDR_KINDS.has(kind); const guides = spec.guides || []; const donors = spec.donors || []; const markers = spec.markers || [];

  const expected = key && key.expected;
  if (expected) {
    const ok = (STRATEGY_OK[expected.strategy] || [expected.strategy]).includes(project.strategy && project.strategy.choice);
    add("strategy", "key", ok, ok ? `strategy "${project.strategy.choice}" suits this mission` : `mission expects ${expected.strategy}; submitted ${project.strategy && project.strategy.choice}`, 2, "major");
    add("edit-kind", "key", kind === expected.editKind, `design edit kind ${kind}; mission expects ${expected.editKind}`, 1, "major");
  }

  const need = LAB_CONVENTIONS.minGuides[kind] ?? 2;
  add("guide-count", "convention", guides.length >= need, `${guides.length} guide(s); lab convention is ${need}`, 2, "major");

  if (hdr) {
    guides.forEach((g) => add(`cut-distance:${g.name}`, "engine", Math.abs(g.offsetFromEdit ?? Infinity) <= MAX_GUIDE_CUT_DISTANCE,
      `${g.name} cuts ${Math.abs(g.offsetFromEdit)} bp from the edit; the design tool's eligibility limit is ${MAX_GUIDE_CUT_DISTANCE} bp (HDR falls off beyond about 10)`, 1, "major"));
    if (guides.length >= 2) {
      const cuts = guides.map((g) => g.cut).sort((a, b) => a - b); const sep = cuts[cuts.length - 1] - cuts[0];
      add("cut-separation", "engine", sep >= MIN_PAIR_CUT_SEPARATION, `guide cuts are ${sep} bp apart; the engine keeps a second guide at least ${MIN_PAIR_CUT_SEPARATION} bp from the first`, 1, "minor");
    }
    add("has-donor", "convention", donors.length > 0, donors.length ? `${donors.length} donor(s)` : "an HDR design needs a donor", 2, "critical");
    if (donors.length) {
      const unprotected = [];
      for (const d of donors) for (const g of guides) {
        const prot = markers.some((m) => (m.role === "blocking" || m.role === "intended") && m.guide === g.index && donorCarries(d, m));
        if (!prot) unprotected.push(`${d.name || d.format} / ${g.name}`);
      }
      add("blocking-all-guides", "convention", unprotected.length === 0, unprotected.length ? `no silent blocking change for: ${unprotected.join(", ")} (the repaired allele can be re-cut)` : "every donor blocks every guide", 3, "critical");
      guides.forEach((g) => { const n = markers.filter((m) => m.role === "blocking" && m.guide === g.index).length; add(`blocking-count:${g.name}`, "engine", n <= MAX_BLOCKING_CHANGES, `${n} blocking change(s) for ${g.name}; engine cap is ${MAX_BLOCKING_CHANGES}`, 1, "minor"); });
      const tier = LAB_CONVENTIONS.donorByClass[kind];
      if (tier) {
        const bad = donors.filter((d) => d.format !== tier.format);
        add("donor-tier", "convention", bad.length === 0, bad.length ? `donor format ${bad.map((d) => d.format).join(", ")}; lab uses ${DONOR_FORMATS[tier.format].short} for this edit` : `donor format ${tier.format} as per lab convention`, 2, "major");
        if (tier.armBp) donors.forEach((d) => { for (const arm of [d.arm5, d.arm3]) if (Number.isInteger(arm)) add(`arm-length:${d.name || d.format}`, "convention", Math.abs(arm - tier.armBp) <= 0.25 * tier.armBp, `arm ${arm} bp vs lab ${tier.armBp} bp (+/-25% allowed because the engine can trim arms)`, 1, "minor"); });
      }
      if (expected && expected.intendedMarkerPositions && expected.intendedMarkerPositions.length) {
        const have = markers.filter((m) => m.role === "intended").map((m) => m.pos).sort((a, b) => a - b);
        const want = [...expected.intendedMarkerPositions].sort((a, b) => a - b);
        add("intended-edit", "key", JSON.stringify(have) === JSON.stringify(want), `intended change at ${have.join(",") || "none"}; mission requires ${want.join(",")}`, 3, "critical");
      } else if (hdr && (kind.startsWith("tag") || kind === "reporter")) {
        add("insert-present", "key", donors.some((d) => d.sequence.length > d.refEnd - d.refStart), "the donor must carry the tag/insert (longer than the replaced reference span)", 3, "critical");
      }
    }
  } else if (guides.length >= 2) {
    const cuts = guides.map((g) => g.cut).sort((a, b) => a - b);
    add("flanking-cuts", "convention", cuts[cuts.length - 1] - cuts[0] >= MIN_PAIR_CUT_SEPARATION, `cuts ${cuts[cuts.length - 1] - cuts[0]} bp apart (>= ${MIN_PAIR_CUT_SEPARATION} bp so a deletion between them is reliable)`, 1, "minor");
  }
  return summarise(checks);
}

function summarise(checks) {
  const total = checks.reduce((s, c) => s + c.weight, 0); const got = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
  return { score: total ? Math.round((100 * got) / total) : 0, checks, critical: checks.filter((c) => !c.pass && c.severity === "critical").map((c) => c.id) };
}
