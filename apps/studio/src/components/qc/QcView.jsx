import React, { useEffect, useMemo, useRef } from "react";
import { buildQcDesignSpec } from "../../engine/design/qcExport.js";
import { downloadDesignJson, downloadReportHtml } from "../../services/designExport.js";

// Use Assured QC itself: its upload, pairing, HTML import and worker analysis stay identical.
export function QcView({ currentProject, onUpdateProject }) {
  const frame = useRef(null);
  const ready = useRef(false);
  const update = useRef(onUpdateProject);
  update.current = onUpdateProject;
  const source = import.meta.env.DEV ? "http://127.0.0.1:5174/bench.html" : "../qc/bench.html";
  const qcOrigin = new URL(source, window.location.href).origin;
  const design = useMemo(() => {
    if (currentProject.qcImportedDesignText) return { text: currentProject.qcImportedDesignText, name: currentProject.qcDesignSource || "Imported design" };
    try {
      const spec = currentProject.qcDesignSpec || (currentProject.designResult ? buildQcDesignSpec(currentProject.designResult) : null);
      return spec ? { text: JSON.stringify(spec), name: currentProject.qcDesignSource || `${currentProject.gene || "Bench"} design` } : null;
    } catch { return null; }
  }, [currentProject.qcImportedDesignText, currentProject.qcDesignSource, currentProject.qcDesignSpec, currentProject.designResult, currentProject.gene]);
  const currentDesign = useRef(design);
  currentDesign.current = design;
  useEffect(() => {
    const receive = event => {
      if (event.source !== frame.current?.contentWindow || event.origin !== qcOrigin) return;
      if (event.data?.type === "assured:qc:ready") {
        ready.current = true;
        frame.current.contentWindow.postMessage({ type: "assured:qc:design", design: currentDesign.current }, qcOrigin);
      }
      if (event.data?.type === "assured:qc:results" && Array.isArray(event.data.results)) {
        update.current({ qcResults: event.data.results, ...(typeof event.data.designText === "string" ? { qcImportedDesignText: event.data.designText, qcDesignSource: event.data.designName } : {}) });
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [qcOrigin]);
  useEffect(() => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ type: "assured:qc:design", design }, qcOrigin);
  }, [design, qcOrigin]);
  return <div>
    <div className="card">
      <h3>Trace QC · Assured QC</h3>
      <p style={{ color: "var(--text-muted)", margin: "0.75rem 0" }}>Use the same upload and analysis workflow as standalone Assured QC. Add your design <strong>HTML report or JSON</strong> and sequencing files below. Review pairings, then run analysis. Results also appear in Bench's Select clones step.</p>
      <div className="project-controls">
        {currentProject.designResult && <>
          <button className="btn btn-secondary" onClick={() => downloadReportHtml(currentProject, currentProject.designResult)}>Download design HTML</button>
          <button className="btn btn-secondary" onClick={() => downloadDesignJson(currentProject, currentProject.designResult)}>Download Design JSON</button>
        </>}
        <a className="btn btn-secondary" href="./demo_traces/apoe_qc_practice.zip" download>Download practice ZIP</a>
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.75rem" }}>{design ? `Bench design supplied: ${design.name}. You can replace it with an HTML report or JSON below.` : "Add an HTML design report or JSON below, or upload the practice ZIP including its APOE design and traces."}</p>
    </div>
    <iframe ref={frame} src={source} title="Assured QC upload and analysis" style={{ width: "100%", height: "85vh", minHeight: 700, border: "1px solid var(--border-color)", borderRadius: 12, background: "#fff" }} />
  </div>;
}
