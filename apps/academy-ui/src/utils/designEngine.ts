// Teaching sketch of the ASSURED design rules.
//
// This is NOT the Assured CRISPR Design engine and does not replace it. It scans one pasted window for NGG sites on both
// strands, ranks guides by cut-to-edit distance (with GC and poly-T filters), and lays out one 127-nt ssODN per guide with the
// paper's asymmetry (36 nt on the PAM-distal side of the cut, 91 nt on the PAM-proximal side, non-PAM strand as template).
// It does not check specificity, reading frame, SNPs in the guide or primer sites, or primer quality, and it never designs a
// blocking change: choosing one needs a codon table for your gene (Ludwik et al., 2023, steps 23-24).
// For a real design use https://assured-crispr-design.vercel.app.

import type { TargetLocus, GuideRNA, DonorTemplate } from '../types/pipeline';

const COMPLEMENT_MAP: { [k: string]: string } = { A: 'T', T: 'A', C: 'G', G: 'C', N: 'N' };

export const getComplement = (seq: string): string => seq.split('').map((b) => COMPLEMENT_MAP[b] || 'N').join('');
export const getReverseComplement = (seq: string): string => getComplement(seq).split('').reverse().join('');

export const GUIDE_LENGTH = 20;
export const ARM_PAM_DISTAL = 36;
export const ARM_PAM_PROXIMAL = 91;
export const DONOR_LENGTH = ARM_PAM_DISTAL + ARM_PAM_PROXIMAL;

export interface DesignRequest {
  gene: string;
  diseaseName: string;
  sequence: string; // window, 5'->3' on the strand you paste
  mode: 'SNP_KNOCKIN' | 'KNOCKOUT';
  editPosition: number; // 0-based index in the cleaned sequence (the target base, or the position to cut near for a knockout)
  altBase?: string;
  refBase?: string;
  description?: string;
}

interface Candidate {
  spacer: string;
  pam: string;
  strand: '+' | '-';
  cut: number; // boundary index on the pasted strand (the cut falls between cut-1 and cut)
  distance: number;
  rank: number; // lower is better; used only to order candidates
}

const gcFraction = (s: string) => (s.match(/[GC]/g) || []).length / s.length;

