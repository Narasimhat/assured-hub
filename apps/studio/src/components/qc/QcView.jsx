import { fetchTraceAsset, fetchQcSpecAsset } from "../../services/qcAssets.js";
import React, { useState } from "react";
import { parseAbif } from "../../engine/qc/abif.js";
import { analyseSample } from "../../engine/qc/batch.js";
import { decide } from "../../engine/qc/decision.js";
import { chromatogramFigure } from "../../engine/qc/figure.js";
import { withRecommendations } from "../../engine/qc/recommend.js";
import { buildQcDesignSpec } from "../../engine/design/qcExport.js";
import { looksLikeControl } from "../../engine/qc/sheet.js";
import { buildQcReportHtml, buildResultsCsv } from "../../engine/qc/report.js";
import { PlateView } from "./PlateView.jsx";
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, FileText, Download, Play, ArrowLeft } from "lucide-react";

export function QcView({ currentProject, onUpdateProject, onBackToDesign }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [demoSpec, setDemoSpec] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(currentProject?.qcResults || []);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedFigureSvg, setSelectedFigureSvg] = useState(null);
  const [error, setError] = useState(null);

  // Load demo Sanger traces directly
  const handleLoadDemoTraces = async () => {
    setError(null);
    try {
      const demoNames = [
        "apoe_control.ab1",
        "apoe_snp_clone_hom_edited.ab1",
        "apoe_snp_clone_het_edited.ab1",
        "apoe_snp_clone_partial_het_edited.ab1"
      ];
      const loaded = await Promise.all(
        demoNames.map(async (name) => {
          const buffer = await fetchTraceAsset(`/demo_traces/${name}`);
          return {
            name,
            buffer,
            isControl: looksLikeControl(name)
          };
        })
      );

      const spec = await fetchQcSpecAsset("demo_traces/apoe_r176c_snp.design.json");
      setDemoSpec(spec);
      setUploadedFiles(loaded);
      setAnalysisResults([]);
      setSelectedResult(null);
      setSelectedFigureSvg(null);
      onUpdateProject({ qcResults: [] });
    } catch (e) {
      setError("Failed to load demo traces: " + e.message);
    }
  };

  // Load real MYD88 KO Drive dataset
  const handleLoadMyd88DriveData = async () => {
    setError(null);
    try {
      const mydFiles = [
        "BIHi005-A_wt_1172_EF74668951.ab1",
        "cl1_MYD88_KO_1172_EF74878421.ab1",
        "cl2_MYD88_KO_1172_EF74878422.ab1",
        "cl3_MYD88_KO_1172_EF74878423.ab1",
        "cl4_MYD88_KO_1172_EF74878424.ab1",
        "cl5_MYD88_KO_1172_EF74878425.ab1",
        "cl6_MYD88_KO_1172_EF74878426.ab1",
        "cl7_MYD88_KO_1172_EF74878427.ab1",
        "cl9_MYD88_KO_1172_EF74878428.ab1"
      ];
      const loaded = await Promise.all(
        mydFiles.map(async (name) => {
          const buffer = await fetchTraceAsset(`/drive_data/myd88/${name}`);
          return {
            name,
            buffer,
            isControl: name.includes("wt")
          };
        })
      );

      const spec = await fetchQcSpecAsset("/drive_data/spec_BIHi005-A_wt_1172_EF74668951.ab1.json");
      setDemoSpec(spec);
      setUploadedFiles(loaded);
      setAnalysisResults([]);
      setSelectedResult(null);
      setSelectedFigureSvg(null);
      onUpdateProject({ qcResults: [] });
    } catch (e) {
      setError("Failed to load MYD88 Drive data: " + e.message);
    }
  };

  // Load real APOE R176C Drive dataset
  const handleLoadApoeDriveData = async () => {
    setError(null);
    try {
      const apoeFiles = [
        "BIHi005-A_wt_1124_EF74344326.ab1",
        "IHi005-A_APOE_R176C_1_EF74668923.ab1",
        "IHi005-A_APOE_R176C_4_EF74668926.ab1",
        "IHi005-A_APOE_R176C_5_EF74668927.ab1",
        "IHi005-A_APOE_R176C_6_EF74668928.ab1",
        "IHi005-A_APOE_R176C_7_EF74668929.ab1",
        "IHi005-A_APOE_R176C_9_EF74668931.ab1",
        "IHi005-A_APOE_R176C_10_EF74668932.ab1",
        "IHi005-A_APOE_R176C_11_EF74668933.ab1",
        "IHi005-A_APOE_R176C_12_EF74668934.ab1",
        "IHi005-A_APOE_R176C_13_EF74668935.ab1",
        "IHi005-A_APOE_R176C_14_EF74668936.ab1",
        "IHi005-A_APOE_R176C_17_EF74668939.ab1",
        "IHi005-A_APOE_R176C_19_EF74668941.ab1",
        "IHi005-A_APOE_R176C_20_EF74668942.ab1"
      ];
      const loaded = await Promise.all(
        apoeFiles.map(async (name) => {
          const buffer = await fetchTraceAsset(`/drive_data/apoe/${name}`);
          return {
            name,
            buffer,
            isControl: name.includes("wt")
          };
        })
      );

      const spec = await fetchQcSpecAsset("/drive_data/spec_BIHi005-A_wt_1124_EF74344326.ab1.json");
      setDemoSpec(spec);
      setUploadedFiles(loaded);
      setAnalysisResults([]);
      setSelectedResult(null);
      setSelectedFigureSvg(null);
      onUpdateProject({ qcResults: [] });
    } catch (e) {
      setError("Failed to load APOE Drive data: " + e.message);
    }
  };

  // Prepare design spec from currentProject if available
  const getQcSpec = () => {
    if (currentProject?.designResult) {
      try {
        return buildQcDesignSpec(currentProject.designResult);
      } catch (e) {
        console.warn("Failed to build QC design spec from result:", e);
      }
    }
    return null;
  };

  const qcSpec = getQcSpec();

  // Handle files drop / selection
  const handleFileDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.target.files || e.dataTransfer.files).filter(f => f.name.match(/\.(ab1|abi)$/i));
    if (files.length === 0) {
      setError("Please drop valid Sanger chromatogram (.ab1) files.");
      return;
    }
    setError(null);

    // Read buffers
    const loaded = await Promise.all(
      files.map(file => {
        return new Promise(resolve => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              buffer: reader.result,
              isControl: looksLikeControl(file.name)
            });
          };
          reader.readAsArrayBuffer(file);
        });
      })
    );

    setUploadedFiles(prev => [...prev, ...loaded]);
  };

  // Run Batch Analysis
  const handleRunQc = () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one .ab1 trace file.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Find control trace
      const controlFile = uploadedFiles.find(f => f.isControl) || uploadedFiles[0];
      const editedFiles = uploadedFiles.filter(f => f !== controlFile);

      if (editedFiles.length === 0) {
        throw new Error("Need at least one edited trace file and one control (WT) trace file.");
      }

      const controlTrace = parseAbif(controlFile.buffer, controlFile.name);

      const specToUse = demoSpec || qcSpec || {
        reference: { sequence: controlTrace.basecalls || "" },
        design: { editKind: currentProject?.editType === "ko" ? "knockout" : "snp" },
        guides: (currentProject?.designResult?.guides || currentProject?.designResult?.gs || []).map((g, i) => ({
          name: `gRNA${i + 1}`,
          spacer: g.spacer || g.sp || g.sequence,
          strand: g.strand || "+",
          cut: g.cut || 100
        }))
      };

      const results = [];
      const workflow = demoSpec?.design?.editKind || (currentProject?.editType === "ko" ? "knockout" : "snp");

      for (let i = 0; i < editedFiles.length; i++) {
        const ef = editedFiles[i];
        const editedTrace = parseAbif(ef.buffer, ef.name);

        const sampleResult = analyseSample({
          name: ef.name.replace(/\.[^/.]+$/, ""),
          spec: specToUse,
          control: controlTrace,
          edited: editedTrace,
          sampleType: "clone",
          options: {}
        });

        const decision = decide(workflow, sampleResult, { goal: currentProject?.goal || "any" });
        results.push({
          ...sampleResult,
          fileName: ef.name,
          decision,
          workflow
        });
      }

      // Add clone recommendations
      const rankedResults = withRecommendations(results, { panel: 6 });

      setAnalysisResults(rankedResults);
      if (rankedResults.length > 0) {
        setSelectedResult(rankedResults[0]);
        generateFigure(rankedResults[0], controlFile, editedFiles[0], specToUse, workflow);
      }

      onUpdateProject({ qcResults: rankedResults });
    } catch (err) {
      setError(err.message || "Failed to analyze traces.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateFigure = (res, ctrlFile, editFile, spec, workflow) => {
    try {
      const cTrace = parseAbif(ctrlFile.buffer, ctrlFile.name);
      const eTrace = parseAbif(editFile.buffer, editFile.name);
      const fig = chromatogramFigure({
        name: res.name,
        controlTrace: cTrace,
        editedTrace: eTrace,
        spec,
        sampleType: "clone",
        workflow,
        options: {}
      });
      if (fig?.svg) setSelectedFigureSvg(fig.svg);
    } catch (e) {
      console.warn("Figure generation failed:", e);
    }
  };

  const handleSelectClone = (r) => {
    if (!r) return;
    setSelectedResult(r);
    const editFile = uploadedFiles.find(f => f.name === r.fileName || f.name.replace(/\.[^/.]+$/, "") === r.name) || uploadedFiles.filter(f => !f.isControl)[0];
    const controlFile = uploadedFiles.find(f => f.isControl) || uploadedFiles[0];
    if (controlFile && editFile) {
      generateFigure(r, controlFile, editFile, demoSpec || qcSpec, r.workflow);
    }
  };

  const downloadQcReport = () => {
    if (!analysisResults.length) return;
    const workflow = demoSpec?.design?.editKind || (currentProject?.editType === "ko" ? "knockout" : "snp");
    const gene = currentProject?.gene || demoSpec?.design?.gene || "CRISPR";
    const html = buildQcReportHtml({
      title: `${gene} Sanger Trace QC Report`,
      workflow,
      design: demoSpec?.design?.label || `${gene} Genome Edit`,
      results: analysisResults,
      notes: [
        "100% client-side trace deconvolution computed by Assured Studio.",
        "Sanger traces cannot exclude large deletions on the unamplified allele; protein loss/gain must be verified downstream."
      ]
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${gene.toLowerCase()}_sanger_qc_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadQcCsv = () => {
    if (!analysisResults.length) return;
    const workflow = demoSpec?.design?.editKind || (currentProject?.editType === "ko" ? "knockout" : "snp");
    const gene = currentProject?.gene || demoSpec?.design?.gene || "CRISPR";
    const csv = buildResultsCsv(workflow, analysisResults);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${gene.toLowerCase()}_qc_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFigureSvg = () => {
    if (!selectedFigureSvg || !selectedResult) return;
    const blob = new Blob([selectedFigureSvg], { type: "image/svg+xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedResult.name}_aligned_chromatogram.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDecisionBadge = (decisionObj) => {
    const val = (typeof decisionObj === "string" ? decisionObj : decisionObj?.decision || decisionObj?.verdict || "unknown").toLowerCase();
    if (val === "accept") return <span className="badge badge-ready"><CheckCircle size={14} /> ACCEPT</span>;
    if (val === "hold") return <span className="badge badge-review"><AlertTriangle size={14} /> HOLD / REVIEW</span>;
    if (val === "re-sequence") return <span className="badge badge-review" style={{ background: "#fef08a", color: "#854d0e" }}><AlertTriangle size={14} /> RE-SEQUENCE</span>;
    if (val === "reject") return <span className="badge badge-blocked"><XCircle size={14} /> REJECT</span>;
    return <span className="badge badge-blocked"><XCircle size={14} /> {val.toUpperCase()}</span>;
  };

  return (
    <div>
      {/* Top Controls Card */}
      <div className="card">
        <div className="card-title">
          <span>3. Sanger Trace Deconvolution & Clone Screening</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-secondary"
              onClick={handleLoadMyd88DriveData}
              style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
              title="Load real MYD88 dual-guide knockout clone traces from Drive"
            >
              ⚡ Load MYD88 KO Clones (Drive)
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleLoadApoeDriveData}
              style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
              title="Load real APOE R176C knockin clone traces from Drive"
            >
              ⚡ Load APOE R176C (Drive)
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleLoadDemoTraces}
              style={{ fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}
            >
              ⚡ Benchmark Traces
            </button>
            <button className="btn btn-secondary" onClick={onBackToDesign}>
              <ArrowLeft size={16} />
              <span>Back to Design</span>
            </button>
          </div>
        </div>

        {/* Dropzone */}
        <div
          className="dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById("trace-file-input").click()}
        >
          <UploadCloud size={44} style={{ color: "var(--primary)", margin: "0 auto 1rem" }} />
          <h3>Drag and drop .ab1 Sanger traces here</h3>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Controls (WT / Parental) and clone traces are paired automatically by filename.
          </p>
          <input
            id="trace-file-input"
            type="file"
            multiple
            accept=".ab1,.abi"
            onChange={handleFileDrop}
            style={{ display: "none" }}
          />
        </div>

        {/* File List & Run Bar */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Loaded <strong>{uploadedFiles.length}</strong> chromatogram files (
              {uploadedFiles.filter(f => f.isControl).length} wild-type controls,{" "}
              {uploadedFiles.filter(f => !f.isControl).length} edited clones)
            </span>

            <button
              className="btn btn-primary"
              onClick={handleRunQc}
              disabled={isAnalyzing}
            >
              <Play size={16} />
              <span>{isAnalyzing ? "Deconvolving Traces..." : "Run Trace Deconvolution"}</span>
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "#fca5a5" }}>
            {error}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysisResults.length > 0 && (
        <>
          {/* Summary Stats Strip */}
          <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
            <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>
                {analysisResults.filter(r => (r.decision?.decision || r.decision?.verdict) === "accept").length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clones Accepted</div>
            </div>
            <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--warning)" }}>
                {analysisResults.filter(r => {
                  const d = r.decision?.decision || r.decision?.verdict;
                  return d === "hold" || d === "re-sequence";
                }).length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clones on Hold / Review</div>
            </div>
            <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-dim)" }}>
                {analysisResults.filter(r => (r.decision?.decision || r.decision?.verdict) === "reject").length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clones Rejected (WT / Off-Target)</div>
            </div>
          </div>

          {/* 96-Well Plate QC Heatmap */}
          <PlateView
            traces={uploadedFiles}
            results={analysisResults}
            selectedResult={selectedResult}
            onSelectResult={handleSelectClone}
          />

          {/* Results Table & Recommendation */}
          <div className="card">
            <div className="card-title">
              <span>Clone Deconvolution Table & Prioritization</span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className="btn btn-secondary"
                  onClick={downloadQcReport}
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  title="Download standalone interactive HTML QC report"
                >
                  <FileText size={15} />
                  <span>HTML Report</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={downloadQcCsv}
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  title="Download quantitative deconvolution results CSV"
                >
                  <Download size={15} />
                  <span>Results CSV</span>
                </button>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Clone / Sample</th>
                  <th>Decision</th>
                  <th>Intended Edit (HDR %)</th>
                  <th>Blocking-Only %</th>
                  <th>Frameshift / Indels</th>
                  <th>Wild-Type %</th>
                  <th>Priority Rank</th>
                </tr>
              </thead>
              <tbody>
                {analysisResults.map((r, idx) => {
                  const s = r.summary || {};
                  const hdrPct = s.intendedEditPct !== undefined ? s.intendedEditPct : (r.intendedEditFraction !== undefined ? Math.round(r.intendedEditFraction * 100) : 0);
                  const blockPct = s.partialConversionPct !== undefined ? s.partialConversionPct : (r.blockingOnlyFraction !== undefined ? Math.round(r.blockingOnlyFraction * 100) : 0);
                  const indelPct = s.betweenCutsPct !== undefined ? s.betweenCutsPct : (s.indelPct !== undefined ? s.indelPct : (s.koScorePct !== undefined ? s.koScorePct : 0));
                  const wtPct = s.wtPct !== undefined ? s.wtPct : (r.wildTypeFraction !== undefined ? Math.round(r.wildTypeFraction * 100) : 0);
                  const rank = r.recommendation?.rank || r.rank;

                  return (
                    <tr
                      key={idx}
                      onClick={() => handleSelectClone(r)}
                      style={{ cursor: "pointer", background: selectedResult === r ? "rgba(56, 189, 248, 0.08)" : undefined }}
                    >
                      <td>
                        <strong>{r.name}</strong>
                        {r.genotype?.summary && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                            {r.genotype.summary}
                          </div>
                        )}
                        {r.decision?.reasons?.length > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>
                            {r.decision.reasons[0]}
                          </div>
                        )}
                      </td>
                      <td>{getDecisionBadge(r.decision)}</td>
                      <td style={{ color: "var(--success)", fontWeight: 600 }}>
                        {r.workflow === "knockout" || r.workflow === "deletion" ? `${s.koScorePct ?? 100}% (KO)` : `${hdrPct}%`}
                      </td>
                      <td style={{ color: "var(--warning)" }}>
                        {blockPct}%
                      </td>
                      <td>
                        {indelPct}%
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {wtPct}%
                      </td>
                      <td>
                        {rank ? <span className="badge badge-ready">Top #{rank}</span> : <span style={{ color: "var(--text-dim)" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Clone Chromatogram Figure */}
          {selectedFigureSvg && (
            <div className="card">
              <div className="card-title">
                <span>Aligned Chromatogram: {selectedResult?.name} vs Wild-Type Control</span>
                <button
                  className="btn btn-secondary"
                  onClick={downloadFigureSvg}
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  title="Download publication-quality vector SVG figure"
                >
                  <Download size={14} />
                  <span>Download SVG</span>
                </button>
              </div>
              <div
                style={{ overflowX: "auto", background: "#fff", padding: "1.5rem", borderRadius: "8px" }}
                dangerouslySetInnerHTML={{ __html: selectedFigureSvg }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
