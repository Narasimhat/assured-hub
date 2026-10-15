import type { BenchProtocolState, RnpCondition } from '../types/pipeline';

/**
 * Values from "ASSURED-optimized CRISPR protocol for knockout/SNP knockin in hiPSCs"
 * (Ludwik KA, Telugu N, Schommer S, Stachelscheid H, Diecke S; STAR Protocols 2023; doi 10.1016/j.xpro.2023.102406).
 * Nothing here is a recorded value from a particular lab run.
 */
export const DEFAULT_BENCH: BenchProtocolState = {
  reactions: 1,
  cloningMethod: 'isocell',
  isBenchCompleted: false,
  valuesSource: 'protocol-defaults',
};

/** Table 7: volumes in uL per reaction mix (total 15 uL). R buffer is the remainder, as printed in the paper. */
export const RNP_TABLE: Record<RnpCondition, { label: string; cas9: number; gRNA1: number; gRNA2: number | null; ssodn: number | null; rBuffer: number }> = {
  '1gRNA-KO': { label: '1 gRNA, knockout', cas9: 0.5, gRNA1: 2, gRNA2: null, ssodn: null, rBuffer: 12.5 },
  '2gRNA-KO': { label: '2 gRNAs, knockout', cas9: 1, gRNA1: 2, gRNA2: 2, ssodn: null, rBuffer: 10 },
  '1gRNA-KI': { label: '1 gRNA, knock-in', cas9: 0.5, gRNA1: 2, gRNA2: null, ssodn: 3, rBuffer: 9.5 },
  '2gRNA-KI': { label: '2 gRNAs, knock-in', cas9: 1, gRNA1: 2, gRNA2: 2, ssodn: 3, rBuffer: 7 },
};
export const RNP_TOTAL_UL = 15;

/** Electroporation conditions stated in the protocol (Neon system, 10 uL kit). */
export const NEON_CONDITIONS = { tip: '10 \u00b5L', voltage: '1200 V', pulseWidth: '30 ms', pulses: 1 } as const;

/** Default Table 7 condition for a target: the lab convention is two guides, and KI mixes include the ssODN. */
export const conditionFor = (guideCount: number, isKnockout: boolean): RnpCondition =>
  `${guideCount >= 2 ? 2 : 1}gRNA-${isKnockout ? 'KO' : 'KI'}` as RnpCondition;
