import React, { useState, useEffect } from "react";
import { Header } from "./components/layout/Header.jsx";
import { DesignView } from "./components/design/DesignView.jsx";
import { OrderView } from "./components/order/OrderView.jsx";
import { QcView } from "./components/qc/QcView.jsx";
import { DecisionView } from "./components/qc/DecisionView.jsx";
import { saveProject, listProjects, getProject, deleteProject, exportProjectBundle } from "./services/storage.js";
import { ProtocolModal } from "./components/common/ProtocolModal.jsx";
import { X, Trash2, FolderOpen } from "lucide-react";

export function App() {
  const [activeStep, setActiveStep] = useState("design");
  const [currentProject, setCurrentProject] = useState({
    id: "proj_" + Date.now(),
    name: "APOE R154S Knock-in Experiment",
    gene: "APOE",
    editType: "pm",
    mutation: "R154S",
    tag: "SD40-V5",
    homologyArmLength: 400,
    options: {
      deliveryMethod: "rnp",
      maxBlockingChanges: 3,
      coDelivery: false
    },
    designResult: null,
    qcResults: []
  });

  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProjects = async () => {
    const list = await listProjects();
    setSavedProjects(list);
  };

  const handleUpdateProject = (fields) => {
    setCurrentProject(prev => ({
      ...prev,
      ...fields
    }));
  };

  const handleSave = async () => {
    await saveProject(currentProject);
    await loadProjects();
    showToast("Project successfully saved to local storage!");
  };

  const handleNewProject = () => {
    const fresh = {
      id: "proj_" + Date.now(),
      name: "New Genome Editing Experiment",
      gene: "",
      editType: "ko",
      mutation: "",
      tag: "FLAG",
      homologyArmLength: 400,
      options: {
        deliveryMethod: "rnp",
        maxBlockingChanges: 3,
        coDelivery: false
      },
      designResult: null,
      qcResults: []
    };
    setCurrentProject(fresh);
    setActiveStep("design");
    showToast("Started fresh experiment.");
  };

  const handleSelectProject = (proj) => {
    setCurrentProject(proj);
    setShowProjectsModal(false);
    showToast(`Loaded '${proj.name}'`);
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    await deleteProject(id);
    await loadProjects();
    showToast("Project deleted.");
  };

  const handleExport = () => {
    exportProjectBundle(currentProject);
    showToast("Exported .assured project file.");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.gene || parsed.designResult || parsed.qcResults) {
          setCurrentProject(parsed);
          await saveProject(parsed);
          await loadProjects();
          showToast(`Imported '${parsed.name || parsed.gene || "Experiment"}'!`);
        } else {
          showToast("Invalid .assured file format.");
        }
      } catch (err) {
        showToast("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        currentProject={currentProject}
        onNewProject={handleNewProject}
        onSaveProject={handleSave}
        onOpenProjects={() => setShowProjectsModal(true)}
        onOpenProtocol={() => setShowProtocolModal(true)}
        onExportBundle={handleExport}
        onImportBundle={handleImport}
      />

      {notification && (
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--primary)",
          color: "var(--text-main)",
          padding: "0.75rem 1.25rem",
          borderRadius: "8px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          zIndex: 100,
          fontSize: "0.9rem"
        }}>
          {notification}
        </div>
      )}

      <main className="app-container">
        {activeStep === "design" && (
          <DesignView
            currentProject={currentProject}
            onUpdateProject={handleUpdateProject}
            onProceedToOrder={() => setActiveStep("order")}
            onProceedToQc={() => setActiveStep("qc")}
            onOpenProtocol={() => setShowProtocolModal(true)}
          />
        )}

        {activeStep === "order" && (
          <OrderView
            currentProject={currentProject}
            onProceedToQc={() => setActiveStep("qc")}
            onOpenProtocol={() => setShowProtocolModal(true)}
          />
        )}

        {activeStep === "qc" && (
          <QcView
            currentProject={currentProject}
            onUpdateProject={handleUpdateProject}
            onBackToDesign={() => setActiveStep("design")}
          />
        )}

        {activeStep === "decision" && (
          <DecisionView currentProject={currentProject} />
        )}
      </main>

      {/* Saved Projects Modal */}
      {showProjectsModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100
        }}>
          <div className="card" style={{ width: "650px", maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FolderOpen size={20} style={{ color: "var(--primary)" }} />
                <h3>Saved Experiments ({savedProjects.length})</h3>
              </div>
              <button onClick={() => setShowProjectsModal(false)}>
                <X size={20} />
              </button>
            </div>

            {savedProjects.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
                No saved experiments yet. Click 'Save' in the header to save your work.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {savedProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      background: "#0f172a",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name || p.gene || "Unnamed Project"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Gene: <strong>{p.gene || "N/A"}</strong> | Edit: <strong>{p.editType}</strong> | Last updated: {new Date(p.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={(e) => handleDeleteProject(p.id, e)}
                      style={{ padding: "0.4rem 0.6rem", color: "var(--danger)" }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Experimental Bench Protocol & Checklist Modal */}
      <ProtocolModal
        isOpen={showProtocolModal}
        onClose={() => setShowProtocolModal(false)}
        currentProject={currentProject}
      />
    </div>
  );
}
