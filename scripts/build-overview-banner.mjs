// Rebuild the landing artwork from the bundled APOE design and simulated training AB1 traces.
// Run: node scripts/build-overview-banner.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseAbif } from '../apps/qc/src/abif.js';
import { analyseSample } from '../apps/qc/src/batch.js';
import { decide } from '../apps/qc/src/decision.js';
import { withRecommendations } from '../apps/qc/src/recommend.js';
import { cloneAlignedFigure } from '../apps/qc/src/alignedFigure.js';
import { cloneSelectionFigure } from '../apps/qc/src/selectionFigure.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataDir = `${root}apps/studio/public/demo_traces/`;
const output = `${root}public/assets/`;
fs.mkdirSync(output, { recursive: true });
const specFile = 'apoe_r176c_snp.design.json';
const spec = JSON.parse(fs.readFileSync(dataDir + specFile));
const controlFile = 'apoe_control.ab1';
const samples = ['apoe_snp_clone_hom_edited.ab1', 'apoe_snp_clone_het_edited.ab1', 'apoe_snp_clone_partial_het_edited.ab1'];
const names = ['Homozygous example', 'Heterozygous example', 'Partial-conversion example'];
const load = name => parseAbif(fs.readFileSync(`${dataDir}${name}`), name);
const control = load(controlFile);
const traces = samples.map(load);
const results = withRecommendations(traces.map((edited, i) => {
  const r = analyseSample({ name: names[i], spec, control, edited, sampleType: 'clone' });
  if (!r.ok) throw new Error(`${r.name}: ${r.error}`);
  return { ...r, workflow: "snp", decision: decide("snp", r, { goal: "homozygous" }) };
}));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = (x, y, s, size = 16, color = '#d6e2ef', weight = 400, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;
const rect = (x, y, w, h, fill, rx = 12, stroke = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;
const mono = 'font-family="Courier New,monospace"';
const line = (x1, y1, x2, y2, color = '#30455d', extra = '') => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" fill="none" ${extra}/>`;
const colors = ['#71e5b1', '#69d9ff', '#c4a3ff', '#ffca85'];
function card(index, title, subtitle, body) {
  return rect(0, 0, 348, 394, '#122238', 20, '#2b4159') + rect(20, 22, 35, 30, colors[index], 9)
    + text(37.5, 43, `0${index + 1}`, 14, '#102035', 700, 'text-anchor="middle"')
    + text(68, 44, title, 25, '#f5f9ff', 700) + text(22, 78, subtitle, 14, '#9eb4ca') + body;
}
const learn = card(0, 'Learn', 'ASSURED Academy',
  text(22, 141, '12', 58, colors[0], 700) + text(110, 123, 'lessons', 20, '#edf8f3', 600)
  + text(110, 148, '4 curriculum tracks', 15, '#9eb4ca')
  + ['Stem-cell foundations', 'CRISPR design principles', 'Experimental practice', 'Interpreting evidence'].map((s, i) =>
    rect(22, 178 + i * 40, 304, 32, '#182f42', 7) + text(35, 200 + i * 40, String(i + 1).padStart(2, '0'), 12, colors[0], 600, mono) + text(67, 200 + i * 40, s, 14)).join('')
  + text(22, 370, 'Lessons · quizzes · guided examples', 13, colors[0]));
const guides = spec.guides;
const design = card(1, 'Design', 'ASSURED Bench · APOE R176C',
  text(22, 116, 'R176C · CGC → TGC', 20, '#d7baff', 700)
  + text(22, 141, 'ssODN repair + silent blocking changes', 14, '#a9c5dc')
  + rect(22, 155, 304, 58, '#0b1b2d', 10)
  + line(39, 184, 308, 184, '#57718a', 'stroke-width="3"')
  + spec.markers.map(m => rect(40 + (m.pos - 529) / 25 * 266, 173, 7, 22, m.role === 'intended' ? '#c4a3ff' : '#ffca85', 3)).join('')
  + text(160, 170, 'C → T', 12, '#d7baff', 700, 'text-anchor="middle"')
  + guides.map((g, i) => text(22, 242 + i * 54, `Guide option ${i + 1} · reverse strand`, 12, colors[1], 600)
    + text(22, 263 + i * 54, g.spacer, 16, '#eaf3ff', 400, mono)).join('')
  + text(22, 370, 'Guide options · donor · primers · orders', 12, colors[1]));
// The same resampled, aligned trace view that powers the app's figures.
const view = results[0].view;
const first = Math.min(...view.markers.map(m => m.at)) - 2;
const last = Math.max(...view.markers.map(m => m.at)) + 3;
const nBases = last - first;
const xBase = at => 22 + (at - first + 0.5) / nBases * 304;
function chromatogram(read, y, label) {
  let svg = text(22, y, label, 13, '#dbe6f5', 600) + line(22, y + 70, 326, y + 70);
  for (const m of view.markers) svg += rect(xBase(m.at) - 5, y + 9, 10, 63, m.role === 'intended' ? '#7b4f9e' : '#775737', 0);
  const channelColors = { A: '#65dfa4', C: '#6cbcff', G: '#c7d1df', T: '#ff7e91' };
  for (let at = first; at < last; at++) svg += text(xBase(at), y + 20, read.calls[at], 9, channelColors[read.calls[at]] || '#d6e2ef', 400, 'text-anchor="middle" ' + mono);
  for (const [base, color] of Object.entries(channelColors)) {
    let d = '';
    for (let j = first * view.points; j < last * view.points; j++) d += `${j === first * view.points ? 'M' : 'L'}${(22 + ((j + 0.5) / view.points - first) / nBases * 304).toFixed(2)} ${(y + 69 - read.curves[base][j] / 100 * 44).toFixed(2)}`;
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linejoin="round"/>`;
  }
  return svg;
}
const trace = card(2, 'Trace Analysis', 'APOE · aligned control and clone',
  text(22, 115, 'R176C C>T', 15, '#d7baff', 700)
  + text(22, 137, 'Orange: silent changes · Purple: intended edit', 11, '#b6c9db')
  + chromatogram(view.control, 163, 'Wild-type control') + chromatogram(view.edited, 262, 'Homozygous example')
  + text(22, 370, 'AB1 + design HTML · pairing · analysis', 12, colors[2]));
const callColor = d => d === 'accept' ? '#71e5b1' : '#ffca85';
const resultsCard = card(3, 'Results', 'APOE · clone comparison',
  text(22, 116, 'INTENDED EDIT (HDR)', 11, '#aabed1', 600, 'letter-spacing="1.3"')
  + results.map((r, i) => {
    const pct = r.summary.intendedEditPct, y = 151 + i * 67;
    return text(22, y, ['Homozygous', 'Heterozygous', 'Edit + partial'][i], 14, '#eff6ff', 600)
      + text(326, y, `${pct}%`, 17, '#eff6ff', 700, 'text-anchor="end"')
      + rect(22, y + 12, 304, 7, '#2b3b50', 3) + rect(22, y + 12, 304 * pct / 100, 7, callColor(r.decision.decision), 3)
      + text(22, y + 37, r.decision.decision === 'accept' ? 'Accept · sequence candidate' : 'Hold · review genotype', 11, callColor(r.decision.decision));
  }).join('')
  + text(22, 351, 'Select clones · compare edits and support', 12, '#9eb4ca')
  + text(22, 377, 'Annotated figures · SVG / PDF / PNG', 12, colors[3]));
const annotated = cloneAlignedFigure(view, { name: names[0], decision: results[0].decision.decision, headline: results[0].genotype.summary, width: 1464 });
const annotatedHeight = Number(/height="([\d.]+)"/.exec(annotated)[1]);
fs.writeFileSync(output + 'assured-apoe-annotated.svg', cloneSelectionFigure(results));
const cards = [learn, design, trace, resultsCard];
function image(mobile = false) {
  const w = mobile ? 420 : 1600, h = mobile ? 1930 : 880 + annotatedHeight;
  const positions = mobile ? cards.map((_, i) => [36, 178 + i * 416]) : cards.map((_, i) => [68 + i * 372, 225]);
  let body = rect(0, 0, w, h, 'url(#bg)', 28)
    + `<path d="M0 ${mobile ? 125 : 170}H${w}" stroke="#284158" stroke-width="1"/>`
    + text(mobile ? 28 : 68, mobile ? 38 : 52, 'ASSURED / ACADEMY + BENCH', mobile ? 12 : 15, '#8eacc5', 600, 'letter-spacing="2"')
    + text(mobile ? 28 : 68, mobile ? 80 : 114, mobile ? 'Learn. Design.' : 'From understanding to evidence.', mobile ? 32 : 49, '#f4f8fc', 700, 'letter-spacing="-1.4"')
    + text(mobile ? 28 : 68, mobile ? 115 : 149, mobile ? 'Analyse. Decide.' : 'Learn the principles. Plan your edit. Read the evidence. Choose your next step.', mobile ? 32 : 20, mobile ? '#f4f8fc' : '#a8bdd1', mobile ? 700 : 400);
  if (!mobile) body += rect(1210, 77, 320, 38, '#143644', 19, '#276377') + text(1370, 102, 'APOE · SIMULATED PRACTICE DATA', 13, '#89e8d3', 700, 'text-anchor="middle" letter-spacing="0.3"');
  else body += text(28, 156, 'APOE · SIMULATED PRACTICE DATA', 11, '#89e8d3', 600, 'letter-spacing="1.2"');
  positions.forEach(([x, y], i) => {
    body += `<g transform="translate(${x},${y})">${cards[i]}</g>`;
    if (!mobile && i < 3) body += rect(x + 350, y + 175, 20, 36, '#0d1d30', 10) + text(x + 360, y + 199, '→', 20, '#83a7c5', 400, 'text-anchor="middle"');
  });
  if (!mobile) {
    body += text(68, 200, 'ACADEMY', 12, colors[0], 700, 'letter-spacing="2"') + text(440, 200, 'BENCH  /  DESIGN → ORDER → TRACE ANALYSIS → RESULTS', 12, '#a9c5dc', 600, 'letter-spacing="1.4"');
    body += text(68, 666, 'Trace Analysis → Results', 22, '#f0f7ff', 700)
      + text(68, 694, 'Annotated chromatogram: guides, cut sites, protein changes and the repaired allele.', 16, '#9eb4ca')
      + `<svg x="68" y="716" width="1464" height="${annotatedHeight}" viewBox="0 0 1464 ${annotatedHeight}">${annotated.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`
      + text(68, 716 + annotatedHeight + 34, 'Design HTML + JSON   /   AB1 + ZIP import   /   Clone comparisons   /   Figure + table exports', 17, '#9eb4ca')
      + text(68, 716 + annotatedHeight + 62, 'APOE R176C practice benchmark · simulated AB1 traces · analysis and annotations generated by ASSURED.', 13, '#8ca6bd');
  } else {
    body += text(28, 1871, 'Design reports · trace files · clone figures', 14, '#a9c5dc')
      + text(28, 1895, 'APOE practice data · simulated AB1 traces.', 12, '#8ca6bd')
      + text(28, 1915, 'App-generated results and annotations.', 12, '#8ca6bd');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc" font-family="Arial,Helvetica,sans-serif"><title id="title">ASSURED: from learning to genome-editing evidence</title><desc id="desc">Academy offers 12 lessons. Bench combines design, reagent planning, Sanger trace analysis and clone results. The APOE R176C practice benchmark uses simulated AB1 traces. Actual app-generated guide, edit and silent-blocking annotations are shown. ${results.map((r, i) => `${names[i]}: intended edit ${r.summary.intendedEditPct} percent, ${r.decision.decision}.`).join(' ')}</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0d2035"/><stop offset="1" stop-color="#091322"/></linearGradient></defs>${body}</svg>`;
}
fs.writeFileSync(output + 'assured-overview.svg', image());
fs.writeFileSync(output + 'assured-overview-mobile.svg', image(true));
fs.writeFileSync(output + 'assured-overview-data.json', JSON.stringify({
  description: 'APOE R176C simulated training benchmark. Results, recommendations and annotated chromatograms are generated by the same analysis and figure code as the app.',
  datasetType: 'simulated practice traces',
  generator: 'node scripts/build-overview-banner.mjs',
  designFile: '/studio/demo_traces/' + specFile,
  controlFile: '/studio/demo_traces/' + controlFile,
  traceExcerpt: { firstAlignedColumn: first, lastAlignedColumnExclusive: last, pointsPerBase: view.points, alignment: view.mode, description: 'App-normalised, base-aligned curves from the same view as the app annotated figures.' },
  markers: spec.markers,
  guides: spec.guides,
  results: results.map((r, i) => ({ name: r.name, traceFile: '/studio/demo_traces/' + samples[i], summary: r.summary, markers: r.markers, decision: r.decision, recommendation: r.recommendation, quality: r.quality, genotype: r.genotype })),
}, null, 2) + '\n');
console.log('Built APOE overview from app analysis:', results.map(r => `${r.name}: ${r.summary.intendedEditPct}% intended edit / ${r.decision.decision}`).join('; '));
console.log('Desktop banner dimensions:', 1600, 880 + annotatedHeight);
