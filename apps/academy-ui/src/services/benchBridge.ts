/**
 * Academy -> ASSURED Bench hand-off.
 *
 * The Academy does not import Bench's source: the two are separate Vite builds and Bench's engines
 * are 700 kB. The payload format is Bench's own exported-experiment shape, encoded into the URL
 * fragment, and Bench decodes it with `apps/studio/src/services/academyHandoff.js`.
 *
 * The two encoders are deliberately duplicated across the app boundary and pinned together by
 * `tests/contract/academy-bench-handoff.test.js`, which fails if they stop agreeing.
 */

/** Bench edit types, from `parseProject` in apps/studio/src/services/projectState.js. */
export type BenchEditType = 'ko' | 'pm' | 'ct' | 'nt' | 'it';

export interface BenchHandoff {
  /** Shown in Bench's experiment name field. */
  name: string;
  gene: string;
  editType: BenchEditType;
  /** Free text, e.g. "R176C". Bench's own field. */
  mutation?: string;
  tag?: string;
  homologyArmLength?: number;
  options?: { deliveryMethod?: string; maxBlockingChanges?: number; coDeliveryBlocking?: boolean };
}

export const HANDOFF_PARAM = 'handoff';

/** Bench is one level up from the Academy in both the hub build and the dev setup. */
export const BENCH_URL = '../studio/';

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * A link that opens Bench on a prepared experiment.
 * Design output and QC results are never sent: Bench drops them anyway, and a lesson should not be
 * able to put engine output into a workspace without the engine having run.
 */
export function benchHandoffUrl(handoff: BenchHandoff, benchUrl: string = BENCH_URL): string {
  const payload: Record<string, unknown> = {
    name: handoff.name,
    gene: handoff.gene,
    editType: handoff.editType,
  };
  if (handoff.mutation) payload.mutation = handoff.mutation;
  if (handoff.tag) payload.tag = handoff.tag;
  if (typeof handoff.homologyArmLength === 'number') payload.homologyArmLength = handoff.homologyArmLength;
  if (handoff.options) payload.options = handoff.options;
  return `${benchUrl}#${HANDOFF_PARAM}=${toBase64Url(JSON.stringify(payload))}`;
}

/** The standard "take this into Bench" button, so every tier presents the hand-off the same way. */
export function benchLinkLabel(handoff: BenchHandoff): string {
  return `Open ${handoff.gene} ${handoff.mutation || handoff.editType.toUpperCase()} in ASSURED Bench`;
}
