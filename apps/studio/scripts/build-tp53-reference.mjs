// Rebuild the pinned, gene-oriented TP53 reference without alternative isoforms.
// The RefSeqGene annotation identifies variant 1 as NM_000546.5 / NP_000537.3.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=NG_017013.2&rettype=gbwithparts&retmode=text';
const raw = process.argv[2] ? await fs.readFile(process.argv[2], 'utf8') : await (await fetch(url)).text();
if (!raw.includes('VERSION     NG_017013.2') || !raw.includes('ORIGIN')) throw new Error('Unexpected NCBI record');
const featureStart = raw.indexOf('FEATURES');
const originStart = raw.indexOf('ORIGIN');
const blocks = raw.slice(featureStart, originStart).split(/(?=^ {5}\S)/m).slice(1);
const mrna = blocks.find(b => b.startsWith('     mRNA ') && b.includes('/transcript_id="NM_000546.5"'));
const cds = blocks.find(b => b.startsWith('     CDS ') && b.includes('/protein_id="NP_000537.3"'));
if (!mrna || !cds) throw new Error('Pinned TP53 isoform missing');
const location = mrna.split(/\n {21}\//)[0];
const exonRanges = new Set([...location.matchAll(/(\d+)\.\.(\d+)/g)].map(m => `${m[1]}..${m[2]}`));
const selected = blocks.filter(b => b.startsWith('     source ') ||
  (b.startsWith('     gene ') && b.includes('/gene="TP53"')) || b === mrna || b === cds ||
  (b.startsWith('     exon ') && exonRanges.has(b.trim().split(/\s+/)[1])));
const output = raw.slice(0, featureStart) +
  'COMMENT     Studio reference: TP53 variant 1 only; other isoforms and\n' +
  '            neighbouring features removed. Sequence and coordinates unchanged.\n' +
  'FEATURES             Location/Qualifiers\n' + selected.join('') + raw.slice(originStart);
await fs.writeFile(new URL('../public/references/tp53-NG_017013.2.gb', import.meta.url), output);
await fs.writeFile(new URL('../public/references/tp53-provenance.json', import.meta.url), JSON.stringify({
  sourceUrl: url, accession: 'NG_017013.2', transcriptId: 'NM_000546.5', proteinId: 'NP_000537.3',
  retrievedAt: new Date().toISOString(), originalSha256: createHash('sha256').update(raw).digest('hex'),
  derivedSha256: createHash('sha256').update(output).digest('hex'),
  transformation: 'Keep source, TP53 gene, variant 1 mRNA/CDS and matching exons; retain original sequence and coordinates.'
}, null, 2) + '\n');
