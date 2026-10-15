import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import QuickStart from "./QuickStart.jsx";
import "./styles.css";

function BenchEmbed() {
  const [initialDesign, setInitialDesign] = useState(null);
  const parentOrigin = import.meta.env.DEV ? "http://127.0.0.1:5180" : window.location.origin;
  useEffect(() => {
    const receive = event => {
      if (event.source !== window.parent || event.origin !== parentOrigin) return;
      if (event.data?.type === "assured:qc:design" && (event.data.design === null || typeof event.data.design?.text === "string")) setInitialDesign(event.data.design);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "assured:qc:ready" }, parentOrigin);
    return () => window.removeEventListener("message", receive);
  }, [parentOrigin]);
  const onResults = useCallback(payload => {
    window.parent.postMessage({ type: "assured:qc:results", ...payload }, parentOrigin);
  }, [parentOrigin]);
  return <div className="page"><h1>Trace Analysis</h1><p className="muted">Upload an Assured Design HTML report or JSON, then add AB1 files, a folder, or a sequencing ZIP. Review sample/control pairings before analysis. Files stay in your browser.</p><QuickStart initialDesign={initialDesign} onResults={onResults} /></div>;
}
createRoot(document.getElementById("root")).render(<BenchEmbed />);
