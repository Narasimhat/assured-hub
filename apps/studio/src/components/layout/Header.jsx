import React from "react";
import { Dna, Save, FolderOpen, Download, Upload, Plus, FlaskConical } from "lucide-react";

export function Header({
  activeStep,
  setActiveStep,
  currentProject,
  onNewProject,
  onSaveProject,
  onOpenProjects,
  onOpenProtocol,
  onExportBundle,
  onImportBundle
}) {
  const steps = [
    { id: "design", label: "1. Design" },
    { id: "order", label: "2. Order" },
    { id: "qc", label: "3. Trace Analysis" },
    { id: "decision", label: "4. Select clones" }
  ];

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Dna size={20} />
        </div>
        <div>
          <a className="brand-title" href="../" title="ASSURED home" style={{ textDecoration: "none" }}>ASSURED Bench</a>
          <span className="brand-badge">v1.0</span>
        </div>
      </div>

      {/* Stepper Navigation */}
      <nav className="stepper-container" aria-label="Experiment workflow">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            aria-current={activeStep === s.id ? "step" : undefined}
            onClick={() => setActiveStep(s.id)}
            className={`step-btn ${activeStep === s.id ? "active" : ""}`}
          >
            <span className="step-num">{idx + 1}</span>
            <span>{s.label.split(". ")[1]}</span>
          </button>
        ))}
      </nav>

      {/* Project Controls */}
      <div className="project-controls">
        <button
          className="btn btn-secondary"
          onClick={onOpenProtocol}
          title="View wet-lab bench protocol and pipetting checklist"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", color: "#38bdf8", borderColor: "rgba(56, 189, 248, 0.4)" }}
        >
          <FlaskConical size={16} />
          <span>Bench Protocol</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onNewProject}
          title="Start a new experiment"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          <Plus size={16} />
          <span>New</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenProjects}
          title="Open saved experiments"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          <FolderOpen size={16} />
          <span>Projects</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onSaveProject}
          title="Save experiment locally"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          <Save size={16} />
          <span>Save</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onExportBundle}
          title="Export .assured experiment bundle"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem" }}
        >
          <Download size={16} />
          <span>Export</span>
        </button>

        <label
          className="btn btn-secondary"
          title="Import .assured experiment bundle"
          style={{ padding: "0.45rem 0.85rem", fontSize: "0.85rem", cursor: "pointer", margin: 0 }}
        >
          <Upload size={16} />
          <span>Import</span>
          <input
            type="file"
            accept=".assured,.json"
            onChange={onImportBundle}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </header>
  );
}
