// @assured/protocol: the empirical parameters the Academy teaches and the Bench enforces.
//
// Every number is wrapped by `stated()` with a provenance level (published / owner-stated /
// illustrative) and a source id. See src/sources.js for what those levels mean and why this package
// exists: before it, the Neon settings lived in a TypeScript file only the Academy could read, the
// simulator rates lived in the headless core, and the culture, IsoCell, CRISPR-MiX, power and
// off-target numbers lived nowhere at all.
//
// Plain ESM with one workspace dependency (@assured/rules), so Bench can import it unchanged.

export * from "./sources.js";
export * from "./protocols.js";
export * from "./culture.js";
export * from "./isocell.js";
export * from "./wetlabModel.js";
export * from "./icc.js";
export * from "./offTarget.js";
export * from "./personas.js";