export function runTeachingDesign(req: DesignRequest): TargetLocus {
  const seq = req.sequence.toUpperCase().replace(/[^ACGT]/g, '');
  if (seq.length < 50) throw new Error('The window must be at least 50 nucleotides of A, C, G and T.');
  if (!Number.isInteger(req.editPosition) || req.editPosition < 0 || req.editPosition >= seq.length) {
    throw new Error(`The edit position must be between 0 and ${seq.length - 1}.`);
  }
  const editPos = req.editPosition;
  const refBase = seq[editPos];
  if (req.refBase && req.refBase.toUpperCase() !== refBase) {
    throw new Error(`The base at position ${editPos} is ${refBase}, not ${req.refBase.toUpperCase()}.`);
  }
  const altBase = (req.altBase || '').toUpperCase();
  if (req.mode === 'SNP_KNOCKIN' && !/^[ACGT]$/.test(altBase)) throw new Error('Choose the new base (A, C, G or T) for a knock-in.');
  if (req.mode === 'SNP_KNOCKIN' && altBase === refBase) throw new Error('The new base equals the reference base.');

  const candidates: Candidate[] = [];
  const push = (spacer: string, pam: string, strand: '+' | '-', cut: number) => {
    const distance = Math.abs(cut - editPos);
    const gc = gcFraction(spacer);
    candidates.push({ spacer, pam, strand, cut, distance, rank: distance + (gc < 0.4 || gc > 0.65 ? 8 : 0) + (spacer.includes('TTTT') ? 20 : 0) });
  };
  // + strand: [20-nt spacer][N G G]; the cut is 3 bp 5' of the PAM.
  for (let i = GUIDE_LENGTH; i + 3 <= seq.length; i += 1) {
    if (seq[i + 1] === 'G' && seq[i + 2] === 'G') push(seq.slice(i - GUIDE_LENGTH, i), seq.slice(i, i + 3), '+', i - 3);
  }
  // - strand: on the pasted strand the PAM reads [C C N] followed by the reverse complement of the spacer.
  for (let j = 0; j + 3 + GUIDE_LENGTH <= seq.length; j += 1) {
    if (seq[j] === 'C' && seq[j + 1] === 'C') push(getReverseComplement(seq.slice(j + 3, j + 3 + GUIDE_LENGTH)), getReverseComplement(seq.slice(j, j + 3)), '-', j + 6);
  }
  if (candidates.length === 0) throw new Error('No NGG PAM site was found in this window.');
  candidates.sort((a, b) => a.rank - b.rank || a.cut - b.cut);

  const first = candidates[0];
  const second = candidates.find((c) => c !== first && (c.strand !== first.strand || Math.abs(c.cut - first.cut) > 8));
  const chosen = second ? [first, second] : [first];
  const notes: string[] = [
    'Teaching sketch: guides are ranked by cut-to-edit distance with GC and poly-T filters only. No efficiency or off-target score is computed, and no genome-wide specificity check is done.',
    'Primers are not designed here. The protocol recommends at least two primer pairs, designed on the genomic region with Primer-BLAST, and Sanger-sequencing your own line first to rule out SNPs.',
  ];
  if (!second) notes.push('Only one NGG site was found. The lab convention is two guides, so add a second guide from a wider window.');

  const guides: GuideRNA[] = chosen.map((c, i) => ({
    id: `g${i + 1}-${req.gene.toLowerCase()}`,
    name: `${req.gene}_gRNA_${i + 1}`,
    sequence: c.spacer,
    pam: c.pam,
    strand: c.strand,
    cutDistanceToEdit: c.distance,
    isSelected: true,
  }));

  const donors: DonorTemplate[] = [];
  if (req.mode === 'SNP_KNOCKIN') {
    chosen.forEach((c, i) => {
      // Span of the donor on the pasted strand: 36 nt on the PAM-distal side of the cut, 91 nt on the PAM-proximal side.
      const start = c.strand === '+' ? c.cut - ARM_PAM_DISTAL : c.cut - ARM_PAM_PROXIMAL;
      const end = c.strand === '+' ? c.cut + ARM_PAM_PROXIMAL : c.cut + ARM_PAM_DISTAL;
      if (start < 0 || end > seq.length) {
        notes.push(`${guides[i].name}: no donor, because the ${DONOR_LENGTH}-nt span needs ${Math.max(0, -start)} more nt upstream and ${Math.max(0, end - seq.length)} more downstream in the window.`);
        return;
      }
      if (editPos < start || editPos >= end) {
        notes.push(`${guides[i].name}: no donor, because the edit lies outside the ${DONOR_LENGTH}-nt span around its cut.`);
        return;
      }
      const sense = seq.slice(start, editPos) + altBase + seq.slice(editPos + 1, end);
      // PAM position relative to the edit, to say whether the edit itself disrupts the PAM's GG (+ strand) or CC (- strand).
      const ggPositions = c.strand === '+' ? [c.cut + 4, c.cut + 5] : [c.cut - 6, c.cut - 5];
      const breaksPam = ggPositions.includes(editPos) && altBase !== (c.strand === '+' ? 'G' : 'C');
      const ordered = c.strand === '+' ? getReverseComplement(sense) : sense; // non-PAM strand as template
      donors.push({
        name: `${req.gene}_ssODN_${i + 1}`,
        forGuide: guides[i].name,
        strand: c.strand === '+' ? '-' : '+',
        totalLength: ordered.length,
        arm5Length: ARM_PAM_PROXIMAL,
        arm3Length: ARM_PAM_DISTAL,
        pamDistalArm: ARM_PAM_DISTAL,
        pamProximalArm: ARM_PAM_PROXIMAL,
        sequence: ordered,
        intendedEditDescription: `${refBase}>${altBase} at window position ${editPos}`,
        blockingChanges: breaksPam
          ? "none needed: the edit itself disrupts this guide's PAM"
          : 'not designed here: choose a silent change that disrupts the PAM GG or the last five seed bases, using a codon table for your gene (protocol steps 23 and 24)',
      });
    });
  }

  return {
    id: `proj-${req.gene.toLowerCase()}-${Date.now()}`,
    gene: req.gene,
    diseaseName: req.diseaseName,
    species: 'Homo sapiens',
    assembly: 'not specified (pasted sequence)',
    chromosome: 'not specified',
    genomicCoordinate: 'pasted window',
    refAllele: refBase,
    altAllele: req.mode === 'SNP_KNOCKIN' ? altBase : 'indel',
    aminoAcidChange: req.description || (req.mode === 'SNP_KNOCKIN' ? `${refBase}>${altBase}` : 'knockout'),
    targetSequence5to3: seq,
    complementSequence3to5: getComplement(seq),
    guides,
    donor: donors[0] || { name: 'none', strand: '+', totalLength: 0, arm5Length: 0, arm3Length: 0, sequence: '', intendedEditDescription: req.mode === 'KNOCKOUT' ? 'frameshift indel' : 'no donor could be laid out', blockingChanges: 'not applicable' },
    donors,
    notes,
    windowCentreIndex: editPos,
    targetType: req.mode,
  };
}
