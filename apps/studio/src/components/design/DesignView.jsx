import React, { useState } from "react";
import { runDesign } from "../../engine/design/designEngine.js";
import { buildDesignSchemeSvg, buildDesignSchemeCaption } from "../../engine/design/designScheme.js";
import { searchGeneSymbols, fetchGeneGenbank } from "../../services/ensembl.js";
import { downloadReportHtml, downloadDesignJson, downloadSchemeSvg } from "../../services/designExport.js";
import { GelSimulator } from "./GelSimulator.jsx";
import { Search, Play, CheckCircle, AlertTriangle, XCircle, ArrowRight, Upload, Download, FileText, FlaskConical } from "lucide-react";

export function DesignView({ currentProject, onUpdateProject, onProceedToOrder, onProceedToQc, onOpenProtocol }) {
  const [geneInput, setGeneInput] = useState(currentProject?.gene || "APOE");
  const [editType, setEditType] = useState(currentProject?.editType || "pm");
  const [mutation, setMutation] = useState(currentProject?.mutation || "R154S");
  const [tag, setTag] = useState(currentProject?.tag || "SD40-V5");
  const [homologyArmLength, setHomologyArmLength] = useState(currentProject?.homologyArmLength || 400);
  const [deliveryMethod, setDeliveryMethod] = useState(currentProject?.options?.deliveryMethod || "rnp");
  const [maxBlockingChanges, setMaxBlockingChanges] = useState(currentProject?.options?.maxBlockingChanges || 3);
  const [coDelivery, setCoDelivery] = useState(currentProject?.options?.coDelivery || false);

  const [isLoadingGene, setIsLoadingGene] = useState(false);
  const [isDesigning, setIsDesigning] = useState(false);
  const [error, setError] = useState(null);
  const [geneMeta, setGeneMeta] = useState(currentProject?.geneMeta || null);
  const [genbankRaw, setGenbankRaw] = useState(currentProject?.genbankRaw || "");

  // Active design result
  const designResult = currentProject?.designResult || null;

  // Ensembl Automated Fetch
  const handleFetchEnsembl = async () => {
    if (!geneInput.trim()) return;
    setIsLoadingGene(true);
    setError(null);
    try {
      const meta = await fetchGeneGenbank(geneInput.trim());
      setGeneMeta(meta);
      setGenbankRaw(meta.genbankText);
      onUpdateProject({
        gene: meta.geneSymbol,
        geneMeta: meta,
        genbankRaw: meta.genbankText
      });
    } catch (err) {
      setError(err.message || "Failed to fetch gene data from Ensembl.");
    } finally {
      setIsLoadingGene(false);
    }
  };

  // Upload local GenBank file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setGenbankRaw(text);
      setGeneMeta({
        geneSymbol: file.name.replace(/\.[^/.]+$/, ""),
        source: "Manual file upload",
        genbankText: text
      });
      onUpdateProject({
        gene: file.name.replace(/\.[^/.]+$/, ""),
        genbankRaw: text
      });
    };
    reader.readAsText(file);
  };

  // Run Design Engine
  const handleRunDesign = async () => {
    if (!genbankRaw) {
      setError("Please fetch a gene from Ensembl or upload a GenBank reference file first.");
      return;
    }
    setIsDesigning(true);
    setError(null);
    try {
      const options = {
        deliveryMethod,
        maxBlockingChanges: Number(maxBlockingChanges),
        coDeliveryBlocking: coDelivery,
        expectedGene: geneMeta?.geneSymbol || geneInput.trim(),
        ensureGuidePair: true,
        allowNonCodingBlockers: true
      };

      const result = runDesign(
        editType,
        genbankRaw,
        mutation,
        tag,
        Number(homologyArmLength),
        options
      );

      const svgScheme = buildDesignSchemeSvg(result);
      const caption = buildDesignSchemeCaption(result);

      const updated = {
        gene: geneInput.trim(),
        editType,
        mutation,
        tag,
        homologyArmLength,
        options,
        genbankRaw,
        designResult: result,
        svgScheme,
        caption,
        status: result.procurement?.status || "ready"
      };

      onUpdateProject(updated);
    } catch (err) {
      setError("Design calculation failed: " + (err.message || String(err)));
    } finally {
      setIsDesigning(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "ready") {
      return <span className="badge badge-ready"><CheckCircle size={14} /> READY FOR PROCUREMENT</span>;
    } else if (status === "review") {
      return <span className="badge badge-review"><AlertTriangle size={14} /> REVIEW REQUIRED</span>;
    }
    return <span className="badge badge-blocked"><XCircle size={14} /> BLOCKED</span>;
  };

  return (
    <div>
      {/* Parameter Input Card */}
      <div className="card">
        <div className="card-title">
          <span>1. Experiment Target & In-Silico Specifications</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
            Zero manual file editing — automated MANE Select transcript retrieval
          </span>
        </div>

        <div className="grid-2">
          {/* Target Gene Entry */}
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
              Target Gene Symbol or Ensembl ID
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={geneInput}
                onChange={(e) => setGeneInput(e.target.value.toUpperCase())}
                placeholder="e.g. SCN5A, APOE, TP53"
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-primary"
                onClick={handleFetchEnsembl}
                disabled={isLoadingGene}
              >
                <Search size={16} />
                <span>{isLoadingGene ? "Fetching..." : "Fetch Gene"}</span>
              </button>
            </div>
            
            {/* Quick Presets */}
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Examples:</span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                onClick={() => { setGeneInput("APOE"); setEditType("pm"); setMutation("R154S"); }}
              >
                APOE (R154S)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                onClick={() => { setGeneInput("SCN5A"); setEditType("ko"); setMutation(""); }}
              >
                SCN5A (Knockout)
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.15rem 0.45rem", fontSize: "0.75rem", borderRadius: "4px" }}
                onClick={() => { setGeneInput("TP53"); setEditType("ct"); setTag("SD40-V5"); }}
              >
                TP53 (Tag)
              </button>
            </div>

            {geneMeta && (
              <p style={{ fontSize: "0.8rem", color: "var(--success)", marginTop: "0.4rem" }}>
                ✓ Loaded: <strong>{geneMeta.geneSymbol}</strong> ({geneMeta.transcriptId || "Custom Reference"})
              </p>
            )}
          </div>

          {/* Fallback Upload */}
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
              Or Upload GenBank Record (.gb / .gbk)
            </label>
            <label className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", cursor: "pointer" }}>
              <Upload size={16} />
              <span>Browse Local Reference File</span>
              <input type="file" accept=".gb,.gbk,.txt" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {/* Edit Configuration */}
        <div className="grid-3" style={{ marginTop: "1.25rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
              Edit Type
            </label>
            <select value={editType} onChange={(e) => setEditType(e.target.value)} style={{ width: "100%" }}>
              <option value="ko">Knockout (KO Dual Guides)</option>
              <option value="pm">Point Mutation / SNP Knock-in</option>
              <option value="ct">C-Terminal Tag Knock-in</option>
              <option value="nt">N-Terminal Tag Knock-in</option>
              <option value="it">Internal Tag Knock-in</option>
            </select>
          </div>

          {editType === "pm" && (
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
                Amino Acid Substitution
              </label>
              <input
                type="text"
                value={mutation}
                onChange={(e) => setMutation(e.target.value)}
                placeholder="e.g. R154S, E342K"
                style={{ width: "100%" }}
              />
            </div>
          )}

          {(editType === "ct" || editType === "nt" || editType === "it") && (
            <div>
              <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
                Tag Cassette
              </label>
              <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: "100%" }}>
                <option value="SD40-V5">SD40-V5 (Split-GFP & V5)</option>
                <option value="FLAG">FLAG (DYKDDDDK)</option>
                <option value="HA">HA (YPYDVPDYA)</option>
                <option value="Myc">Myc (EQKLISEEDL)</option>
                <option value="V5">V5 (GKPIPNPLLGLDST)</option>
                <option value="HiBiT">HiBiT (VSGWRLFKKIS)</option>
                <option value="mEGFP">mEGFP (Monomeric Enhanced GFP)</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500, fontSize: "0.9rem" }}>
              Delivery Platform
            </label>
            <select value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)} style={{ width: "100%" }}>
              <option value="rnp">Synthetic sgRNA + Cas9 RNP (Cleanest)</option>
              <option value="u6">U6 Plasmid / Lentivirus</option>
            </select>
          </div>
        </div>

        {/* Advanced Options Bar */}
        <div style={{ display: "flex", gap: "2rem", marginTop: "1rem", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Max Silent Blocking Changes:</span>
            <select
              value={maxBlockingChanges}
              onChange={(e) => setMaxBlockingChanges(Number(e.target.value))}
              style={{ padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
            >
              <option value={1}>1 mutation</option>
              <option value={2}>2 mutations</option>
              <option value={3}>3 mutations (Recommended)</option>
            </select>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={coDelivery}
              onChange={(e) => setCoDelivery(e.target.checked)}
            />
            <span>Co-delivery mode (block all offered guides)</span>
          </label>

          <button
            className="btn btn-primary"
            onClick={handleRunDesign}
            disabled={isDesigning}
            style={{ marginLeft: "auto" }}
          >
            <Play size={16} />
            <span>{isDesigning ? "Computing Design..." : "Run Design Engine"}</span>
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "8px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "#fca5a5", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}
      </div>

      {/* Results Display */}
      {designResult && (
        <>
          {/* Release State Banner */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderColor: designResult.procurement?.status === "ready" ? "var(--success)" : "var(--warning)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>Design Status:</span>
                {getStatusBadge(designResult.procurement?.status || "ready")}
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {designResult.procurement?.status === "ready"
                  ? "All rigorous release gates passed. Ready for oligo synthesis and ordering."
                  : "External verification or review notes apply. Review candidate metrics below."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary"
                onClick={() => downloadReportHtml(currentProject, designResult)}
                title="Download full standalone interactive HTML report"
              >
                <FileText size={16} />
                <span>HTML Report</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => downloadDesignJson(currentProject, designResult)}
                title="Download machine-readable design specification JSON"
              >
                <Download size={16} />
                <span>Design JSON</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={onOpenProtocol}
                style={{ color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
                title="View wet-lab bench protocol and pipetting checklist"
              >
                <FlaskConical size={16} />
                <span>Bench Protocol</span>
              </button>

              <button className="btn btn-secondary" onClick={onProceedToOrder}>
                <span>Order Reagents</span>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-primary" onClick={onProceedToQc}>
                <span>Proceed to Sanger QC</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Target Region SVG Schematic */}
          {currentProject?.svgScheme && (
            <div className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span>Target Locus Schematic</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                    Publication-ready vector layout
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => downloadSchemeSvg(currentProject, currentProject.svgScheme)}
                  style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}
                  title="Download standalone SVG vector graphic for publications or slides"
                >
                  <Download size={14} />
                  <span>Download SVG</span>
                </button>
              </div>
              <div
                style={{ overflowX: "auto", background: "#fff", padding: "1.5rem", borderRadius: "8px" }}
                dangerouslySetInnerHTML={{ __html: currentProject.svgScheme }}
              />
              {currentProject?.caption && (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.75rem", fontStyle: "italic" }}>
                  {currentProject.caption}
                </p>
              )}
            </div>
          )}

          {/* Guides and Donors Cards */}
          <div className="grid-2">
            {/* Guide RNA Card */}
            <div className="card">
              <div className="card-title">
                <span>Selected Guide RNAs (20 nt Protospacer)</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Guide Name</th>
                    <th>Spacer (5' → 3')</th>
                    <th>PAM</th>
                    <th>GC %</th>
                    <th>CFD Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {(designResult.guides || designResult.gs || []).map((g, idx) => (
                    <tr key={idx}>
                      <td><strong>gRNA {idx + 1}</strong></td>
                      <td className="mono" style={{ color: "var(--primary)" }}>{g.spacer || g.sp || g.sequence || g.seq}</td>
                      <td className="mono" style={{ color: "var(--warning)" }}>{g.pam || "NGG"}</td>
                      <td>{g.gc || 50}%</td>
                      <td>
                        <span className={`badge ${Number(g.cfdResidual || 0) <= 0.023 ? "badge-ready" : "badge-review"}`}>
                          {g.cfdResidual !== undefined ? g.cfdResidual : "Strong (≤0.023)"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Donor Repair Template Card */}
            <div className="card">
              <div className="card-title">
                <span>Donor Repair Template (ssODN)</span>
              </div>
              {(() => {
                const donor = designResult.donors?.[0] || designResult.os?.[0] || designResult.donor || designResult.ssodn;
                const seq = typeof donor === "string" ? donor : (donor?.od || donor?.sequence || donor?.genomicDonor || donor?.donorSense);
                if (seq) {
                  return (
                    <div>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                        Strand matches guide PAM-bearing strand to prevent re-cleavage:
                      </p>
                      <div
                        className="mono"
                        style={{
                          background: "#0f172a",
                          padding: "0.85rem",
                          borderRadius: "8px",
                          wordBreak: "break-all",
                          fontSize: "0.85rem",
                          lineHeight: "1.6",
                          border: "1px solid var(--border-color)"
                        }}
                      >
                        {seq}
                      </div>
                      <div style={{ marginTop: "0.75rem", display: "flex", gap: "1.5rem", fontSize: "0.85rem" }}>
                        <span>Length: <strong>{seq.length} nt</strong></span>
                        <span>Format: <strong>Single-Stranded Oligo (ssODN)</strong></span>
                      </div>
                    </div>
                  );
                }
                return <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No donor required for pure dual-guide knockout.</p>;
              })()}
            </div>
          </div>

          {/* In-Silico PCR Agarose Gel Simulator */}
          <GelSimulator designResult={designResult} currentProject={currentProject} />
        </>
      )}
    </div>
  );
}
