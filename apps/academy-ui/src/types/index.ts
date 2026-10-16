export type WorkspaceMode = 'guided' | 'pro';
export type TabType = 'workbench' | 'academy' | 'simulator' | 'frugal' | 'missions' | 'suite' | 'studio';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  content: string[];
  keyTakeaway: string;
  benchTip: string;
  interactiveType?: 'diagram' | 'p53-pathway' | 'pam-picker' | 'asymmetry-demo' | 'trace-demo';
  quiz?: QuizQuestion[];
}

export interface CurriculumTrack {
  id: string;
  trackNumber: number;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  badgeName: string;
  lessons: Lesson[];
  targetPersona?: LearnerPersonaId;
}

export type LearnerPersonaId = 
  | 'layperson'
  | 'student'
  | 'technician'
  | 'scientist'
  | 'core_facility'
  | 'cgt_industry';

export interface PersonaMetadata {
  id: LearnerPersonaId;
  tier: number;
  title: string;
  subtitle: string;
  tagline: string;
  badge: string;
  targetAudience: string;
  coreObjective: string;
  iconName: string;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    gradient: string;
  };
  keyCompetencies: string[];
  simulatorTitle: string;
  simulatorDescription: string;
}

export interface VirtualLabState {
  stage: 1 | 2 | 3 | 4;
  confluency: number; // 25 - 90%; the protocol passages from a well at about 50%
  morphologyGood: boolean;
  /** 'protocol' = Neon 10 uL tip, 1200 V, 30 ms, 1 pulse (the paper); 'other' = any other setting, whose outcome this game does not predict. */
  electroporationProgram: 'protocol' | 'other';
  /** StemFlex/CloneR2 for recovery and cloning, as in the protocol. */
  usedCloneR2: boolean;
  cloningMethod: 'limiting-dilution' | 'single-cell-dispenser';
  selectedWells: string[];
  homozygousCloneFound: boolean;
  feedback: string[];
  hasRunElectroporation: boolean;
}

export interface FrugalConfig {
  electroporator: 'neon-10ul' | 'other-electroporator';
  cloningTech: 'isocell' | 'limiting-dilution' | 'clone-picking';
  gRNASource: 'alt-r' | 'other-synthetic' | 'in-vitro-transcribed';
  screeningStrategy: 'sanger-all' | 'prescreen';
}

export interface RareDiseaseMission {
  id: string;
  diseaseName: string;
  inheritance: string;
  gene: string;
  proteinChange: string;
  genomicCoord: string;
  refAllele: string;
  altAllele: string;
  phenotypeDescription: string;
  curationNotes: string;
  strategy: 'HDR-SNP-Edit' | 'Gene-Knockout' | 'Base-Editing';
  recommendedGuides: {
    name: string;
    sequence: string;
    pam: string;
    strand: '+' | '-';
    /** |cut position - edit position| in bp, computed from the design geometry. */
    cutDist: number;
    /** 0-based cut position in the design window (the boundary before this base). */
    cutPosition?: number;
  }[];
  /** First ssODN as ordered (plain sequence). `ssodns` lists all of them. */
  ssodnTemplate: string;
  ssodns: MissionDonor[];
  silentChanges: string[];
  /** Offline checks of this design against GRCh38. */
  verification: {
    assembly: string;
    total: number;
    passed: number;
    failed: string[];
    note: string;
  };
  /** Id of a preset project with real traces for this mission, if any. */
  traceProjectId?: string;
}

export interface MissionDonor {
  name: string;
  forGuide: string;
  /** Strand of the ordered oligo relative to the reference. */
  strand: '+' | '-';
  totalLength: number;
  arm5Length: number;
  arm3Length: number;
  pamDistalArm: number;
  pamProximalArm: number;
  sequence: string;
  intendedEditDescription: string;
  blockingChanges: string;
}

/** A mission that was removed from the verified set, with the reason, so learners can see what failed and why. */
export interface UnverifiedMission {
  id: string;
  gene: string;
  claimed: string;
  reason: string;
}

/** A file served from /sample_data. Every entry is generated from a file that exists in the repository. */
export interface SampleDataset {
  id: string;
  name: string;
  category: 'Design-Report' | 'Sanger-AB1' | 'GenBank-Ref' | 'Results-Table';
  description: string;
  url: string;
  downloadFilename: string;
  bytes: number;
  sha256: string;
}

export interface DesignExample {
  id: string;
  label: string;
  gene: string;
  diseaseName: string;
  mode: 'SNP_KNOCKIN';
  /** 300 nt of verified GRCh38-derived sequence with the edit at editPosition. */
  sequence: string;
  editPosition: number;
  altBase: string;
  description: string;
}
