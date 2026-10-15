#!/usr/bin/env node
// Generates the Academy UI's mission, preset-project and real-trace data from committed, verified inputs.
//   node tools/build-ui-data.mjs          write apps/academy-ui/src/data/generated/*.ts
//   node tools/build-ui-data.mjs --check  exit 1 if the files on disk differ from what would be generated
// Inputs: data/designs/*.design.json (Design engine output, validated with @assured/spec), data/real_trace_qc/*
// (Assured QC output and lab comparison), data/verification_grch38.csv, and the shipped .ab1 files.
// Nothing here is typed in by hand except teaching text; every sequence, coordinate and call is read from an input
// and cross-checked (codon translation, donor arms, guide-in-window) before it is written.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { validateDesignSpec } from "@assured/spec";
import { parseAbif } from "../../qc/src/abif.js";

const CORE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI = path.resolve(CORE, "..", "academy-ui");
const OUT = path.join(UI, "src", "data", "generated");
const SAMPLE = path.join(UI, "public", "sample_data");
const DESIGN_DATE = "2026-10-15"; // date the engine designs were produced (they carry no timestamp)

// ---- small utilities ----------------------------------------------------------------------------------------
const readText = (p) => readFileSync(p, "utf8").replace(/^\uFEFF/, "");
const readJson = (p) => JSON.parse(readText(p));
const COMP = { A: "T", C: "G", G: "C", T: "A" };
const rc = (s) => [...s].reverse().map((c) => COMP[c]).join("");
const comp = (s) => [...s].map((c) => COMP[c]).join("");
const BASES = "TCAG";
const AA = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
const translate = (c) => AA[BASES.indexOf(c[0]) * 16 + BASES.indexOf(c[1]) * 4 + BASES.indexOf(c[2])];
const must = (cond, msg) => { if (!cond) throw new Error(`build-ui-data: ${msg}`); };

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, ""); const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i += 1; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(cur); cur = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else cur += c;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows; return body.map((r) => Object.fromEntries(head.map((k, i) => [k, r[i] ?? ""])));
}
const num = (v) => (v === "" || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));

// ---- the engine's call vocabulary (apps/qc/src/genotype.js) mapped to the UI's coarse status ---------------------
export const CALL_TO_STATUS = {
  homozygous_edit: "HOMOZYGOUS_KI", heterozygous_edit: "HETEROZYGOUS_KI", homozygous_indel: "INDEL_KO", homozygous_wt: "WT_ESCAPEE",
  homozygous_partial: "PARTIAL_CONVERSION", two_partials: "PARTIAL_CONVERSION",
  edit_plus_partial: "EDIT_PLUS_OTHER", edit_plus_indel: "EDIT_PLUS_OTHER", homozygous_edit_indel: "EDIT_PLUS_OTHER",
  heterozygous_indel: "HETEROZYGOUS_INDEL", compound_heterozygous: "COMPOUND_HET", mixed: "MIXED", unclear: "MIXED",
};

// ---- designs ------------------------------------------------------------------------------------------------
function loadDesign(file) {
  const spec = readJson(path.join(CORE, "data", "designs", file)); const v = validateDesignSpec(spec);
  must(v.ok, `${file} does not validate: ${(v.errors || []).join("; ")}`); return spec;
}

// Reading frame -> { codonStart, residue } for a design position. APOE's reconstructed design has no coding block, so it is
// anchored on the R176 codon (CGC at design position 539, asserted below); HBB uses its coding segments.
function frameFor(spec, gene) {
  const ref = spec.reference.sequence;
  if (spec.coding) {
    const { segments, sequence } = spec.coding; must(spec.coding.strand === "+", "only + strand genes are handled here");
    let shift = null; for (let s = -3000; s <= 3000 && shift === null; s += 1) { const a = Math.max(0, s), b = Math.min(ref.length, sequence.length + s); if (b - a > 200 && ref.slice(a, b) === sequence.slice(a - s, b - s)) shift = s; }
    must(shift !== null, "coding block does not align to the design window");
    return (pos) => { let off = 0; for (const [a, b] of segments) { const i = pos - shift; if (i >= a && i < b) { const ci = off + (i - a); return { codonStart: pos - (ci % 3), residue: Math.floor(ci / 3) + 1 }; } off += b - a; } throw new Error(`position ${pos} is not coding`); };
  }
  must(gene === "APOE" && ref.slice(539, 542) === "CGC", "APOE anchor: codon at design position 539 must be CGC (Arg176)");
  return (pos) => { const cs = 539 + 3 * Math.floor((pos - 539) / 3); return { codonStart: cs, residue: 176 + (cs - 539) / 3 }; };
}

