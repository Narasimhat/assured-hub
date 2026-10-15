// Donor-format tiers: which donor format suits an insert, and the arm lengths each format starts from.
// Moved unchanged from Assured_CRISPR_Design (src/donorFormat.js). Sources for the numbers, as stated there: IDT product and
// protocol pages for Alt-R HDR Donor Oligos (ssODN) and Alt-R HDR Donor Blocks. Insertions shorter than 120 bp are recommended
// as ssODNs; blocks cover 201-3000 bases with 200-300 bp arms recommended; ssODN donor oligos run to 200 nt with 30-60 nt arms.
// The 500 bp insert size at which the default moves from a block to a cloned/AAV donor is the design tool's own choice, not a vendor limit.

export const DONOR_FORMATS = {
  ssodn: {
    key: "ssodn", short: "ssODN", label: "ssODN (single-stranded oligo, e.g. Alt-R HDR Donor Oligo)",
    maxLength: 200, defaultArm: 60, minArm: 30, maxArm: 60,
  },
  block: {
    key: "block", short: "dsDNA block", label: "dsDNA donor block (e.g. Alt-R HDR Donor Block)",
    minLength: 201, maxLength: 3000, defaultArm: 250, minArm: 100, maxArm: 500,
  },
  aav: {
    key: "aav", short: "AAV / plasmid", label: "AAV or plasmid donor (cloned)",
    defaultArm: 500, minArm: 300, maxArm: 1000,
  },
};
export const DONOR_FORMAT_KEYS = Object.keys(DONOR_FORMATS);
export const SSODN_BELOW_INSERT_BP = 120;
export const AAV_ABOVE_INSERT_BP = 500;

export function recommendDonorFormat(insertBp) {
  const length = Number(insertBp);
  if (!(length > 0)) return { format: "block", reason: "Insert length is unknown, so a dsDNA block is assumed." };
  if (length < SSODN_BELOW_INSERT_BP) {
    return { format: "ssodn", reason: `A ${length} bp insert is shorter than ${SSODN_BELOW_INSERT_BP} bp, the size IDT recommends an ssODN for.` };
  }
  if (length > AAV_ABOVE_INSERT_BP) {
    return {
      format: "aav",
      reason: `A ${length} bp insert is above ${AAV_ABOVE_INSERT_BP} bp (reporter or selection-cassette size), where this tool defaults to a cloned or AAV donor with ${DONOR_FORMATS.aav.defaultArm} bp arms. A synthesized block is still possible up to ${DONOR_FORMATS.block.maxLength} bp in total.`,
    };
  }
  return { format: "block", reason: `A ${length} bp insert is longer than ${SSODN_BELOW_INSERT_BP} bp and no longer than ${AAV_ABOVE_INSERT_BP} bp, which suits a synthesized dsDNA block with ${DONOR_FORMATS.block.defaultArm} bp arms.` };
}
