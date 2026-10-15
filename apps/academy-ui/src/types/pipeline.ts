export type PipelineStage = 1 | 2 | 3 | 4 | 5;

export interface GuideRNA {
  id: string;
  name: string;
  sequence: string; // 20 nt
  pam: string;      // e.g. 'CGG', 'TGG', 'AGG'
  strand: '+' | '-';
  cutDistanceToEdit: number; // |cut position - edit position| in bp, from the design geometry
  /** 0-100. Only set by the free-form teaching heuristic; the Design engine does not compute it, so presets leave it unset. */
  efficiencyScore?: number;
  /** 0-100. Heuristic only; genome-wide specificity is not assessed by any shipped preset. */
  offTargetScore?: number;
  isSelected: boolean;
}

export interface DonorTemplate {
  name: string;
  strand: '+' | '-';
  totalLength: number;
  /** Arm lengths in the reading direction of the ordered oligo (5' arm first). */
  arm5Length: number;
  arm3Length: number;
  /** ASSURED rule: 36 nt on the PAM-distal side of the cut and 91 nt on the PAM-proximal side, template = non-PAM strand. */
  pamDistalArm?: number;
  pamProximalArm?: number;
  /** Plain sequence as ordered. The paper specifies an "Alt-R HDR modified ssODN" but not its chemistry, so no end modifications are drawn. */
  sequence: string;
  intendedEditDescription: string;
  /** Silent or other blocking changes the donor carries so the edited allele is not re-cut. */
  blockingChanges: string;
  forGuide?: string;
}

export interface PrimerPair {
  /** tm is only set where it was computed; the Design hand-off does not carry it. */
  forwardPrimer: { name: string; sequence: string; tm?: number; length: number };
  reversePrimer: { name: string; sequence: string; tm?: number; length: number };
  ampliconSizeBp: number;
  /** Not specified by the design hand-off, so presets leave it unset. */
  sequencingPrimer?: { name: string; sequence: string; direction: 'Forward' | 'Reverse' };
}

export interface TargetLocus {
  id: string;
  gene: string;
  diseaseName: string;
  species: string;
  assembly: string;
  chromosome: string;
  genomicCoordinate: string;
  refAllele: string;
  altAllele: string;
  aminoAcidChange: string;
  targetSequence5to3: string;
  complementSequence3to5: string;
  guides: GuideRNA[];
  /** First donor, kept for components that show a single donor; `donors` holds all of them. */
  donor: DonorTemplate;
  donors?: DonorTemplate[];
  /** Unset when the primers for a real run were not recorded. */
  primers?: PrimerPair;
  /** Caveats shown with the target (provenance, known limits). */
  notes?: string[];
  /** Index in the 100-nt target window of the edited base (knock-in) or the inferred cut (knockout). */
  windowCentreIndex?: number;
  /** Index in the control Sanger read of the edited base (knock-in) or the inferred cut (knockout); the trace viewer centres on it. */
  traceViewCentre?: number;
  targetType?: 'SNP_KNOCKIN' | 'KNOCKOUT';
  controlAb1Url?: string;
  batchCsvUrl?: string;
}

/** Table 7 of the ASSURED protocol (Ludwik et al., STAR Protocols 2023): RNP mixes for 1 or 2 gRNAs, KO or KI. */
export type RnpCondition = '1gRNA-KO' | '2gRNA-KO' | '1gRNA-KI' | '2gRNA-KI';

/** The paper describes the isoCell platform and names limiting dilution and clone picking as alternatives. */
export type CloningMethod = 'isocell' | 'limiting-dilution' | 'clone-picking';

export interface BenchProtocolState {
  /** Neon 10 uL-tip reactions to prepare. */
  reactions: number;
  /** Unset when the guide count of a real run was not recorded. */
  condition?: RnpCondition;
  cloningMethod: CloningMethod;
  isBenchCompleted: boolean;
  /** 'protocol-defaults' for presets (nothing was recorded from a real bench); 'user-entered' once a learner completes Stage 3. */
  valuesSource: 'protocol-defaults' | 'user-entered';
}

/**
 * Coarse class of a clone. Each Assured QC call (apps/qc/src/genotype.js) maps to exactly one of these in
 * apps/academy-core/tools/build-ui-data.mjs (CALL_TO_STATUS); the four original values are kept for the CSV upload path.
 */
export type CloneStatus =
  | 'HOMOZYGOUS_KI'        // homozygous_edit
  | 'HETEROZYGOUS_KI'      // heterozygous_edit
  | 'INDEL_KO'             // homozygous_indel
  | 'WT_ESCAPEE'           // homozygous_wt
  | 'PARTIAL_CONVERSION'   // homozygous_partial, two_partials: blocking changes without the intended edit
  | 'EDIT_PLUS_OTHER'      // edit_plus_partial, edit_plus_indel, homozygous_edit_indel
  | 'HETEROZYGOUS_INDEL'   // heterozygous_indel
  | 'COMPOUND_HET'         // compound_heterozygous
  | 'MIXED';               // mixed, unclear

/** Where a clone's numbers come from, so the UI never presents a column read from a file as an engine call. */
export type CallSource = 'assured-qc-engine' | 'csv-upload';

export interface LabCall {
  clone: string;
  recommendation: string;
  detail: string;
  /** Explicit rule in apps/academy-core/tools/compare_real_traces.py: agrees, differs, or the lab pipeline gave no call. */
  agreement: 'agrees' | 'differs' | 'lab had no call';
}

export interface QCCloneResult {
  cloneId: string;
  wellId: string;
  status: CloneStatus;
  statusLabel: string;
  /** Intended-edit fraction (engine: intended_edit_pct; CSV path: the file's hdr column). */
  hdrPercentage: number;
  indelPercentage: number;
  wtPercentage: number;
  /** Blocking changes without the intended edit. Unset when the source cannot tell (CSV upload). */
  blockingOnlyPercentage?: number;
  callSource: CallSource;
  engineCall?: string;
  engineDecision?: 'accept' | 'hold' | 're-sequence' | 'reject' | string;
  engineConfidence?: string;
  engineNotes?: string;
  /** The lab's own pipeline output for the same trace, matched by sha256, where one exists. */
  labCall?: LabCall;
  isRecommendedForExpansion: boolean;
  ab1TraceUrl?: string;
  r2ModelFit?: number;
}

export interface PublicationFigureConfig {
  showPanelA: boolean; // Genomic & guide schematic
  showPanelB: boolean; // Sanger chromatogram alignment
  showPanelC: boolean; // Editing efficiency & zygosity chart
  showPanelD: boolean; // Summary clone table
  figureTitle: string;
  figureWidth: 'single-column' | 'double-column'; // 85 mm vs 178 mm
}

export interface AssuredProject {
  id: string;
  title: string;
  createdAt: string;
  currentStage: PipelineStage;
  target: TargetLocus;
  bench: BenchProtocolState;
  clones: QCCloneResult[];
  figureConfig: PublicationFigureConfig;
  /** Where each part of the project comes from (real run, reconstruction, engine design, defaults). */
  provenance?: string[];
  /** Offline checks of the design against GRCh38 (see apps/academy-core/data/verification_grch38.csv). */
  verification?: DesignVerification;
}

export interface DesignVerification {
  assembly: string;
  total: number;
  passed: number;
  failed: string[];
  note: string;
}
