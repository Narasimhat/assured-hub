// The lab's guide and donor conventions, as stated by the lab (not derived from the design tool's code).
// The Academy grader checks submissions against these; the design tool's own limits come from engineConstants.js and donorTiers.js.
// Edit kinds are the QC hand-off's (EDIT_KINDS in @assured/spec).

export const LAB_CONVENTIONS = Object.freeze({
  source: "Lab convention stated by the lab's senior scientist; not a published rule and not enforced by the design engine.",
  // Always two guides.
  minGuides: Object.freeze({
    knockout: 2, deletion: 2, snp: 2, tag_small: 2, internal_tag: 2, terminal_tag: 2, tag_large: 2, reporter: 2,
  }),
  // Small edits: ssODN(s) that each carry silent (blocking) mutations for BOTH guides.
  // Large knock-ins: one donor carrying silent mutations for both guides.
  donorCarriesBlockingForAllGuides: Object.freeze({ snp: true, tag_small: true, internal_tag: true, tag_large: true, reporter: true, terminal_tag: true }),
  // Donor format by insert class, with the homology-arm length the lab uses for that class.
  donorByClass: Object.freeze({
    snp:       Object.freeze({ format: "ssodn" }),
    tag_small: Object.freeze({ format: "ssodn", examples: "HA, V5" }),
    tag_large: Object.freeze({ format: "block", armBp: 250, examples: "AID, SD40, dTAG, miniIAA7-size inserts" }),
    reporter:  Object.freeze({ format: "aav", armBp: 500, examples: "GFP, RFP and larger inserts" }),
  }),
});
