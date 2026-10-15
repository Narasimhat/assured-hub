import React from "react";

const steps = [
  { id: "design", title: "Design", text: "Choose your gene and edit, fetch or upload a GenBank reference, then generate and review the design." },
  { id: "order", title: "Plan reagents", text: "Review guides, donor, and primers, complete the listed checks, and export your reagent sheet." },
  { id: "qc", title: "Analyse traces", text: "Upload the parental control and edited AB1 traces, check the detected control and clone counts, then run Trace Deconvolution." },
  { id: "decision", title: "Review clones", text: "Inspect QC results and candidate reasons, compare clones, and download the screening CSV." },
];

export function QuickStart({ onNavigate }) {
  return (
    <details className="quick-start card">
      <summary>Quick start · How to use ASSURED Bench</summary>
      <ol className="quick-start-steps" aria-label="Bench workflow">
        {steps.map((step, index) => (
          <li key={step.id}>
            <span className="quick-start-number" aria-hidden="true">{index + 1}</span>
            <h3><button type="button" onClick={() => onNavigate(step.id)}>{step.title}</button></h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <div className="quick-start-paths">
        <section aria-labelledby="practice-heading">
          <h3 id="practice-heading">Try sample data</h3>
          <p>Start a new experiment, open Trace QC, and choose <strong>Benchmark Traces</strong>. Click <strong>Run Trace Deconvolution</strong>, then review the results and Select clones. The benchmark includes its own design reference.</p>
          <button className="btn btn-secondary" type="button" onClick={() => onNavigate("qc")}>Open Trace QC</button>
        </section>
        <section aria-labelledby="experiment-heading">
          <h3 id="experiment-heading">Use your own experiment</h3>
          <p>Follow the four steps above. Use your experiment's design and matching parental control for QC. Start a new experiment before switching between sample data and your own traces.</p>
          <p><strong>Save</strong> stores your project on this device. <strong>Export</strong> downloads a portable backup. Save or export before starting a new experiment.</p>
        </section>
      </div>
    </details>
  );
}
