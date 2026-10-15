// Rebuild the landing artwork from the bundled MYD88 design and measured AB1 channels.
// Run: node scripts/build-overview-banner.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseAbif } from '../apps/qc/src/abif.js';
import { analyseSample } from '../apps/qc/src/batch.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const dataDir = `${root}apps/studio/public/drive_data/`;
const output = `${root}public/assets/`;
fs.mkdirSync(output, { recursive: true });
const specFile = 'spec_BIHi005-A_wt_1172_EF74668951.ab1.json';
const spec = JSON.parse(fs.readFileSync(dataDir + specFile));
const controlFile = 'BIHi005-A_wt_1172_EF74668951.ab1';
const samples = ['cl1_MYD88_KO_1172_EF74878421.ab1', 'cl3_MYD88_KO_1172_EF74878423.ab1', 'cl4_MYD88_KO_1172_EF74878424.ab1'];
const load = name => parseAbif(fs.readFileSync(`${dataDir}myd88/${name}`), name);
const control = load(controlFile);
const traces = samples.map(load);
const results = traces.map((edited, i) => {
  const r = analyseSample({ name: samples[i], spec, control, edited, sampleType: 'clone' });
  if (!r.ok) throw new Error(`${r.name}: ${r.error}`);
  return r;
});
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
const design = card(1, 'Design', 'ASSURED Bench · MYD88',
  text(22, 119, 'Two guides. One planned deletion.', 15, '#edf8ff', 600)
  + rect(22, 142, 304, 69, '#0b1b2d', 10)
  + line(39, 177, 308, 177, '#57718a', 'stroke-width="3"')
  + rect(73, 164, 59, 25, '#245d78', 4) + rect(218, 164, 63, 25, '#245d78', 4)
  + line(94, 151, 94, 200, colors[1], 'stroke-width="2" stroke-dasharray="4 3"')
  + line(260, 151, 260, 200, colors[1], 'stroke-width="2" stroke-dasharray="4 3"')
  + text(177, 159, `${guides[1].cut - guides[0].cut} bp`, 12, '#e6f9ff', 700, 'text-anchor="middle"')
  + guides.map((g, i) => text(22, 242 + i * 54, `gRNA ${i + 1}  ${g.strand === '-' ? 'reverse' : 'forward'} strand`, 12, colors[1], 600)
    + text(22, 263 + i * 54, g.spacer, 16, '#eaf3ff', 400, mono)).join('')
  + text(22, 370, 'Guide selection · reagent planning', 13, colors[1]));
// Original processed AB1 channels, bases 75–109. Each excerpt is scaled to its own maximum.
function chromatogram(trace, y, label) {
  const start = trace.peakLocations[75], end = trace.peakLocations[110];
  const max = Math.max(...Object.values(trace.channels).flatMap(a => Array.from(a.slice(start, end))));
  let svg = text(22, y, label, 13, '#dbe6f5', 600) + line(22, y + 77, 326, y + 77);
  for (const [base, color] of Object.entries({ A: '#65dfa4', C: '#6cbcff', G: '#c7d1df', T: '#ff7e91' })) {
    let d = '';
    for (let j = start; j < end; j++) d += `${j === start ? 'M' : 'L'}${(22 + (j - start) / (end - start) * 304).toFixed(2)} ${(y + 76 - trace.channels[base][j] / max * 56).toFixed(2)}`;
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.3" stroke-linejoin="round"/>`;
  }
  return svg;
}
const trace = card(2, 'Analyse', 'Measured Sanger signal · MYD88',
  chromatogram(control, 121, 'Parental control') + chromatogram(traces[0], 237, 'Clone 1')
  + text(22, 341, 'A', 12, '#65dfa4', 700) + text(46, 341, 'C', 12, '#6cbcff', 700) + text(70, 341, 'G', 12, '#c7d1df', 700) + text(94, 341, 'T', 12, '#ff7e91', 700)
  + text(22, 370, 'AB1 upload · pairing · deconvolution', 13, colors[2]));
const dominant = r => r.contributions.reduce((a, b) => a.fraction > b.fraction ? a : b);
const resultsCard = card(3, 'Review', 'Results · MYD88 clone comparison',
  text(22, 116, 'DOMINANT DELETION MODEL', 11, '#aabed1', 600, 'letter-spacing="1.3"')
  + results.map((r, i) => {
    const c = dominant(r), y = 151 + i * 63;
    return text(22, y, `Clone ${[1, 3, 4][i]}`, 15, '#eff6ff', 600)
      + text(133, y, `${c.size} bp`, 16, colors[3], 600, mono)
      + text(326, y, `${(c.fraction * 100).toFixed(1)}%`, 16, '#eff6ff', 600, 'text-anchor="end"')
      + rect(22, y + 12, 304, 7, '#2b3b50', 3) + rect(22, y + 12, 304 * c.fraction, 7, colors[3], 3);
  }).join('')
  + text(22, 331, 'Estimated allele share · one read / clone', 12, '#9eb4ca')
  + text(22, 350, 'Sequence evidence; confirm function separately.', 11, '#9eb4ca')
  + text(22, 377, 'Clone figures · SVG / PDF / 300-dpi PNG', 12, colors[3]));
