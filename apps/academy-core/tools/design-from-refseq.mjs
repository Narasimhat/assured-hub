// Run the REAL Design engine on a RefSeqGene record and write the assured-qc-design/1 export plus a short summary.
// usage: node design-from-refseq.mjs <genbank file> <gene> <protein change e.g. R176C> <out.json>
import { readFileSync, writeFileSync } from "node:fs";
import { validateDesignSpec } from "@assured/spec";
import { MAX_GUIDE_CUT_DISTANCE } from "@assured/rules";
import { runDesign } from "../../design/assured-crispr-designer/src/designEngine.js";
import { buildQcDesignSpec } from "../../design/assured-crispr-designer/src/qcExport.js";
const [gbPath, gene, change, out] = process.argv.slice(2);
const res = runDesign("pm", readFileSync(gbPath, "utf8"), change, "", 250, { expectedGene: gene, deliveryMethod: "rnp", coDeliveryBlocking: true });
if (res.err) { console.error("ENGINE REFUSED:", res.err); process.exit(2); }
const spec = buildQcDesignSpec(res); const v = validateDesignSpec(spec);
writeFileSync(out, JSON.stringify(spec, null, 1));
console.log(JSON.stringify({ gene, change, valid: v.ok, errors: v.errors, warnings: v.warnings, refLen: spec.reference.sequence.length, refOffset: spec.reference.offset, design: spec.design,
  guides: spec.guides.map((g) => ({ name: g.name, spacer: g.spacer, pam: g.pam, strand: g.strand, cut: g.cut, offsetFromEdit: g.offsetFromEdit, withinLimit: Math.abs(g.offsetFromEdit) <= MAX_GUIDE_CUT_DISTANCE })),
  donors: spec.donors.map((d) => ({ format: d.format, len: d.sequence.length, refStart: d.refStart, refEnd: d.refEnd, carries: d.carriesMarkers })),
  markers: spec.markers.map((m) => `${m.pos}:${m.ref}>${m.alt}:${m.role}:g${m.guide}:${m.label}`), primers: spec.primers.map((p) => `${p.name}:${p.sequence}`), amplicon: spec.amplicons[0] && spec.amplicons[0].wtBp }, null, 1));
