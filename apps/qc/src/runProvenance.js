import { sha256 } from '@assured/provenance';

// Hash the same buffers supplied to the workers. No raw bytes cross the Bench bridge.
export async function captureRunProvenance(tasks, buffers, parameters) {
  const names = [...new Set(tasks.flatMap(task => [...task.controls, ...task.edited]))];
  const inputs = [];
  for (const name of names) {
    const bytes = buffers.get(name);
    if (!(bytes instanceof ArrayBuffer)) throw new Error(`Missing original bytes for ${name}.`);
    inputs.push({ fileName: name, fileSize: bytes.byteLength, sha256: await sha256(bytes) });
  }
  return { schema: 'assured-qc-run-provenance/1', timestampUtc: new Date().toISOString(),
    engine: { name: 'Assured QC', version: '0.5.2' }, inputs, parameters,
    tasks: tasks.map(task => ({ name: task.name, controls: task.controls, edited: task.edited,
      workflow: task.workflow, sampleType: task.sampleType, spec: task.spec })) };
}
