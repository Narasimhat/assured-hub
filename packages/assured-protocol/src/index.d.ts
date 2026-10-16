// Hand-written declarations for @assured/protocol. The package itself is plain ESM so that Bench
// (JavaScript) and the Academy UI (TypeScript) can both read it. Keep this in step with src/.

export type Provenance = "published" | "owner-stated" | "illustrative";

export interface Source {
  id: string;
  short: string;
  citation: string;
  doi?: string;
  url?: string;
  pmid?: string;
}

export interface Stated<T = number> {
  value: T;
  unit: string;
  provenance: Provenance;
  sourceId: string;
  note?: string;
}

export declare const PROVENANCE_LEVELS: readonly Provenance[];
export declare const PROVENANCE_LABELS: Record<Provenance, string>;
export declare const SOURCES: Record<string, Source>;
export declare function stated<T>(value: T, unit: string, provenance: Provenance, sourceId: string, note?: string): Stated<T>;
export declare function describe(statedValue: Stated<unknown>): string;
export declare function collectSources(node: unknown, found?: Set<string>): Source[];

// --- protocols -------------------------------------------------------------

export interface RnpRow {
  label: string;
  cas9: number;
  gRNA1: number;
  gRNA2: number | null;
  ssodn: number | null;
  rBuffer: number;
}

export interface AssuredProtocol {
  id: "assured";
  name: string;
  expansion: string;
  purpose: string;
  sourceId: string;
  electroporation: { instrument: string; voltage: Stated; pulseWidthMs: Stated; pulses: Stated };
  rnpTableTotalUl: Stated;
  rnpTable: Record<string, RnpRow>;
  poolScores: {
    loci: Stated; lines: Stated;
    koMean: Stated; koSd: Stated; koMin: Stated;
    kiMean: Stated; kiSd: Stated; kiMin: Stated;
  };
  deconvolution: { method: string; tool: string; url: string; note: string };
  design: { assembly: string; recordTypes: string; knockoutRule: string; knockinRule: string; cutDistanceLimitFrom: string };
}

export interface CrisprMixLocus {
  gene: string;
  behaviour: "responsive" | "refractory";
  note: string;
  provenance: Provenance;
}

export interface CrisprMixProtocol {
  id: "crispr-mix";
  name: string;
  purpose: string;
  sourceId: string;
  electroporation: { instrument: string; voltage: Stated; pulseWidthMs: Stated; pulses: Stated; cells: Stated; bufferVolume: Stated };
  rnp: { sgRNA: Stated; cas9: Stated; pooledSsodn: Stated; complexingMinutes: Stated<number>; molarRatioNote: string };
  donorDesignParameters: ReadonlyArray<{ key: string; label: string; provenance: Provenance; sourceId: string }>;
  recovery: string;
  deconvolution: { day2: string; ngs: string; quantification: string; flow: string };
  loci: readonly CrisprMixLocus[];
  boundary: string;
}

export declare const NUCLEASE: { name: string; stockConcentration: Stated; aliquotVolume: Stated; freezeThawWarning: string };
export declare const ASSURED: AssuredProtocol;
export declare const CRISPR_MIX: CrisprMixProtocol;
export declare const PROTOCOLS: { assured: AssuredProtocol; "crispr-mix": CrisprMixProtocol };
export declare const PROTOCOL_IDS: readonly string[];
export declare function pulseSummary(protocolId: string): string;
export declare function pulseVariants(): Array<{ protocolId: string; name: string; summary: string }>;

// --- culture ---------------------------------------------------------------

export interface CultureDeviation {
  key: string;
  question: string;
  correct: string;
  deviation: string;
  mechanism: string;
}

export declare const HYPOXIA: {
  temperatureC: Stated; co2Percent: Stated; o2Percent: Stated; normoxicO2Percent: Stated;
  passagesPostThaw: Stated<string>; mechanism: string; crisprMixNote: string;
};
export declare const GELTREX: {
  stockVolumeMl: Stated; diluentVolumeMl: Stated; diluent: string; aliquotMl: Stated; aliquotStorageC: Stated;
  workingDilution: Stated<string>; coatingTime: Stated<string>; prechillC: Stated; prechillMinutes: Stated;
  mechanism: string; bubbleWarning: string;
};
export declare const MATRIGEL: { hiPscMaintenance: Stated<string>; cardiomyocytes: Stated<string>; mechanism: string };
export declare const MEDIA: {
  maintenance: string;
  editingRecovery: { options: string[]; mechanism: string };
  cloneR2: { dilution: Stated<string>; mediaChange24h: string; mediaChange48h: string; mechanism: string };
  rockInhibitor: { agent: string; crisprMixConcentration: Stated };
  passaging: { clumps: string; dpbsEdtaMinutes: Stated<string>; singleCell: string; expansionSplit: Stated<string> };
};
export declare const CULTURE_DEVIATIONS: readonly CultureDeviation[];

// --- isocell ---------------------------------------------------------------

export declare const ISOCELL: {
  chambersPerPlate: Stated; singleCellChambers: Stated; survivingClones: Stated; survivalRate: Stated;
  cryopreservation: { format: string; medium: string };
  seedbank: { clonesPerProject: Stated<string>; vialsPerBank: Stated };
  claim: string;
};