function analyseMarkers(spec, gene) {
  const ref = spec.reference.sequence, frame = frameFor(spec, gene);
  const ms = spec.markers.map((m) => {
    const f = frame(m.pos); const refCodon = ref.slice(f.codonStart, f.codonStart + 3); const k = m.pos - f.codonStart;
    must(refCodon[k] === m.ref, `marker ${m.pos}: reference base ${refCodon[k]} != ${m.ref}`);
    const altCodon = refCodon.slice(0, k) + m.alt + refCodon.slice(k + 1); const a0 = translate(refCodon), a1 = translate(altCodon);
    const aaLabel = `p.${a0}${f.residue}${a1}`;
    if (m.label) must(m.label.startsWith(aaLabel), `marker ${m.pos}: engine label "${m.label}" != computed ${aaLabel}`);
    return { pos: m.pos, change: `${m.ref}>${m.alt}`, codon: `${refCodon}>${altCodon}`, aaLabel, synonymous: a0 === a1, exportedRole: m.role };
  });
  const nonsyn = ms.filter((m) => !m.synonymous); must(nonsyn.length === 1, `expected exactly one amino-acid-changing marker, found ${nonsyn.length}`);
  const flagged = ms.filter((m) => m.exportedRole === "intended");
  must(flagged.length <= 1 && (flagged.length === 0 || flagged[0].pos === nonsyn[0].pos), "exported 'intended' marker is not the amino-acid-changing one");
  return ms.map((m) => ({ ...m, role: m.pos === nonsyn[0].pos ? "intended" : "blocking", roleCorrected: m.pos === nonsyn[0].pos && m.exportedRole !== "intended" }));
}

function describeDonors(spec, ms) {
  const editPos = ms.find((m) => m.role === "intended").pos;
  return spec.donors.map((d) => {
    const g = spec.guides[(d.guide || 1) - 1]; const left = g.cut - d.refStart, right = d.refEnd - g.cut;
    const [distal, proximal] = g.strand === "+" ? [left, right] : [right, left];
    must(d.sequence.length === d.refEnd - d.refStart, `${d.name}: sequence length != reference span`);
    must(distal === 36 && proximal === 91, `${d.name}: PAM-distal/proximal arms are ${distal}/${proximal}, expected 36/91`);
    const orderStrand = d.orderStrand.trim()[0]; must(orderStrand === "+" || orderStrand === "-", `${d.name}: unreadable orderStrand`);
    const o = d.orderSequence; must(o === (orderStrand === "+" ? d.sequence : rc(d.sequence)), `${d.name}: orderSequence is not the stated strand of the donor`);
    const carried = ms.filter((m) => d.carriesMarkers.includes(m.pos));
    must(carried.some((m) => m.pos === editPos), `${d.name}: donor does not carry the intended edit`);
    return {
      name: d.name, forGuide: g.name, strand: orderStrand, totalLength: o.length,
      arm5Length: orderStrand === "+" ? left : right, arm3Length: orderStrand === "+" ? right : left, // in the reading direction of the ordered oligo
      pamDistalArm: distal, pamProximalArm: proximal, sequence: o,
      intendedEditDescription: `${ms.find((m) => m.role === "intended").change} (${ms.find((m) => m.role === "intended").aaLabel})`,
      blockingChanges: carried.filter((m) => m.role === "blocking").map((m) => `${m.aaLabel} ${m.change} (${m.synonymous ? "silent" : "amino-acid changing"}, design position ${m.pos})`).join("; ") || "none",
    };
  });
}

function describeGuides(spec, ms) {
  const editPos = ms.find((m) => m.role === "intended").pos, win = spec.reference.sequence;
  return spec.guides.map((g) => {
    const site = win.slice(g.protospacerStart, g.protospacerEnd);
    must((g.strand === "+" ? site : rc(site)) === g.spacer, `${g.name}: spacer not found at its stated site`);
    const pam = g.strand === "+" ? win.slice(g.protospacerEnd, g.protospacerEnd + 3) : rc(win.slice(g.protospacerStart - 3, g.protospacerStart));
    must(pam.slice(1) === "GG" && pam === g.pam, `${g.name}: PAM ${pam} is not the stated NGG ${g.pam}`);
    return { name: g.name, sequence: g.spacer, pam, strand: g.strand, cutDist: Math.abs(g.cut - editPos), cutPosition: g.cut }; // geometry, not the exported offsetFromEdit
  });
}

