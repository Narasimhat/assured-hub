// Rebuild the design the lab actually ran for the shipped APOE R176C traces, from the run manifest's variant list.
// Starting point: the Design engine's own export for the target (QC repo fixture), which supplies the reference window, primers and amplicon.
// Replaced: guides (the two the manifest lists), markers (the manifest's variants: D172D, R176C, L177L) and donors (36/91 nt asymmetric windows,
// donor strand opposite the guide strand, carrying the manifest's variants for that donor strand).
// This is a RECONSTRUCTION: see data/apoe_run_design_notes.json for what the shared data did not contain.
import { readFileSync, writeFileSync } from "node:fs";
import { validateDesignSpec } from "@assured/spec";
const [fixturePath, notesPath, out, genbankPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(fixturePath, "utf8")); const notes = JSON.parse(readFileSync(notesPath, "utf8"));
// The fixture's reference.offset is a coordinate in the fixture's own record. When a GenBank record is given, restate the offset in
// that record's coordinates (the window must occur exactly once), so that the offset can be checked against a file in this repository.
if (genbankPath) {
  const t = readFileSync(genbankPath, "utf8"), gb = t.slice(t.indexOf("ORIGIN") + 6).split("//")[0].replace(/[^acgtn]/gi, "").toUpperCase(), w = spec.reference.sequence.toUpperCase(), at = gb.indexOf(w);
  if (at < 0 || gb.indexOf(w, at + 1) >= 0) throw new Error("the reference window must occur exactly once in " + genbankPath);
  spec.reference.offset = at;
}
const ref = spec.reference.sequence; const rc = (s) => [...s].reverse().map((b) => ({ A: "T", C: "G", G: "C", T: "A" }[b])).join("");
const intendedFix = spec.markers.find((m) => m.role === "intended"); const editTrace = notes.variants.find((v) => v.role === "intended").tracePos;
const shift = intendedFix.pos - editTrace;                                   // trace window -> design window
const markers = notes.variants.map((v) => { const pos = v.tracePos + shift; if (ref[pos] !== v.ref) throw new Error(`variant ${v.label}: reference base ${ref[pos]} at ${pos}, manifest says ${v.ref}`); return { pos, ref: v.ref, alt: v.alt, role: v.role, label: v.label, change: `${v.ref}>${v.alt}` }; });
const edit = markers.find((m) => m.role === "intended").pos;
const guides = notes.guides_tested.map((spacer, i) => {
  const f = ref.indexOf(spacer), r = ref.indexOf(rc(spacer)); if (f < 0 && r < 0) throw new Error(`guide ${spacer} not in the reference window`);
  const strand = f >= 0 ? "+" : "-"; const start = f >= 0 ? f : r; const end = start + spacer.length;
  const pam = strand === "+" ? ref.slice(end, end + 3) : rc(ref.slice(start - 3, start)); if (!/^.GG$/.test(pam)) throw new Error(`guide ${spacer}: PAM ${pam} is not NGG`);
  const cut = strand === "+" ? end - 3 : start + 3;
  return { name: `APOE_gRNA_${"AB"[i]}`, spacer, pam, strand, cut, protospacerStart: start, protospacerEnd: end, offsetFromEdit: cut - edit, index: i + 1 };
});
guides.forEach((g) => markers.filter((m) => m.role === "blocking").forEach((m) => { if (m.guide == null && m.pos >= g.protospacerStart - 3 && m.pos < g.protospacerEnd + 3) m.guide = g.index; }));
markers.forEach((m) => { if (m.guide === undefined) m.guide = null; });
const donors = guides.map((g) => {
  const [left, right] = g.strand === "+" ? [36, 91] : [91, 36];             // PAM-distal arm 36, PAM-proximal arm 91 (paper); the donor is the strand opposite the guide
  const refStart = g.cut - left, refEnd = g.cut + right; const donorStrand = g.strand === "+" ? "-" : "+";
  const carries = notes.donorMapping.find((d) => d.strand === donorStrand).tracePositions.map((t) => t + shift);
  const arr = [...ref.slice(refStart, refEnd)]; markers.filter((m) => carries.includes(m.pos)).forEach((m) => { arr[m.pos - refStart] = m.alt; });
  const sequence = arr.join("");
  return { name: `ssODN ${donorStrand} for ${g.name} (reconstructed)`, format: "ssodn", sequence, refStart, refEnd, insertBp: 0, arm5: null, arm3: null, replacedBp: 0, insertStart: null, guide: g.index,
           orderSequence: donorStrand === "+" ? sequence : rc(sequence), orderStrand: donorStrand === "+" ? "+ strand" : "- strand (reverse complement)", carriesMarkers: carries };
});
const result = { ...spec, design: { ...spec.design, label: "R176C (CGC>TGC), reconstructed from the lab run manifest", reconstructed: true }, guides, markers, donors };
const v = validateDesignSpec(result); if (!v.ok) throw new Error("reconstructed design does not validate: " + v.errors.join("; "));
writeFileSync(out, JSON.stringify(result, null, 1));
console.log(JSON.stringify({ ok: true, shift, guides: guides.map((g) => `${g.name} ${g.strand} cut ${g.cut} offset ${g.offsetFromEdit} PAM ${g.pam}`), markers: markers.map((m) => `${m.pos}:${m.change}:${m.role}:g${m.guide}:${m.label}`), donors: donors.map((d) => `${d.name} ${d.refStart}-${d.refEnd} (${d.sequence.length} nt) carries ${d.carriesMarkers} arms ${d.refStart}..${guides[d.guide - 1].cut}..${d.refEnd}`) }, null, 1));
