/**
 * ASSURED prototype: transparent, deterministic intent routing.
 * This is NOT an LLM and does not execute experiments or analyze sequences.
 * No experimental or patient data is sent to a server.
 */
export const AGENT_ACTIONS = Object.freeze({
  DESIGN: "open_design",
  QC: "open_qc",
  DECISION: "open_decision",
  HELP: "show_help",
});
export function planResearchRequest(input) {
  if (typeof input !== "string" || !input.trim()) {
    return { action: AGENT_ACTIONS.HELP, message: "Describe a design, sequencing QC, or clone-review task.", requiresReview: true };
  }
  const text = input.toLowerCase();
  const qc = /sanger|chromatogram|\\.ab1\\b|sequenc|trace|genotyp|clone screening/.test(text);
  const design = /design|guide|grna|donor|knock.?in|knock.?out|crispr|hdr/.test(text);
  if (design && qc) return {
    action: AGENT_ACTIONS.DESIGN,
    nextAction: AGENT_ACTIONS.QC,
    message: "Start with Design and review its output. Then open Trace QC with the approved design and your local sequencing files.",
    requiresReview: true,
  };
  if (qc) return { action: AGENT_ACTIONS.QC, message: "Open Trace QC to analyze sequencing files locally. Review uncertain calls and confirm with independent evidence.", requiresReview: true };
  if (/decision|select clone|rank clone|expand clone/.test(text)) return { action: AGENT_ACTIONS.DECISION, message: "Open clone decisions. Confirm genotype and quality before selecting a clone.", requiresReview: true };
  if (design) return { action: AGENT_ACTIONS.DESIGN, message: "Open Design. Confirm reference, transcript, guide specificity and donor before ordering.", requiresReview: true };
  return { action: AGENT_ACTIONS.HELP, message: "I can guide you to Design, Trace QC, or clone decisions. What is your goal?", requiresReview: true };
}