function targetWindow(spec, ms, guides) {
  const editPos = ms.find((m) => m.role === "intended").pos, a = editPos - 50, b = editPos + 50, seq = spec.reference.sequence.slice(a, b);
  must(seq.length === 100, "target window is not 100 nt");
  for (const g of spec.guides) must(Math.min(g.protospacerStart, g.protospacerEnd) - 3 >= a && g.protospacerEnd + 3 <= b, `${g.name} (with PAM) is outside the displayed target window`);
  return { seq, complement: comp(seq), start: a };
}

function primersOf(spec) {
  const fw = spec.primers.find((p) => p.strand === "+"), rv = spec.primers.find((p) => p.strand === "-"), amp = spec.amplicons[0];
  must(amp.wtBp === rv.end - fw.start, "amplicon size != primer span");
  return { forwardPrimer: { name: fw.name, sequence: fw.sequence, length: fw.sequence.length }, reversePrimer: { name: rv.name, sequence: rv.sequence, length: rv.sequence.length }, ampliconSizeBp: amp.wtBp };
}

// ---- verification table -------------------------------------------------------------------------------------
function verificationOf(file) {
  const rows = parseCsv(readText(path.join(CORE, "data", "verification_grch38.csv"))).filter((r) => r.design === file);
  must(rows.length > 0, `no verification rows for ${file}`);
  return { assembly: "GRCh38", total: rows.length, passed: rows.filter((r) => r.result === "OK").length, failed: rows.filter((r) => r.result !== "OK").map((r) => r.check), note: "genome-wide specificity was not assessed" };
}

// ---- real traces --------------------------------------------------------------------------------------------
function cloneRows(dataset, dir) {
  const eng = parseCsv(readText(path.join(CORE, "data", "real_trace_qc", `${dir}.engine_results.csv`)));
  const cmp = parseCsv(readText(path.join(CORE, "data", "real_trace_qc", "comparison.csv"))).filter((r) => r.dataset === dataset);
  return cmp.map((c) => {
    const stem = c.file.replace(/\.ab1$/, ""), e = eng.find((r) => r.sample === stem); must(e, `${stem}: no engine row`);
    must(CALL_TO_STATUS[e.clone_call], `engine call "${e.clone_call}" is not in the UI vocabulary`);
    must(existsSync(path.join(SAMPLE, dir, c.file)), `${c.file} is not shipped`);
    const clone = {
      cloneId: stem, wellId: stem.split("_").pop(), status: CALL_TO_STATUS[e.clone_call], statusLabel: e.result,
      hdrPercentage: num(e.intended_edit_pct) ?? 0, indelPercentage: num(e.indel_pct) ?? 0, wtPercentage: num(e.wild_type_pct) ?? 0,
      blockingOnlyPercentage: num(e.blocking_only_pct) ?? 0, callSource: "assured-qc-engine", engineCall: e.clone_call,
      engineDecision: e.decision, engineConfidence: e.confidence, isRecommendedForExpansion: e.decision === "accept",
      ab1TraceUrl: `/sample_data/${dir}/${c.file}`, labCall: { clone: c.lab_clone, recommendation: c.lab_recommendation, detail: c.lab_detail, agreement: c.agreement },
    };
    if (num(e.fit_r2) !== undefined) clone.r2ModelFit = num(e.fit_r2);
    if (e.notes) clone.engineNotes = e.notes;
    return clone;
  });
}

function controlCalls(dir) {
  const buf = readFileSync(path.join(SAMPLE, dir, "Ctrl.ab1"));
  return parseAbif(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)).calls;
}

// Index of the edited base in the control read, found from 20 nt of exact flank on each side; both flanks must be adjacent.
function editReadIndex(calls, ref, editPos, k = 20) {
  const left = calls.indexOf(ref.slice(editPos - k, editPos)), right = calls.indexOf(ref.slice(editPos + 1, editPos + 1 + k));
  must(left >= 0 && right === left + k + 1, "the control read does not carry the reference flanks around the edit (it may be reverse-oriented or differ there)");
  return left + k;
}