export interface CloneYield {
  chambers: number;
  singleCellChambers: number;
  survivors: number;
  editedClones: number;
  homozygousClones: number;
  clonesNeeded: number;
  meetsTarget: boolean;
  platesForTarget: number | null;
  caveats: string[];
}

export declare function projectCloneYield(input: {
  chambers?: number; singleCellFraction?: number; survivalRate?: number; poolScore: number; clonesNeeded?: number;
}): CloneYield;

export declare function planSeedbank(input?: { clonesToBank?: number; vialsPerClone?: number; vialsPerFreezeRun?: number }): {
  clonesToBank: number; vialsPerClone: number; totalVials: number; freezeRuns: number; note: string;
};

// --- wet-lab model ---------------------------------------------------------

export type Severity = "critical" | "major" | "minor";

export interface RunFinding {
  key: string;
  severity: Severity;
  label: string;
  chose: string;
  shouldBe: string;
  editingFactor: number;
  survivalFactor: number;
  mechanism: string;
}

export interface RunResult {
  editKind: "knockout" | "knockin";
  baseline: { poolScorePercent: number; survivorsAtBaseline: number };
  poolScorePercent: number;
  survivalPercent: number;
  singleCellChambers: number;
  survivingClones: number;
  editedClones: number;
  meetsBenchmark: boolean;
  benchmarkClones: number;
  findings: RunFinding[];
  verdict: { level: "good" | "acceptable" | "marginal" | "failed"; text: string };
  provenance: string;
}

export declare const MODEL_PROVENANCE: string;
export declare const PENALTIES: Record<string, { editing: number; survival: number; severity: Severity }>;
export declare const SEVERITY_ORDER: readonly Severity[];
export declare function baseline(editKind: string): { poolScore: number; poolScoreSd: number; survivalRate: number; sourceId: string };
export declare function scoreRun(run?: {
  editKind?: "knockout" | "knockin";
  deviations?: string[];
  guideCount?: number;
  cutToEditBp?: number;
  donorBlocksAllGuides?: boolean;
  chambers?: number;
}): RunResult;

// --- icc -------------------------------------------------------------------

export declare const ICC_REFERENCE: {
  medianIcc: Stated; genes: Stated; donors: Stated; fractionAbove20: Stated; fractionAbove50: Stated; caution: string;
};

export interface EffectiveN {
  donors: number; linesPerDonor: number; totalSamples: number; icc: number; designEffect: number; effectiveN: number;
}

export declare function effectiveN(input: { donors: number; linesPerDonor?: number; icc: number }): EffectiveN;

export declare function compareDesigns(input?: { icc?: number; totalSamples?: number }): {
  icc: number;
  totalSamples: number;
  designs: Array<{ id: string; label: string; effectiveN: number; designEffect: number; verdict: string }>;
  caveats: string[];
};

export declare function effectiveNCurve(input?: { icc?: number; linesPerDonor?: number; maxDonors?: number }): Array<EffectiveN & { donors: number }>;

// --- off target ------------------------------------------------------------

export interface Assay {
  id: string;
  name: string;
  class: "in-situ" | "in-vitro" | "verification" | "structural";
  principle: string;
  material: string;
  sensitivity: string;
  dnaInput: Stated | null;
  constraints: string;
  role: "nomination" | "verification" | "structural";
  note?: string;
}

export declare const ASSAY_CLASSES: Record<string, { label: string; strength: string; weakness: string }>;
export declare const ASSAYS: readonly Assay[];
export declare const REGULATORY_RULES: ReadonlyArray<{ id: string; rule: string; why: string; sourceId: string }>;
export declare function recommendPanel(input?: {
  cellType?: "hipsc" | "primary" | "cell-line";
  dnaAvailability?: "abundant" | "limited";
  multiplexed?: boolean;
  indEnabling?: boolean;
}): {
  assays: Assay[];
  reasons: string[];
  gaps: string[];
  rules: ReadonlyArray<{ id: string; rule: string; why: string; sourceId: string }>;
};

// --- personas --------------------------------------------------------------

export interface Persona {
  id: string;
  tier: number;
  name: string;
  short: string;
  route: string;
  depth: number;
  objective: string;
  module: string;
  teaches: string[];
  jargonPolicy?: string;
}

export declare const DEPTHS: Record<string, number>;
export declare const PERSONAS: readonly Persona[];
export declare const PERSONA_IDS: readonly string[];
export declare function getPersona(id: string): Persona | null;
export declare function explainFor(variants: Record<string, string>, personaId: string): string;

// Re-exported from @assured/rules through src/protocols.js.
export declare const MAX_GUIDE_CUT_DISTANCE: number;
export declare const MIN_PAIR_CUT_SEPARATION: number;
export declare const MAX_BLOCKING_CHANGES: number;
export declare const LAB_CONVENTIONS: {
  source: string;
  minGuides: Record<string, number>;
  donorCarriesBlockingForAllGuides: Record<string, boolean>;
  donorByClass: Record<string, { format: string; armBp?: number; examples?: string }>;
};
