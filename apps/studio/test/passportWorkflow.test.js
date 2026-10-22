import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256 } from '@assured/provenance';
import { captureRunProvenance } from '../../qc/src/runProvenance.js';
import { passportReadiness, workflowSnapshots, validateWorkflowEvidence, validateStoredPassports, workflowDesign } from '../src/services/passportWorkflow.js';
import { createProject, updateProject, parseProject } from '../src/services/projectState.js';
const bytes = new TextEncoder().encode('original AB1 bytes');
const file = (data, name = 'renamed.ab1') => ({ name, size: data.byteLength, arrayBuffer: async () => data.buffer });
const task = {name:'clone',controls:['control.ab1'],edited:['clone.ab1'],workflow:'knockout',sampleType:'clone',spec:{guides:[{spacer:'A'.repeat(20)}]}};
const parameters = {nuclease:'SpCas9',goal:'homozygous'};
async function project() {
 const run = await captureRunProvenance([task],new Map([['control.ab1',bytes.buffer],['clone.ab1',bytes.buffer]]),parameters);
 return {...createProject(),gene:'APOE',qcResults:[{ok:true,name:'clone'}],qcRunProvenance:run};
}
test('capture fingerprints the exact worker input buffers and records effective task specs',async()=>{
 const p=await project();
 assert.equal(p.qcRunProvenance.inputs[0].sha256,await sha256(bytes));
 assert.deepEqual(p.qcRunProvenance.tasks[0].spec,task.spec);
 await assert.rejects(captureRunProvenance([task],new Map(),parameters),/Missing original/);
});
test('workflow refuses missing run evidence and checks originals by bytes rather than filename',async()=>{
 assert.ok(passportReadiness(createProject()).length);
 const p=await project();assert.deepEqual(passportReadiness(p),[]);
 const input={spacer:'A'.repeat(20),tool:'Assured QC',toolVersion:'0.5.2',parameters:JSON.stringify(parameters)};
 await validateWorkflowEvidence(p,[{role:'raw-sequencing',file:file(bytes)}],input);
 await assert.rejects(validateWorkflowEvidence(p,[{role:'raw-sequencing',file:file(new TextEncoder().encode('changed'))}],input),/original analysed/);
 await assert.rejects(validateWorkflowEvidence(p,[{role:'raw-sequencing',file:file(bytes)}],{...input,parameters:'{}'}),/must match/);
 await assert.rejects(validateWorkflowEvidence(p,[{role:'raw-sequencing',file:file(bytes)}],{...input,spacer:'C'.repeat(20)}),/guide used/);
 await assert.rejects(validateWorkflowEvidence({...p,qcRunProvenance:null},[],input),/rerun/);
});
test('snapshots use actual task designs and exclude passport history to prevent recursive or stale evidence',async()=>{
 const p=await project();p.qcImportedDesignText='an ignored old design';
 assert.match(workflowDesign(p).source,/Actual QC/);
 const a=workflowSnapshots(p);
 const b=workflowSnapshots({...p,fairPassports:[{record:{bogus:true}}]});
 assert.deepEqual(a,b);
 assert.equal(a.length,3);
 const changed=workflowSnapshots({...p,options:{deliveryMethod:'u6'}});
 assert.notEqual(a[1].text,changed[1].text);
});
test('new designs clear captured run provenance while historical passports persist; imports check their integrity',async()=>{
 const p=await project();p.fairPassports=[{record:{bogus:true}}];
 const next=updateProject(p,{gene:'TP53'});
 assert.equal(next.qcRunProvenance,null);
 assert.deepEqual(next.fairPassports,p.fairPassports);
 await assert.rejects(validateStoredPassports(p),/Invalid/);
 for (const patch of [{fairPassports:{}},{qcRunProvenance:[]}]) assert.throws(()=>parseProject(JSON.stringify({...createProject(),...patch})));
});