function myd88Window() {
  const eng = parseCsv(readText(path.join(CORE, "data", "real_trace_qc", "myd88.engine_results.csv")));
  const cut = Number((eng.map((r) => /read position (\d+)/.exec(r.notes || "")).find(Boolean) || [])[1]); must(cut > 50, "MYD88: inferred cut position not found in the engine notes");
  const calls = controlCalls("myd88");
  const seq = calls.slice(cut - 50, cut + 50);
  // Place the window in the protein: translate the three frames and look for a 30+ residue exact match in canonical MYD88.
  const prot = readJson(path.join(CORE, "references", "MYD88_Q99836.uniprot.json")); let placement = null;
  for (let f = 0; f < 3 && !placement; f += 1) {
    let pep = ""; for (let i = f; i + 3 <= seq.length; i += 3) pep += translate(seq.slice(i, i + 3));
    const core = pep.split("*").sort((a, b) => b.length - a.length)[0]; const at = prot.sequence.indexOf(core);
    if (core.length >= 30 && at >= 0) placement = { peptide: core, first: at + 1, last: at + core.length, domain: prot.domains.find((d) => d.start <= at + 1 && d.end >= at + core.length) };
  }
  must(placement && placement.domain, "MYD88: the control window does not translate to a stretch of canonical MYD88 inside a UniProt domain");
  must(prot.sequence[72] !== "L", "MYD88: residue 73 is Leu after all; the claim about the earlier preset must be revisited");
  return { cut, seq, placement, residue73: prot.sequence[72], accession: prot.accession };
}

const DEFAULT_FIGURE = (title) => ({ showPanelA: true, showPanelB: true, showPanelC: true, showPanelD: true, figureTitle: title, figureWidth: "double-column" });

