import React, { useMemo } from 'react';
import ProvenancePanel from '@assured/provenance/ui';
import BlockchainPanel from '@assured/provenance/blockchain-ui';
import { passportReadiness, workflowDefaults, workflowSnapshots, validateWorkflowEvidence } from '../../services/passportWorkflow.js';

function downloadSnapshot(snapshot) {
  const url = URL.createObjectURL(new Blob([snapshot.text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = snapshot.name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function historyWith(project, certificate) {
  const history = project.fairPassports || [];
  return history.some(c => c.recordSha256 === certificate.recordSha256) ? history : [...history, certificate];
}
export function WorkflowPassport({ currentProject, onUpdateProject }) {
  const missing = passportReadiness(currentProject);
  const snapshots = useMemo(() => {
    try { return workflowSnapshots(currentProject); } catch { return []; }
  }, [currentProject]);
  const attachments = useMemo(() => snapshots.map(snapshot => ({ role: snapshot.role,
    file: new File([snapshot.text], snapshot.name, { type: 'application/json' }) })), [snapshots]);
  return <section className="card" aria-labelledby="workflow-passport-heading">
    <h2 id="workflow-passport-heading">5. FAIR Passport</h2>
    <p>Record clone lineage and bind the active design, experiment settings, QC results and original trace fingerprints in one portable passport. Files stay on your device.</p>
    {missing.length > 0 ? <p role="status">Still needed to create a workflow passport: {missing.join('; ')}. Auditor mode remains available to verify an existing passport.</p> : <p>Design and QC evidence are ready. Reattach all original traces below so their bytes can be checked against the captured analysis run.</p>}
    <p>Analysis snapshots contain all designs, guides, donor details and clone results available to the run. The passport’s selected spacer and editing fraction are additional user-reported fields; they do not replace the recorded engine output.</p>
    <div className="project-controls">{snapshots.map(snapshot => <button className="btn btn-secondary" key={snapshot.name} type="button" onClick={() => downloadSnapshot(snapshot)}>Download {snapshot.name}</button>)}</div>
    <ProvenancePanel key={currentProject.id} source="Assured Hub Bench" passportOptions={{
      defaults: workflowDefaults(currentProject), initialPassports: currentProject.fairPassports || [],
      workflowAttachments: attachments, validateEvidence: (files, input) => validateWorkflowEvidence(currentProject, files, input),
      renderAnchor: certificate => <BlockchainPanel key={certificate.recordSha256} certificate={certificate}
        initialProofs={currentProject.fairChainProofs || []}
        initialSubmission={currentProject.fairAnchorSubmissions?.[certificate.recordSha256] || ''}
        onSubmitted={hash => onUpdateProject(project => ({
          fairPassports: historyWith(project, certificate),
          fairAnchorSubmissions: { ...(project.fairAnchorSubmissions || {}), [certificate.recordSha256]: hash },
        }))}
        onProofCreated={proof => onUpdateProject(project => ({
          fairPassports: historyWith(project, certificate),
          fairChainProofs: [...(project.fairChainProofs || []).filter(p => p.recordSha256 !== proof.recordSha256), proof],
        }))} />,
      onPassportCreated: cert => onUpdateProject(project => ({ fairPassports: historyWith(project, cert) })),
    }} />
    <p>Save retains passport history in this browser’s experiment storage. Export carries history in the portable .assured file. Historical passports describe their original snapshots and never silently update after a design or QC change. Keep snapshot downloads with each passport.</p>
  </section>;
}
