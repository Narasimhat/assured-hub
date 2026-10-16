// Academy -> Bench hand-off.
//
// The Academy cannot import Bench, and before this there was no way to carry a worked example across:
// a learner who designed a guide in a lesson arrived here on a blank experiment.
//
// The payload is a Bench experiment, exactly the shape the Export button writes, carried in the URL
// fragment as `#handoff=<base64url JSON>`. The fragment is used rather than a query string so the
// payload is never sent to the server, and so it does not survive in server logs.
//
// This module does no validation of its own. It decodes, then hands the text to the existing
// parseProject, which is the only intake Bench has and already rejects unrelated JSON.

import { parseProject } from "./projectState.js";

export const HANDOFF_PARAM = "handoff";

/** Decode base64url (RFC 4648 section 5) to a UTF-8 string. */
function fromBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode a UTF-8 string as base64url. Exported so a test can round-trip without the Academy. */
export function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The raw payload in a URL fragment, or null. Accepts the fragment with or without its leading "#". */
export function handoffParam(hash) {
  if (typeof hash !== "string" || hash.length === 0) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get(HANDOFF_PARAM);
}

/**
 * Read a hand-off out of a URL fragment.
 *
 * @param {string} hash  window.location.hash
 * @returns {{project: object, error: null} | {project: null, error: string} | null}
 *          null when there is no hand-off at all, which is the normal case.
 */
export function readHandoff(hash) {
  const raw = handoffParam(hash);
  if (!raw) return null;
  let text;
  try {
    text = fromBase64Url(raw);
  } catch {
    return { project: null, error: "That ASSURED Academy link is damaged and could not be read." };
  }
  try {
    const project = parseProject(text);
    // A hand-off is a starting point, never a finished result: an Academy link must not be able to
    // put design output or screening results into Bench without the engine having produced them.
    return {
      project: { ...project, designResult: null, svgScheme: null, caption: null, status: null, qcResults: [], qcDesignSpec: null },
      error: null,
    };
  } catch (err) {
    return { project: null, error: `That ASSURED Academy link does not describe a Bench experiment: ${err.message}` };
  }
}

/** Remove the hand-off from the address bar once it has been applied, so a reload does not re-apply it. */
export function clearHandoff(location, history) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  if (!params.has(HANDOFF_PARAM)) return;
  params.delete(HANDOFF_PARAM);
  const rest = params.toString();
  history.replaceState(null, "", `${location.pathname}${location.search}${rest ? `#${rest}` : ""}`);
}

/**
 * Build a hand-off URL. Bench itself does not need this, but keeping the encoder and the decoder in
 * one file is what stops the two sides drifting; the Academy imports it through its own thin wrapper.
 */
export function buildHandoffUrl(benchUrl, project) {
  return `${benchUrl}#${HANDOFF_PARAM}=${toBase64Url(JSON.stringify(project))}`;
}