// ---- build --------------------------------------------------------------------------------------------------
export function buildUiData() {
  const qcVersion = readJson(path.join(CORE, "..", "qc", "package.json")).version;
  const apoeFile = "apoe_r176c_run.reconstructed.design.json", hbbFile = "HBB_E7V.engine.design.json";
  const apoe = loadDesign(apoeFile), hbb = loadDesign(hbbFile);
  const aM = analyseMarkers(apoe, "APOE"), hM = analyseMarkers(hbb, "HBB");
  const aG = describeGuides(apoe, aM), hG = describeGuides(hbb, hM), aD = describeDonors(apoe, aM), hD = describeDonors(hbb, hM);
  must(hM.find((m) => m.role === "intended").aaLabel === "p.E7V", "HBB intended edit is not p.E7V");
  must(aM.find((m) => m.role === "intended").aaLabel === "p.R176C", "APOE intended edit is not p.R176C");
  const aV = verificationOf(apoeFile), hV = verificationOf(hbbFile);
  const aW = targetWindow(apoe, aM, aG), hW = targetWindow(hbb, hM, hG);
  const apoeClones = cloneRows("APOE R176C", "apoe"), mydClones = cloneRows("MYD88 KO", "myd88"), mw = myd88Window();
  const silent = (ms) => ms.filter((m) => m.role === "blocking").map((m) => `${m.aaLabel} (${m.codon}) is a ${m.synonymous ? "silent" : "amino-acid-changing"} change at design position ${m.pos}`);
  const hbbRoleFixed = hM.some((m) => m.roleCorrected);

  const missions = [
    {
      id: "mission-apoe", diseaseName: "APOE ε2/ε3 isoform edit (late-onset Alzheimer disease risk)", inheritance: "Risk-modifying allele, not a Mendelian disease variant",
      gene: "APOE (apolipoprotein E)", proteinChange: "p.Arg176Cys (legacy Arg158Cys, rs7412)", genomicCoord: "chr19:44,908,822 (GRCh38)", refAllele: "C", altAllele: "T",
      phenotypeDescription: "APOE ε2, ε3 and ε4 are defined by two SNPs. rs429358 (Cys130Arg in HGVS numbering) separates ε3 from ε4, and rs7412 (Arg176Cys, this mission) separates ε3 from ε2. ε4 raises the risk of late-onset Alzheimer disease and ε2 lowers it relative to ε3, so isogenic iPSC lines that differ only at these SNPs let you attribute a phenotype to the isoform. The two SNPs are 138 bp apart on GRCh38, so one cut site can serve either edit.",
      curationNotes: "Guides and the three variants (D172D, R176C, L177L) come from the lab run manifest. The ssODN sequences are reconstructed from that manifest because the lab's order sheets were not available, so treat them as a teaching reconstruction of the design, not the oligos that were ordered. Reference window, edit coordinate, PAMs, cut sites and donor arms were checked against GRCh38. Five real Sanger traces from this run are included for the QC stage.",
      strategy: "HDR-SNP-Edit", recommendedGuides: aG, ssodnTemplate: aD[0].sequence, ssodns: aD, silentChanges: silent(aM),
      verification: aV, traceProjectId: "proj-apoe-r176c-lab",
    },
    {
      id: "mission-hbb", diseaseName: "Sickle cell disease (HbS, β-globin Glu7Val)", inheritance: "Autosomal recessive",
      gene: "HBB (hemoglobin subunit beta)", proteinChange: "p.Glu7Val (legacy Glu6Val; c.20A>T; rs334)", genomicCoord: "chr11:5,227,002 (GRCh38; HBB is on the minus strand, so coding A>T is T>A on the reference strand)", refAllele: "A", altAllele: "T",
      phenotypeDescription: "The HbS variant makes haemoglobin polymerise when deoxygenated, which deforms red cells (sickling) and causes haemolytic anaemia and vaso-occlusive crises. This mission installs the variant (GAG>GTG) in wild-type iPSCs to model the disease. Correcting patient cells is the mirror edit (GTG>GAG) and needs a patient-derived reference sequence, which this mission does not provide.",
      curationNotes: `Designed by the Assured CRISPR Design engine on RefSeqGene NG_059281.1. The engine returned one guide for this window, while the lab convention is two guides, so finding a second guide is part of the exercise. Checked against GRCh38: ${hV.passed} of ${hV.total} checks pass. The two that do not are inconsistencies in the Design hand-off file (the edit base is exported with role "blocking", and the guide offset is one bp off), documented in docs/FINDINGS.md. On 7 synthetic clones, Assured QC's calls, decisions and numbers did not change with that label, but its text omits \"(intended edit absent)\" for clones that carry only the blocking changes. There are no real traces for this mission.`,
      strategy: "HDR-SNP-Edit", recommendedGuides: hG, ssodnTemplate: hD[0].sequence, ssodns: hD, silentChanges: silent(hM),
      verification: hV,
    },
  ];
  const unverified = [
    { id: "mission-cacnb2", gene: "CACNB2", claimed: "p.Ser426Leu (c.1277C>T), chr10:18194473 (GRCh38)", reason: "The reference base at the stated coordinate does not match the stated allele; the stated guide was not found within 200 bp of the site; the 97-nt ssODN best matches GRCh38 with 60 mismatches (62%). I also could not find a ClinVar record for this exact change." },
    { id: "mission-cep83", gene: "CEP83", claimed: "p.Gln261*, chr12:54832910 (GRCh38)", reason: "The stated coordinate lies outside CEP83 (the gene is at about chr12:94.3 to 94.5 Mb on GRCh38); the stated guide was not found within 200 bp of the site; the 84-nt ssODN best matches GRCh38 with 54 mismatches (64%)." },
  ];

  // Bench stage: the Table 7 condition follows the designed guide count (0 = guides not recorded, so no condition is claimed).
  const benchOf = (guideCount, isKnockout, completed) => `@@BENCH:${JSON.stringify({ ...(guideCount ? { condition: `${guideCount >= 2 ? 2 : 1}gRNA-${isKnockout ? "KO" : "KI"}` } : {}), isBenchCompleted: completed })}@@`;
  const locus = (o) => ({ species: "Homo sapiens", assembly: "GRCh38", windowCentreIndex: 50, ...o }); // the window is edit-50..edit+50 (or the inferred cut for MYD88)
  const projects = [
    {
      id: "proj-apoe-r176c-lab", title: "APOE p.Arg176Cys (rs7412) knock-in: lab guides, 5 real Sanger traces", createdAt: "2026-10-13", currentStage: 1,
      target: locus({
        id: "target-apoe", gene: "APOE", diseaseName: "APOE ε3→ε2 isoform edit (Alzheimer disease risk modifier)", chromosome: "chr19", genomicCoordinate: "chr19:44,908,822", refAllele: "C", altAllele: "T",
        aminoAcidChange: "p.Arg176Cys (rs7412)", targetSequence5to3: aW.seq, complementSequence3to5: aW.complement, targetType: "SNP_KNOCKIN",
        controlAb1Url: "/sample_data/apoe/Ctrl.ab1", traceViewCentre: editReadIndex(controlCalls("apoe"), apoe.reference.sequence, aM.find((m) => m.role === "intended").pos), batchCsvUrl: "/sample_data/apoe/Synthego_ICE_Analysis_batch.csv",
        guides: aG.map((g, i) => ({ id: `apoe-g${i + 1}`, name: g.name, sequence: g.sequence, pam: g.pam, strand: g.strand, cutDistanceToEdit: g.cutDist, isSelected: true })),
        donor: aD[0], donors: aD, primers: primersOf(apoe),
        notes: ["Guides and variants: lab run manifest. ssODNs: reconstructed from that manifest (the lab's order sheets were not available).", `Calls on the traces: Assured QC ${qcVersion}, compared with the lab's own pipeline output in the Clones table.`, "Efficiency and off-target scores are not shown: the Design engine does not compute them and genome-wide specificity was not checked."],
      }),
      bench: benchOf(aG.length, false, true), clones: apoeClones, figureConfig: DEFAULT_FIGURE("APOE p.Arg176Cys knock-in in hiPSCs with the ASSURED protocol"),
      provenance: ["Real data: 5 Sanger traces and the control from the lab run (sha256-matched to the lab's CSV).", `Engine: Assured QC ${qcVersion}, design reconstructed from the lab manifest.`, "Bench values on stage 3 are protocol defaults, not the lab's recorded values."], verification: aV,
    },
    {
      id: "proj-myd88-ko-lab", title: "MYD88 knockout: 5 real Sanger traces (guides not recorded)", createdAt: "2023-08-09", currentStage: 4,
      target: locus({
        id: "target-myd88", gene: "MYD88", diseaseName: "MYD88 knockout (innate immune signalling)", chromosome: "chr3", genomicCoordinate: "not established from the shipped data (Sanger read coordinates only)",
        refAllele: "WT", altAllele: "−79 bp deletion (engine call on 4 of 5 clones)", aminoAcidChange: `frameshift expected: the window encodes MYD88 residues ${mw.placement.first} to ${mw.placement.last} and −79 is not a multiple of 3`,
        targetSequence5to3: mw.seq, complementSequence3to5: comp(mw.seq), targetType: "KNOCKOUT", controlAb1Url: "/sample_data/myd88/Ctrl.ab1", traceViewCentre: mw.cut, batchCsvUrl: "/sample_data/myd88/Synthego_ICE_Analysis_2023_08_09_1691566838.csv",
        guides: [], donor: { name: "none (NHEJ knockout)", strand: "+", totalLength: 0, arm5Length: 0, arm3Length: 0, sequence: "", intendedEditDescription: "frameshift indel", blockingChanges: "not applicable", pamDistalArm: 0, pamProximalArm: 0, forGuide: "" },
        notes: ["The guide and primer sequences for this run were not recorded in the shipped data, so none are shown.", `The target window is control-read bases ${mw.cut - 50} to ${mw.cut + 50}, centred on the cut that Assured QC inferred without a guide (read position ${mw.cut}).`, `In frame the window encodes MYD88 residues ${mw.placement.first} to ${mw.placement.last} (${mw.placement.peptide}), inside the ${mw.placement.domain.description} domain (${mw.placement.domain.start} to ${mw.placement.domain.end}, UniProt ${mw.accession}).`],
      }),
      bench: benchOf(0, true, true), clones: mydClones, figureConfig: DEFAULT_FIGURE("MYD88 knockout in hiPSCs with the ASSURED protocol"),
      provenance: ["Real data: 5 Sanger traces and the control (sha256-matched to the lab's CSV).", `Engine: Assured QC ${qcVersion} in cut-discovery mode (no guide given).`, "Bench values on stage 3 are protocol defaults, not the lab's recorded values."],
    },
    {
      id: "proj-hbb-e7v-design", title: "HBB p.Glu7Val (rs334) knock-in: engine design, no traces", createdAt: DESIGN_DATE, currentStage: 1,
      target: locus({
        id: "target-hbb", gene: "HBB", diseaseName: "Sickle cell disease (HbS), modelled by installing Glu7Val", chromosome: "chr11", genomicCoordinate: "chr11:5,227,002 (minus-strand gene)", refAllele: "A", altAllele: "T",
        aminoAcidChange: "p.Glu7Val (legacy Glu6Val, rs334)", targetSequence5to3: hW.seq, complementSequence3to5: comp(hW.seq), targetType: "SNP_KNOCKIN",
        guides: hG.map((g, i) => ({ id: `hbb-g${i + 1}`, name: g.name, sequence: g.sequence, pam: g.pam, strand: g.strand, cutDistanceToEdit: g.cutDist, isSelected: true })),
        donor: hD[0], donors: hD, primers: primersOf(hbb),
        notes: ["Designed by the Assured CRISPR Design engine on NG_059281.1. The window is shown in the HBB (coding) orientation.", "Only one guide was returned. The lab convention is two guides, so adding a second is part of the exercise.", hbbRoleFixed ? "The Design hand-off labels the edit base as role 'blocking'; it is shown here as the intended edit (confirmed by codon: GAG>GTG)." : ""].filter(Boolean),
      }),
      bench: benchOf(hG.length, false, false), clones: [], figureConfig: DEFAULT_FIGURE("HBB p.Glu7Val knock-in in hiPSCs with the ASSURED protocol"),
      provenance: [`Engine design on NG_059281.1, checked against GRCh38 (${hV.passed} of ${hV.total} checks pass; the other ${hV.total - hV.passed} are documented export inconsistencies).`, "No real traces are shipped for this design."], verification: hV,
    },
  ];
  const exampleOf = (id, label, gene, diseaseName, spec, ms) => {
    const m = ms.find((x) => x.role === "intended"), [ref, alt] = m.change.split(">"), seq = spec.reference.sequence.slice(m.pos - 150, m.pos + 150);
    must(seq.length === 300 && seq[150] === ref, `${id}: example window is not 300 nt centred on the reference base`);
    return { id, label, gene, diseaseName, mode: "SNP_KNOCKIN", sequence: seq, editPosition: 150, altBase: alt, description: m.aaLabel };
  };
  const examples = [
    exampleOf("example-apoe", "APOE R176C (rs7412, C>T)", "APOE", "Alzheimer disease risk modifier", apoe, aM),
    exampleOf("example-hbb", "HBB Glu7Val (rs334, A>T in gene orientation)", "HBB", "Sickle cell disease", hbb, hM),
  ];
  return { missions, unverified, projects, qcVersion, examples, datasets: buildDatasets(apoeClones, mydClones) };
}

