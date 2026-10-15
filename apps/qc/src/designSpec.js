// The design hand-off contract (assured-qc-design/1) now lives in @assured/spec so that Assured CRISPR Design,
// Assured QC and the Academy grader import one definition. This file keeps the old import path working.
export { QC_SPEC_SCHEMA, EDIT_KINDS, validateDesignSpec, reverseSpec } from "@assured/spec";
