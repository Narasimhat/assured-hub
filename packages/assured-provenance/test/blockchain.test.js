import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeFunctionData, encodeAbiParameters, encodeEventTopics, keccak256, parseAbiParameters } from 'viem';
import { fields } from '../src/provenance.js';
import { mintPassport } from '../src/passport.js';
import { assertRegistry, connectSepoliaWallet, createChainProof, REGISTRY, REGISTRY_ABI, submitPassportAnchor, validateChainProofShape, verifyChainProof } from '../src/blockchain.js';
const runtime = fs.readFileSync(new URL('./fixtures/assured-registry-runtime.hex', import.meta.url), 'utf8');
const tx = '0x' + 'ab'.repeat(32), blockHash = '0x' + 'bc'.repeat(32), account = '0x' + '12'.repeat(20);
async function passport() {
  const input = {cloneId:'C04',parentalLine:'BIHi005-A',targetLocus:'APOE',assembly:'GRCh38',strategy:'HDR knock-in',spacer:'A'.repeat(20),efficiency:'',zygosity:'Not established',tool:'Assured QC',toolVersion:'0.5.2',parameters:'{}'};
  const metadata = Object.fromEntries(fields.map(([,k])=>[k,k==='accessUrl'?'https://example.org/access':'Documented v1']));
  const attachments=['design','analysis','raw-sequencing'].map(role=>({role,file:{name:role+'.txt',size:1,arrayBuffer:async()=>new Uint8Array([1]).buffer}}));
  return mintPassport(input,metadata,attachments,'test');
}
function setup(cert, changes = {}) {
  const event={id:3n,submitter:account,contentHash:'0x'+cert.recordSha256,step:REGISTRY.step,metadataURI:'',timestamp:1234567890n,...changes.event};
  const log={address:REGISTRY.address,topics:encodeEventTopics({abi:REGISTRY_ABI,eventName:'Logged',args:{id:event.id,submitter:event.submitter}}),data:encodeAbiParameters(parseAbiParameters('bytes32, string, string, uint256'),[event.contentHash,event.step,event.metadataURI,event.timestamp]),...changes.log};
  const receipt={status:'success',transactionHash:tx,to:REGISTRY.address,from:account,blockNumber:100n,blockHash,logs:[log],...changes.receipt};
  const requests=[];
  const client={getChainId:async()=>REGISTRY.chainId,getBytecode:async()=>runtime,getTransactionReceipt:async()=>receipt,getBlock:async()=>({hash:blockHash,timestamp:event.timestamp}),getBlockNumber:async()=>111n,readContract:async()=>[event.submitter,event.contentHash,event.step,event.metadataURI,event.timestamp],simulateContract:async r=>{requests.push(r);return {};},...changes.client};
  const provider={request:async r=>{requests.push(r); if(r.method==='eth_chainId')return '0xaa36a7';if(r.method==='eth_accounts'||r.method==='eth_requestAccounts')return [account];if(r.method==='eth_sendTransaction')return tx;throw new Error('Unexpected wallet method '+r.method);},...changes.provider};
  return {client,provider,requests};
}
test('registry runtime fixture pins the verified deployment, never an arbitrary contract', async()=>{
 assert.equal(keccak256(runtime),REGISTRY.runtimeCodeHash);
 const cert=await passport();await assertRegistry(setup(cert).client);
 for(const client of [{getChainId:async()=>1},{getBytecode:async()=>undefined},{getBytecode:async()=>'0x6000'}])await assert.rejects(assertRegistry(setup(cert,{client}).client));
});
test('wallet connection rejects missing provider, wrong network and missing account',async()=>{
 const cert=await passport();assert.equal(await connectSepoliaWallet(setup(cert).provider),account);
 await assert.rejects(connectSepoliaWallet());
 await assert.rejects(connectSepoliaWallet({request:async()=> '0x1'}),/Select Sepolia/);
 await assert.rejects(connectSepoliaWallet({request:async r=>r.method==='eth_chainId'?'0xaa36a7':[]}),/valid account/);
});
test('explicit submission sends only the passport digest, fixed step and empty metadata URI',async()=>{
 const cert=await passport(), before=JSON.stringify(cert), {client,provider,requests}=setup(cert);let submitted;
 assert.equal(await submitPassportAnchor(cert,{client,provider,onSubmitted:hash=>{submitted=hash;}}),tx);assert.equal(submitted,tx);
 const request=requests.find(r=>r.method==='eth_sendTransaction');assert.ok(request);
 const data=decodeFunctionData({abi:REGISTRY_ABI,data:request.params[0].data});
 assert.deepEqual(data.args,['0x'+cert.recordSha256,REGISTRY.step,'']);
 assert.equal(request.params[0].to.toLowerCase(),REGISTRY.address.toLowerCase());assert.equal(JSON.stringify(cert),before);
});
test('failed simulation, wrong chain, changed account and invalid passport cannot broadcast',async()=>{
 const cert=await passport();
 const failed=setup(cert,{client:{simulateContract:async()=>{throw new Error('simulation reverted');}}});
 await assert.rejects(submitPassportAnchor(cert,failed),/simulation/);assert.equal(failed.requests.some(r=>r.method==='eth_sendTransaction'),false);
 await assert.rejects(submitPassportAnchor(cert,{...setup(cert),expectedAccount:'0x'+'34'.repeat(20)}),/changed since connecting/);
 const wrong=setup(cert,{provider:{request:async()=> '0x1'}});await assert.rejects(submitPassportAnchor(cert,wrong),/network changed/);
 const changed=setup(cert);changed.client.simulateContract=async()=>{changed.provider.request=async r=>r.method==='eth_chainId'?'0xaa36a7':['0x'+'34'.repeat(20)];};
 await assert.rejects(submitPassportAnchor(cert,changed),/account or network changed/);
 const tampered=structuredClone(cert);tampered.record.cloneId='Other';await assert.rejects(submitPassportAnchor(tampered,setup(cert)),/integrity/);
});
test('confirmed canonical receipt, event and entry produce a portable independent sidecar',async()=>{
 const cert=await passport(),before=JSON.stringify(cert),{client}=setup(cert);const proof=await createChainProof(cert,tx,client);
 assert.equal(proof.entryId,'3');assert.equal(proof.blockNumber,'100');assert.equal(proof.recordSha256,cert.recordSha256);
 assert.deepEqual(await verifyChainProof(cert,JSON.parse(JSON.stringify(proof)),client),proof);assert.equal(JSON.stringify(cert),before);
});
test('receipt failure, wrong destination/hash and event mismatch fail closed',async()=>{
 const cert=await passport();
 for(const changes of [{receipt:{status:'reverted'}},{receipt:{to:account}},{receipt:{transactionHash:'0x'+'ff'.repeat(32)}},{event:{contentHash:'0x'+'ff'.repeat(32)}},{event:{step:'Design'}},{event:{metadataURI:'https://private.example/clone'}},{event:{submitter:'0x'+'34'.repeat(20)}},{log:{address:account}},{log:{removed:true}},{receipt:{logs:[]}}])await assert.rejects(createChainProof(cert,tx,setup(cert,changes).client));
});
test('insufficient confirmations, reorg, timestamp mismatch, missing receipt and ledger mismatch are unverified',async()=>{
 const cert=await passport();
 for(const client of [{getBlockNumber:async()=>110n},{getBlockNumber:async()=>99n},{getBlock:async()=>({hash:'0x'+'ff'.repeat(32),timestamp:1234567890n})},{getBlock:async()=>({hash:blockHash,timestamp:1n})},{getTransactionReceipt:async()=>{throw new Error('not mined');}},{readContract:async()=>[account,'0x'+'ff'.repeat(32),REGISTRY.step,'',1234567890n]}])await assert.rejects(createChainProof(cert,tx,setup(cert,{client}).client));
});
test('proof network, registry, passport and every on-chain field are checked rather than trusted',async()=>{
 const cert=await passport(),{client}=setup(cert),proof=await createChainProof(cert,tx,client);
 for(const patch of [{chainId:1},{contractAddress:account},{recordSha256:'ff'.repeat(32)},{transactionHash:'bad'},{submitter:'bad'},{entryId:'03'},{blockNumber:-1},{blockTimestamp:'-1'},{blockHash:'bad'},{step:'Design'},{metadataURI:'private'},{schemaVersion:'other'}])assert.throws(()=>validateChainProofShape(cert,{...proof,...patch}));
 for(const patch of [{submitter:'0x'+'34'.repeat(20)},{entryId:'4'},{blockNumber:'101'},{blockTimestamp:'1234567891'},{blockHash:'0x'+'ff'.repeat(32)}])await assert.rejects(verifyChainProof(cert,{...proof,...patch},client),/differs/);
});