const cards = [learn, design, trace, resultsCard];
function image(mobile = false) {
  const w = mobile ? 420 : 1600, h = mobile ? 1930 : 790;
  const positions = mobile ? cards.map((_, i) => [36, 178 + i * 416]) : cards.map((_, i) => [68 + i * 372, 225]);
  let body = rect(0, 0, w, h, 'url(#bg)', 28)
    + `<path d="M0 ${mobile ? 125 : 170}H${w}" stroke="#284158" stroke-width="1"/>`
    + text(mobile ? 28 : 68, mobile ? 38 : 52, 'ASSURED / ACADEMY + BENCH', mobile ? 12 : 15, '#8eacc5', 600, 'letter-spacing="2"')
    + text(mobile ? 28 : 68, mobile ? 80 : 114, mobile ? 'Learn. Design.' : 'From understanding to evidence.', mobile ? 32 : 49, '#f4f8fc', 700, 'letter-spacing="-1.4"')
    + text(mobile ? 28 : 68, mobile ? 115 : 149, mobile ? 'Analyse. Decide.' : 'Learn the principles. Plan your edit. Read the evidence. Choose your next step.', mobile ? 32 : 20, mobile ? '#f4f8fc' : '#a8bdd1', mobile ? 700 : 400);
  if (!mobile) body += rect(1210, 77, 320, 38, '#143644', 19, '#276377') + text(1370, 102, 'REAL DATA · MYD88 EXAMPLE', 13, '#89e8d3', 700, 'text-anchor="middle" letter-spacing="1"');
  else body += text(28, 156, 'REAL DATA · MYD88 EXAMPLE', 12, '#89e8d3', 600, 'letter-spacing="1.2"');
  positions.forEach(([x, y], i) => {
    body += `<g transform="translate(${x},${y})">${cards[i]}</g>`;
    if (!mobile && i < 3) body += rect(x + 350, y + 175, 20, 36, '#0d1d30', 10) + text(x + 360, y + 199, '→', 20, '#83a7c5', 400, 'text-anchor="middle"');
  });
  if (!mobile) {
    body += text(68, 200, 'ACADEMY', 12, colors[0], 700, 'letter-spacing="2"') + text(440, 200, 'BENCH  /  DESIGN → ORDER → TRACE ANALYSIS → RESULTS', 12, '#a9c5dc', 600, 'letter-spacing="1.4"');
    body += line(68, 659, 1532, 659) + text(68, 697, 'A connected workspace. Portable evidence.', 24, '#f0f7ff', 600)
      + text(68, 728, 'Design HTML + JSON   /   AB1 + ZIP import   /   Clone comparisons   /   Figure + table exports', 17, '#9eb4ca')
      + text(68, 766, 'Example: bundled MYD88 design and AB1 files. Bars show fitted dominant-allele shares, not confirmed functional knockout.', 13, '#8ca6bd');
  } else {
    body += text(28, 1871, 'Design reports · trace files · clone figures', 14, '#a9c5dc')
      + text(28, 1895, 'Bundled MYD88 AB1 data; fitted allele shares.', 12, '#8ca6bd')
      + text(28, 1915, 'Sequence evidence does not confirm function.', 12, '#8ca6bd');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc" font-family="Arial,Helvetica,sans-serif"><title id="title">ASSURED: from learning to genome-editing evidence</title><desc id="desc">Academy offers 12 lessons. Bench combines design, reagent planning, Sanger trace analysis and clone results. Actual bundled MYD88 guide sequences and AB1 channels are shown. ${results.map((r, i) => `Clone ${[1, 3, 4][i]}: dominant ${dominant(r).size} bp deletion, ${(dominant(r).fraction * 100).toFixed(1)} percent fitted allele share.`).join(' ')}</desc><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#0d2035"/><stop offset="1" stop-color="#091322"/></linearGradient></defs>${body}</svg>`;
}
fs.writeFileSync(output + 'assured-overview.svg', image());
fs.writeFileSync(output + 'assured-overview-mobile.svg', image(true));
fs.writeFileSync(output + 'assured-overview-data.json', JSON.stringify({
  description: 'Landing banner source data. Original processed AB1 channels are shown, not synthetic chromatograms. Fitted allele shares are sequence-level estimates.',
  generator: 'node scripts/build-overview-banner.mjs',
  designFile: '/studio/drive_data/' + specFile,
  controlFile: '/studio/drive_data/myd88/' + controlFile,
  traceExcerpt: { firstBaseIndex: 75, lastBaseIndexExclusive: 110, scaling: 'Each read scaled independently to its maximum processed-channel intensity.' },
  guides: spec.guides,
  results: results.map(r => ({ name: r.name, traceFile: '/studio/drive_data/myd88/' + r.name, dominantAllele: dominant(r), summary: r.summary, quality: r.quality, genotype: r.genotype })),
}, null, 2) + '\n');
console.log('Built overview artwork from MYD88 AB1 analysis:', results.map(r => `${r.name}: ${dominant(r).size} bp / ${(dominant(r).fraction * 100).toFixed(1)}%`).join('; '));