// ---- downloadable files ---------------------------------------------------------------------------------------
// Every entry points at a file that exists. Files that live outside public/ are copied in by the generator.
function buildDatasets(apoeClones, mydClones) {
  const entries = [], copies = [];
  const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
  const add = (id, name, category, description, from, urlDir, copy) => {
    const file = path.basename(from); const to = copy ? path.join(SAMPLE, urlDir, file) : from;
    must(existsSync(from), `${from} does not exist`); if (copy) copies.push({ from, to });
    entries.push({ id, name, category, description, url: `/sample_data/${urlDir}/${file}`, downloadFilename: file, bytes: statSync(from).size, sha256: sha(from) });
  };
  const D = (f) => path.join(CORE, "data", "designs", f);
  add("design-apoe-lab", "APOE R176C design rebuilt from the lab run manifest", "Design-Report", "Two guides, two ssODNs, three variants (D172D, R176C, L177L). The ssODNs are reconstructed from the manifest, not the lab's order sheet. Use it with the five APOE traces and Ctrl.ab1 in Assured QC.", D("apoe_r176c_run.reconstructed.design.json"), "designs", true);
  add("design-apoe-engine", "APOE R176C design from the Assured CRISPR Design engine", "Design-Report", "Produced on RefSeqGene NG_007084.2: two guides, two 127-nt ssODNs with 36/91 arms.", D("APOE_R176C.engine.design.json"), "designs", true);
  add("design-hbb-engine", "HBB Glu7Val design from the Assured CRISPR Design engine", "Design-Report", "Produced on RefSeqGene NG_059281.1: one guide and one 127-nt ssODN. The file labels the edit base with role 'blocking' (documented export issue). On 7 synthetic clones, Assured QC's calls and numbers did not change with that label, but its text omits '(intended edit absent)' for blocking-only clones.", D("HBB_E7V.engine.design.json"), "designs", true);
  add("ref-apoe", "APOE RefSeqGene NG_007084.2 (GenBank)", "GenBank-Ref", "The reference record the APOE designs were built on.", path.join(CORE, "references", "NG_007084.2.gb"), "references", true);
  add("ref-hbb", "HBB RefSeqGene NG_059281.1 (GenBank)", "GenBank-Ref", "The reference record the HBB design was built on (LRG_1232).", path.join(CORE, "references", "NG_059281.1.gb"), "references", true);
  for (const [dir, label, clones] of [["apoe", "APOE R176C", apoeClones], ["myd88", "MYD88 KO", mydClones]]) {
    add(`ab1-${dir}-ctrl`, `${label}: unedited control trace`, "Sanger-AB1", "Real Sanger trace of the unedited control for this run.", path.join(SAMPLE, dir, "Ctrl.ab1"), dir, false);
    for (const c of clones) add(`ab1-${dir}-${c.cloneId}`, `${label}: clone ${c.cloneId}`, "Sanger-AB1", `Real Sanger trace; the lab's own number for this clone is ${c.labCall.clone} (${c.labCall.recommendation}).`, path.join(SAMPLE, dir, `${c.cloneId}.ab1`), dir, false);
  }
  const lab = (dir) => readdirSync(path.join(SAMPLE, dir)).filter((f) => f.endsWith(".csv"))[0];
  add("csv-apoe-lab", "APOE: the lab's own analysis table", "Results-Table", "Per-clone output of the lab's analysis pipeline for the whole run. The file name says Synthego ICE, but the columns come from the lab's own pipeline. Absolute paths were removed.", path.join(SAMPLE, "apoe", lab("apoe")), "apoe", false);
  add("csv-myd88-lab", "MYD88: the lab's own analysis table", "Results-Table", "As above, for the MYD88 knockout run. Absolute paths were removed.", path.join(SAMPLE, "myd88", lab("myd88")), "myd88", false);
  add("csv-comparison", "Assured QC calls versus the lab's calls (10 clones)", "Results-Table", "Joined by sha256 of each trace. The agreement column follows an explicit rule in tools/compare_real_traces.py and measures agreement with the lab's pipeline, not with an independent genotype.", path.join(CORE, "data", "real_trace_qc", "comparison.csv"), "real_trace_qc", true);
  add("csv-verification", "GRCh38 checks of the three designs", "Results-Table", "Reference window, edit base, guide PAMs and cuts, donor arms. Genome-wide specificity was not assessed. Two checks fail for the HBB hand-off (see docs/FINDINGS.md).", path.join(CORE, "data", "verification_grch38.csv"), "real_trace_qc", true);
  return { entries, copies };
}

