// Design-engine limits that a grader must read from the same place the design tool does. Moved unchanged from Assured_CRISPR_Design.

// designEngine.js: the most blocking (PAM/seed) substitutions the engine will add per guide.
export const MAX_BLOCKING_CHANGES = 3;

// pairBlocking.js
export const MAX_GUIDE_CUT_DISTANCE = 15;   // bp from the edit; HDR falls off beyond about 10
export const MIN_PAIR_CUT_SEPARATION = 10;  // the engine's own spacing for a second guide; closer cuts can excise the bases between them
