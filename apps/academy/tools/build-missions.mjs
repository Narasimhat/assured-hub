// Build the Academy missions by running the real Design engine on reference fixtures from the Design repo's test suite.
// Outputs, per mission:  missions/<id>/mission.json   (student-facing brief + how the design was produced)
//                        missions/<id>/design.qc-design.json   (assured-qc-design/1 produced by the Design app's own exporter)
//                        answer-keys/<id>.key.json   (NOT for students: what the intended edit and blocking changes are)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { LAB_CONVENTIONS } from "@assured/rules";
import { QC_SPEC_SCHEMA, validateDesignSpec } from "@assured/spec";
import { runDesign } from "../../design/assured-crispr-designer/src/designEngine.js";
import { buildQcDesignSpec } from "../../design/assured-crispr-designer/src/qcExport.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const FIX = path.join(root, "..", "design", "assured-crispr-designer", "test", "fixtures");
const fixtureRel = (n) => `apps/design/assured-crispr-designer/test/fixtures/${n}`;

const MISSIONS = [
  {
    id: "m1-snp-apoe-r176c", title: "Install a single-codon change (APOE R176C) by HDR",
    strategy: "snp_hdr", args: ["pm", "apoe-r154s.gb", "R176C", "", 250, { expectedGene: "APOE", deliveryMethod: "rnp", coDeliveryBlocking: true }],
    objectives: ["Choose HDR with ssODNs, not a knockout, for a one-codon change.", "Place both guides close to the edit so HDR is not limited by cut-to-edit distance.",
      "Silently block re-cutting of the repaired allele for both guides.", "Tell the intended edit apart from clones that carry only the silent blocking changes."],
  },
  {
    id: "m2-ko-tagme", title: "Knock out TAGME with a two-guide deletion",
    strategy: "deletion", args: ["ko", "synthetic-tagging.gb", "", "", 400, { expectedGene: "TAGME" }],
    objectives: ["Choose a knockout strategy and two guides that flank the target.", "Recognise wild-type, heterozygous, homozygous and compound-heterozygous clones from a Sanger trace.",
      "Notice mosaic clones that must be re-cloned before expansion."],
  },
  {
    id: "m3-tag-nr2f2-2xha", title: "Knock in a small epitope tag (2xHA) at the NR2F2 C-terminus",
    strategy: "tag_small_hdr", args: ["ct", "nr2f2-ng016753.gb", "", "2xHA-only", "", { expectedGene: "NR2F2", donorFormat: "auto", autoTrimArms: true }],
    objectives: ["Choose an ssODN donor for a small tag.", "Check that the donor carries silent blocking changes for both guides.",
      "Distinguish a heterozygous from a homozygous knock-in clone and reject blocking-only conversion."],
  },
];

mkdirSync(path.join(root, "missions"), { recursive: true });
mkdirSync(path.join(root, "answer-keys"), { recursive: true });
const index = [];
for (const m of MISSIONS) {
  const [type, file, mutation, tag, arm, options] = m.args;
  const text = readFileSync(path.join(FIX, file), "utf8");
  const result = runDesign(type, text, mutation, tag, arm, options);
  if (result.err) throw new Error(`${m.id}: ${result.err}`);
  const spec = buildQcDesignSpec(result);
  const check = validateDesignSpec(spec);
  if (!check.ok) throw new Error(`${m.id}: exported design does not validate: ${check.errors.join("; ")}`);
  const kind = spec.design.editKind;
  const dir = path.join(root, "missions", m.id); mkdirSync(dir, { recursive: true });
  const designJson = JSON.stringify(spec, null, 1);
  writeFileSync(path.join(dir, "design.qc-design.json"), designJson);
  writeFileSync(path.join(dir, "mission.json"), JSON.stringify({
    schema: "assured-academy-mission/1", id: m.id, title: m.title, editKind: kind, gene: spec.design.gene, label: spec.design.label,
    objectives: m.objectives,
    howProduced: { tool: "Assured_CRISPR_Design designEngine.runDesign + qcExport.buildQcDesignSpec", args: m.args.slice(0, 5), options,
      referenceFixture: fixtureRel(file), designSchema: QC_SPEC_SCHEMA },
    caveats: ["Teaching case built from a reference fixture in the Design repo's test suite; it is not annotated against ClinVar or any patient.",
      "The reference file's licence/provenance has not been reviewed for redistribution."],
  }, null, 1));
  const intended = spec.markers.filter((x) => x.role === "intended").map((x) => x.pos);
  const blockingByGuide = {};
  for (const x of spec.markers.filter((y) => y.role === "blocking")) (blockingByGuide[x.guide] ||= []).push(x.pos);
  const donorClass = LAB_CONVENTIONS.donorByClass[kind] || null;
  writeFileSync(path.join(root, "answer-keys", `${m.id}.key.json`), JSON.stringify({
    schema: "assured-academy-key/1", missionId: m.id, DO_NOT_SHIP_TO_STUDENTS: true,
    designSha256: createHash("sha256").update(designJson).digest("hex"),
    expected: { strategy: m.strategy, editKind: kind, minGuides: LAB_CONVENTIONS.minGuides[kind], donorFormat: donorClass ? donorClass.format : null,
      intendedMarkerPositions: intended, blockingMarkerPositionsByGuide: blockingByGuide },
    referenceDesign: { guides: spec.guides.length, donors: spec.donors.map((d) => d.format), markers: spec.markers.length },
  }, null, 1));
  index.push({ id: m.id, title: m.title, editKind: kind, gene: spec.design.gene, guides: spec.guides.length, donors: spec.donors.length });
}
writeFileSync(path.join(root, "missions", "index.json"), JSON.stringify({ schema: "assured-academy-missions/1", missions: index }, null, 1));
console.log(JSON.stringify(index));