// ---- render -------------------------------------------------------------------------------------------------
const BANNER = "// AUTO-GENERATED by apps/academy-core/tools/build-ui-data.mjs. Do not edit by hand.\n// Regenerate with `npm run build:ui-data`; CI runs `npm run check:ui-data` and fails on drift.\n";
const json = (v) => JSON.stringify(v, null, 2);

export function renderFiles(data) {
  const withBench = (s) => s.replace(/"@@BENCH:((?:[^"\\]|\\.)*)@@"/g, (_, esc) => {
    const o = JSON.parse(JSON.parse(`"${esc}"`)); const props = Object.entries(o).map(([k, v]) => `${k}: ${typeof v === "string" ? `'${v}'` : v}`);
    return `{ ...DEFAULT_BENCH, ${props.join(", ")} }`;
  });
  const presets = withBench(json(data.projects)).replace(/"bench": \{ \.\.\.DEFAULT_BENCH/g, "bench: { ...DEFAULT_BENCH");
  const texts = {
    "missions.generated.ts": `${BANNER}import type { RareDiseaseMission, UnverifiedMission } from '../../types';\n\nexport const RARE_DISEASE_MISSIONS: RareDiseaseMission[] = ${json(data.missions)};\n\nexport const UNVERIFIED_MISSIONS: UnverifiedMission[] = ${json(data.unverified)};\n`,
    "presets.generated.ts": `${BANNER}import type { AssuredProject } from '../../types/pipeline';\nimport { DEFAULT_BENCH } from '../benchDefaults';\n\nexport const QC_ENGINE_VERSION = ${JSON.stringify(data.qcVersion)};\n\nexport const PRESET_PROJECTS: AssuredProject[] = ${presets};\n`,
    "examples.generated.ts": `${BANNER}import type { DesignExample } from '../../types';\n\nexport const DESIGN_EXAMPLES: DesignExample[] = ${json(data.examples)};\n`,
    "sampleDatasets.generated.ts": `${BANNER}import type { SampleDataset } from '../../types';\n\nexport const SAMPLE_DATASETS: SampleDataset[] = ${json(data.datasets.entries)};\n`,
  };
  return { texts: Object.entries(texts).map(([name, content]) => ({ path: path.join(OUT, name), content })), copies: data.datasets.copies };
}

