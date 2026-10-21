import React, { useEffect, useMemo, useRef } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h3>Trace Analysis</h3>
          <p style={{ color: "var(--text-muted)", margin: "0.5rem 0" }}>
            Sanger chromatogram deconvolution & clone screening. Review sample/control pairings, then run analysis to generate clone rankings and publication figures.
          </p>
        </div>
        <div className="project-controls" style={{ margin: 0 }}>
          {currentProject.designResult && <>
            <button className="btn btn-secondary" onClick={() => downloadReportHtml(currentProject, currentProject.designResult)}>Download design HTML</button>
            <button className="btn btn-secondary" onClick={() => downloadDesignJson(currentProject, currentProject.designResult)}>Download Design JSON</button>
          </>}
          <a className="btn btn-secondary" href="./demo_traces/apoe_qc_practice.zip" download>Download practice ZIP</a>
        </div>
      </div>

      {design ? (
        <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CheckCircle size={20} style={{ color: "#10b981", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#10b981" }}>
                Design active & parsed: {design.name}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                Target: <strong>{currentProject.gene || "Gene"}</strong> · Bench loaded this design. You can review or override gRNA &amp; donor sequences directly in the workspace below.
              </div>
            </div>
          </div>
          <div style={{ fontSize: "0.85rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.35rem 0.75rem", borderRadius: "6px", fontWeight: 500 }}>
            Next: Provide matching Parental Control &amp; Sample .ab1 files below
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", borderRadius: "8px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.3)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <AlertCircle size={20} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: "#f59e0b" }}>No active design loaded</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
              Provide your <strong>gRNA sequences and donor sequence</strong> directly in the workspace below, upload a Design JSON / HTML report, or design an edit in <strong>Step 1</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
    <iframe ref={frame} src={source} title="Trace Analysis upload and analysis" style={{ width: "100%", height: "88vh", minHeight: 760, border: "none", borderRadius: 12, background: "transparent" }} />
  </div>;
}
