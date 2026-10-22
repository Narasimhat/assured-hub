import { canonical, sha256 } from '@assured/provenance';
import { checkPassport } from '@assured/provenance/passport';
import { buildQcDesignSpec } from '../engine/design/qcExport.js';

export function workflowDesign(project) {
  if (project.qcRunProvenance?.tasks?.length) return {
    text: JSON.stringify({ schema: 'assured-bench-analysis-design/1', tasks: project.qcRunProvenance.tasks }, null, 2),
    source: 'Actual QC task specifications (including any manual overrides)',
  };
  if (project.qcImportedDesignText) return { text: project.qcImportedDesignText, source: project.qcDesignSource || 'QC imported design' };
  const spec = project.qcDesignSpec || (project.designResult ? buildQcDesignSpec(project.designResult) : null);
  return spec ? { text: JSON.stringify(spec, null, 2), source: 'Bench design' } : null;
}
export function workflowSnapshots(project) {
  const design = workflowDesign(project);
  const snapshots = [];
  if (design) snapshots.push({ role: 'design', name: 'bench-design.json', text: design.text });
  // Use explicit fields so passport history and unrelated future fields never hash themselves.
  const experiment = { schema: 'assured-bench-snapshot/1', id: project.id, name: project.name,
    gene: project.gene, editType: project.editType, mutation: project.mutation, tag: project.tag,
    reference: project.genbankRaw, geneMeta: project.geneMeta, options: project.options,
    homologyArmLength: project.homologyArmLength, plannedDesign: project.designResult || null, designSource: design?.source || null };
  snapshots.push({ role: 'analysis', name: 'bench-experiment.json', text: JSON.stringify(experiment, null, 2) });
  if (project.qcResults?.length) snapshots.push({ role: 'analysis', name: 'bench-qc-analysis.json',
    text: JSON.stringify({ schema: 'assured-bench-qc-snapshot/1', provenance: project.qcRunProvenance || null, results: project.qcResults }, null, 2) });
  return snapshots;
}
export function passportReadiness(project) {
  const missing = [];
  try { if (!workflowDesign(project)) missing.push('active Design or imported QC design'); } catch { missing.push('valid exportable design'); }
  if (!project.qcResults?.some(r => r.ok)) missing.push('at least one successful QC result');
  const run = project.qcRunProvenance;
  if (run?.schema !== 'assured-qc-run-provenance/1' || !run.inputs?.length || !run.tasks?.length) missing.push('QC run with captured original-file fingerprints (rerun older analyses)');
  return missing;
}
export function workflowDefaults(project) {
  return { targetLocus: project.gene || '', tool: 'Assured QC', toolVersion: project.qcRunProvenance?.engine?.version || '',
    strategy: ['knockout', 'deletion'].includes(project.qcRunProvenance?.tasks?.[0]?.workflow) ? 'Indel knockout' : 'HDR knock-in',
    parameters: JSON.stringify(project.qcRunProvenance?.parameters || {}, null, 2) };
}
export async function validateWorkflowEvidence(project, attachments, input) {
  const missing = passportReadiness(project);
  if (missing.length) throw new Error('Before minting: ' + missing.join('; ') + '.');
  // Prevent an unrelated file being presented as the raw evidence for this run.
  const runGuides = project.qcRunProvenance.tasks.flatMap(task => task.spec?.guides || []).map(g => (g.spacer || g.sequence || '').toUpperCase()).filter(Boolean);
  if (runGuides.length && !runGuides.includes(String(input.spacer || '').trim().toUpperCase())) throw new Error('The selected passport spacer must be a guide used in the captured QC design.');
  const uploaded = attachments.filter(a => a.role === 'raw-sequencing');
  const hashes = [];
  for (const { file } of uploaded) {
    if (file.size > 50 * 1024 * 1024) throw new Error('Each raw evidence file must be at most 50 MB.');
    hashes.push({ sha256: await sha256(await file.arrayBuffer()), size: file.size });
  }
  for (const recorded of project.qcRunProvenance.inputs) {
    if (!hashes.some(h => h.sha256 === recorded.sha256 && h.size === recorded.fileSize)) throw new Error(`Attach the original analysed file: ${recorded.fileName}. Renamed files are accepted when their bytes match.`);
  }
  if (input.tool !== 'Assured QC' || input.toolVersion !== project.qcRunProvenance.engine.version || canonical(JSON.parse(input.parameters)) !== canonical(project.qcRunProvenance.parameters)) throw new Error('Analysis tool, version and parameters must match the captured QC run.');
}
export async function validateStoredPassports(project) {
  for (const cert of project.fairPassports || []) await checkPassport(cert);
  return project;
}