function main() {
  const { texts, copies } = renderFiles(buildUiData()); const check = process.argv.includes("--check"); let drift = 0;
  const rel = (p) => path.relative(path.resolve(CORE, "..", ".."), p);
  const same = (p, buf) => existsSync(p) && Buffer.compare(readFileSync(p), buf) === 0;
  if (!check) mkdirSync(OUT, { recursive: true });
  for (const { path: p, content } of texts) {
    const buf = Buffer.from(content, "utf8");
    if (check) { if (!same(p, buf)) { console.error(`DRIFT: ${rel(p)} differs from the generator output`); drift += 1; } }
    else { writeFileSync(p, buf); console.log(`wrote ${rel(p)} (${buf.length} bytes)`); }
  }
  for (const { from, to } of copies) {
    const buf = readFileSync(from);
    if (check) { if (!same(to, buf)) { console.error(`DRIFT: ${rel(to)} is not a byte-identical copy of ${rel(from)}`); drift += 1; } }
    else { mkdirSync(path.dirname(to), { recursive: true }); writeFileSync(to, buf); console.log(`copied ${rel(from)} -> ${rel(to)}`); }
  }
  if (check) { if (drift) process.exit(1); console.log(`generated UI data is up to date (${texts.length} files, ${copies.length} copies)`); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
