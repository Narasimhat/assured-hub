import React, { useState } from "react";
import { planResearchRequest, AGENT_ACTIONS } from "../../services/agentRouter.js";

/** Local prototype. Explicitly no LLM, external API, or data upload. */
export function AskAssured({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState(null);
  const [goal, setGoal] = useState(null);
  function submit(event) {
    event.preventDefault();
    const plan = planResearchRequest(query);
    const p53 = /\\b(?:tp53|p53)\\b/i.test(query);
    const knockout = /knock.?out|\\bko\\b/i.test(query);
    setGoal(p53 && knockout ? "TP53 knockout" : null);
    setReply(p53 && knockout ? {
      ...plan,
      message: "TP53 regulates the DNA-damage response. Is your goal a complete knockout or a specific variant? Confirm the model and objective before reviewing a design. Edited iPSCs require careful genomic-integrity assessment.",
    } : plan);
  }
  return <section className="card" aria-label="Ask ASSURED" style={{ marginBottom: "1rem", padding: "1rem" }}>
    <h2 style={{ marginTop: 0 }}>Ask ASSURED <small style={{ fontSize: "0.7em" }}>(prototype)</small></h2>
    <p>Describe your research goal. This local guide directs you to existing ASSURED tools; it is not yet a generative AI assistant.</p>
    <form onSubmit={submit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <label htmlFor="assured-question" style={{ width: "100%" }}>What would you like to do?</label>
      <input id="assured-question" value={query} onChange={e => setQuery(e.target.value)}
        placeholder="I want to knock out TP53 in human iPSCs"
        style={{ flex: "1 1 18rem" }} />
      <button type="submit" className="btn btn-primary">Ask</button>
    </form>
    {reply && <div role="status" style={{ marginTop: "0.8rem" }}>
      <p>{reply.message}</p>
      {goal && <p><strong>Recognized goal:</strong> {goal}. No design has been generated.</p>}
      {reply.action !== AGENT_ACTIONS.HELP && <button type="button" className="btn btn-primary"
        onClick={() => onNavigate(reply.action === AGENT_ACTIONS.DESIGN ? "design" : reply.action === AGENT_ACTIONS.QC ? "qc" : "decision")}>
        Open {reply.action === AGENT_ACTIONS.DESIGN ? "Design" : reply.action === AGENT_ACTIONS.QC ? "Trace QC" : "Clone Decisions"}
      </button>}
    </div>}
    <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>Your question is processed in this browser. Review all designs and experimental conclusions independently.</p>
  </section>;
}
