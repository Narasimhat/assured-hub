import { AssuredProject, CloningMethod, QCCloneResult } from '../types/pipeline';
import { NEON_CONDITIONS, RNP_TABLE, RNP_TOTAL_UL } from '../data/benchDefaults';
import { QC_ENGINE_VERSION } from '../data/generated/presets.generated';

export const PAPER_CITATION =
  'Ludwik KA, Telugu N, Schommer S, Stachelscheid H, Diecke S. ASSURED-optimized CRISPR protocol for knockout/SNP knockin in hiPSCs. STAR Protocols. 2023. doi:10.1016/j.xpro.2023.102406';
export const PAPER_DOI_URL = 'https://doi.org/10.1016/j.xpro.2023.102406';

const CLONING_TEXT: Record<CloningMethod, string> = {
  isocell: 'the isoCell single-cell cloning platform',
  'limiting-dilution': 'limiting dilution',
  'clone-picking': 'clone picking',
};

const isKnockoutProject = (p: AssuredProject) => p.target.targetType === 'KNOCKOUT' || !p.target.donor?.sequence;

/** "3 x homozygous for the intended edit; 1 x mixed ..." from the clone labels exactly as the source produced them. */
export const summariseClones = (clones: QCCloneResult[]): string => {
  const counts = new Map<string, number>();
  clones.forEach((c) => counts.set(c.statusLabel, (counts.get(c.statusLabel) || 0) + 1));
  return [...counts.entries()].map(([label, n]) => `${n} \u00d7 ${label.charAt(0).toLowerCase()}${label.slice(1)}`).join('; ');
};

export const DRAFT_NOTICE =
  'DRAFT generated from the choices and results in this workbench project. It is not a record of what was done at the bench: check every statement against your own records and fill the [bracketed] fields before any use.';

export function buildMethodsDraft(project: AssuredProject): string {
  const t = project.target;
  const b = project.bench;
  const ko = isKnockoutProject(project);
  const donors = t.donors && t.donors.length > 0 ? t.donors : t.donor && t.donor.sequence ? [t.donor] : [];
  const out: string[] = [DRAFT_NOTICE, ''];

  out.push(`Genome editing of ${t.gene} (${ko ? 'knockout' : t.aminoAcidChange}) in [cell line] hiPSCs followed the ASSURED protocol (Ludwik et al., 2023).`);

  out.push(
    t.guides.length > 0
      ? `Guide RNAs: ${t.guides.map((g) => `${g.name} ${g.sequence} (PAM ${g.pam}, ${g.strand} strand${ko ? '' : `, cut ${g.cutDistanceToEdit} bp from the edit`})`).join('; ')}.`
      : 'Guide RNAs: [not recorded for this project].'
  );

  if (!ko) {
    out.push(
      donors.length > 0
        ? `Donor${donors.length > 1 ? 's' : ''}: ${donors
            .map((d) => `${d.name}, ${d.totalLength} nt, ${d.pamDistalArm ?? '?'} nt PAM-distal and ${d.pamProximalArm ?? '?'} nt PAM-proximal homology arm, non-PAM strand as template, carrying ${d.blockingChanges === 'none' ? 'no blocking changes' : `blocking changes ${d.blockingChanges}`}`)
            .join('; ')}.`
        : 'Donor: [not recorded for this project].'
    );
  }

  out.push(
    t.primers
      ? `Target region PCR primers: ${t.primers.forwardPrimer.name} ${t.primers.forwardPrimer.sequence} and ${t.primers.reversePrimer.name} ${t.primers.reversePrimer.sequence} (${t.primers.ampliconSizeBp} bp amplicon).`
      : 'Target region PCR primers: [not recorded for this project].'
  );

  if (b.isBenchCompleted && b.valuesSource === 'user-entered' && b.condition) {
    const m = RNP_TABLE[b.condition];
    const parts = [`Cas9 ${m.cas9} \u00b5L`, `gRNA 1 ${m.gRNA1} \u00b5L`, ...(m.gRNA2 !== null ? [`gRNA 2 ${m.gRNA2} \u00b5L`] : []), ...(m.ssodn !== null ? [`Alt-R HDR modified ssODN ${m.ssodn} \u00b5L (12.5 \u00b5M)`] : []), `R buffer ${m.rBuffer} \u00b5L`];
    out.push(
      `RNP mixes followed Table 7 of the protocol for ${m.label} (${parts.join(', ')}; ${RNP_TOTAL_UL} \u00b5L total) and cells were electroporated with the Neon system, ${NEON_CONDITIONS.tip} tip, ${NEON_CONDITIONS.voltage}, ${NEON_CONDITIONS.pulseWidth}, ${NEON_CONDITIONS.pulses} pulse. [Confirm that this is what you did.]`
    );
    out.push(`Single-cell clones were isolated by ${CLONING_TEXT[b.cloningMethod]}.`);
  } else {
    out.push('[Delivery and cloning: not recorded. Complete Stage 3 yourself to fill these in; the preset values are protocol defaults, not recorded values.]');
  }

  if (project.clones.length > 0) {
    const sources = new Set(project.clones.map((c) => c.callSource));
    const how = sources.has('assured-qc-engine') && !sources.has('csv-upload')
      ? `Sanger traces were analysed against the unedited control with Assured QC ${QC_ENGINE_VERSION}`
      : sources.has('csv-upload') && !sources.has('assured-qc-engine')
        ? 'Clone percentages were read from a results file uploaded to the workbench [name the software that produced it]'
        : 'Clone calls come from more than one source [state each]';
    out.push(`${how}. ${project.clones.length} clones were analysed: ${summariseClones(project.clones)}.`);
  } else {
    out.push('Clone analysis: [no clone data in this project].');
  }

  out.push('', `Reference: ${PAPER_CITATION}`);
  return out.join('\n');
}

export function buildLegendDraft(project: AssuredProject): string {
  const t = project.target;
  const ko = isKnockoutProject(project);
  const shown = project.clones.slice(0, 8).length;
  return [
    DRAFT_NOTICE,
    '',
    `Figure 1. ${t.gene}: design and Sanger QC of single-cell clones.`,
    `(A) The 100-nt window around the ${ko ? 'inferred cut' : 'edited base'} in ${t.gene}${t.guides.length ? `, with ${t.guides.map((g) => g.name).join(', ')} and their cut sites` : ''}.`,
    '(B) [Sanger traces: take the alignment and trace panels from the Assured QC report.]',
    project.clones.length > 0
      ? `(C) Allele composition of ${shown}${project.clones.length > shown ? ` of ${project.clones.length}` : ''} clones as reported by the analysis software (intended edit, blocking changes without the edit, indels, wild type; the remainder is unexplained signal).`
      : '(C) [No clone data in this project.]',
    project.clones.length > 0 ? '(D) Per-clone call, decision and fit (R2); "n/a" where the source reports no fit.' : '(D) [No clone data in this project.]',
  ].join('\n');
}
