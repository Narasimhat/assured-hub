import { createPublicClient, createWalletClient, custom, decodeEventLog, http, isAddress, keccak256, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { checkPassport } from './passport.js';

export const REGISTRY = Object.freeze({
  chainId: 11155111,
  address: '0x18AD270faa80527Bb81f2a488C51c686E42936d2',
  runtimeCodeHash: '0x5fa817d80b7647a5c2d9b9b16bd178efa4796354e4e60881a96ec22bf0c95f5f',
  deploymentTransaction: '0x867c8c174db9ecd13260400ff00c5023511a77ad055e7174d2ff6e998aead765',
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  confirmations: 12,
  step: 'FAIR Passport',
});
// ABI of ASSUREDChain's MIT-licensed AssuredRegistry.sol. No private app code or keys are copied.
export const REGISTRY_ABI = parseAbi([
  'function log(bytes32 contentHash, string step, string metadataURI) returns (uint256 id)',
  'function entries(uint256 id) view returns (address submitter, bytes32 contentHash, string step, string metadataURI, uint256 timestamp)',
  'event Logged(uint256 indexed id, address indexed submitter, bytes32 contentHash, string step, string metadataURI, uint256 timestamp)',
]);
export const PROOF_VERSION = 'assured-chainproof/1';
const txPattern = /^0x[0-9a-fA-F]{64}$/;
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
const decimal = v => typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v);
export function publicRegistryClient() {
  return createPublicClient({ chain: sepolia, transport: http(REGISTRY.rpcUrl, { timeout: 15000, retryCount: 1 }), cacheTime: 0 });
}
export async function assertRegistry(client) {
  if (await client.getChainId() !== REGISTRY.chainId) throw new Error('RPC network mismatch: expected Sepolia (11155111).');
  const code = await client.getBytecode({ address: REGISTRY.address });
  if (!code || code === '0x' || keccak256(code) !== REGISTRY.runtimeCodeHash) throw new Error('Registry bytecode does not match the verified ASSUREDChain deployment.');
}
export async function connectSepoliaWallet(provider) {
  if (!provider?.request) throw new Error('Install or enable an Ethereum wallet in this browser. Never enter a private key into this app.');
  if (Number(await provider.request({ method: 'eth_chainId' })) !== REGISTRY.chainId) throw new Error('Select Sepolia in your wallet, then connect again.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!Array.isArray(accounts) || !isAddress(accounts[0] || '')) throw new Error('Wallet did not provide a valid account.');
  return accounts[0];
}
// The caller must invoke this only from an explicit user action. Wallet handles signing and fees.
export async function submitPassportAnchor(certificate, { provider, expectedAccount, client = publicRegistryClient(), onSubmitted = () => {} } = {}) {
  await checkPassport(certificate);
  if (!provider?.request) throw new Error('Connect a Sepolia wallet first.');
  if (Number(await provider.request({ method: 'eth_chainId' })) !== REGISTRY.chainId) throw new Error('Wallet network changed. Select Sepolia.');
  const accounts = await provider.request({ method: 'eth_accounts' });
  if (!Array.isArray(accounts) || !isAddress(accounts[0] || '')) throw new Error('Connect a Sepolia wallet first.');
  if (expectedAccount && !same(accounts[0], expectedAccount)) throw new Error('Wallet account changed since connecting. Reconnect before anchoring.');
  await assertRegistry(client);
  const wallet = createWalletClient({ chain: sepolia, transport: custom(provider) });
  const request = { address: REGISTRY.address, abi: REGISTRY_ABI, functionName: 'log',
    args: ['0x' + certificate.recordSha256, REGISTRY.step, ''], account: accounts[0], chain: sepolia };
  await client.simulateContract(request);
  // Check again after asynchronous preflight. A changed account or network needs fresh user review.
  const chain = Number(await provider.request({ method: 'eth_chainId' }));
  const currentAccounts = await provider.request({ method: 'eth_accounts' });
  if (chain !== REGISTRY.chainId || !same(currentAccounts?.[0], accounts[0])) throw new Error('Wallet account or network changed during preflight. Reconnect and retry.');
  const transactionHash = await wallet.writeContract(request);
  if (!txPattern.test(transactionHash)) throw new Error('Wallet returned an invalid transaction hash.');
  onSubmitted(transactionHash);
  return transactionHash;
}
export async function createChainProof(certificate, transactionHash, client = publicRegistryClient()) {
  await checkPassport(certificate);
  if (!txPattern.test(transactionHash || '')) throw new Error('Enter a 32-byte transaction hash.');
  await assertRegistry(client);
  const receipt = await client.getTransactionReceipt({ hash: transactionHash });
  if (receipt.status !== 'success') throw new Error('Transaction failed or reverted; it is not an anchor.');
  if (!same(receipt.transactionHash, transactionHash) || !same(receipt.to, REGISTRY.address)) throw new Error('Transaction is not a call to the expected registry.');
  const matches = [];
  for (const log of receipt.logs) {
    if (!same(log.address, REGISTRY.address) || log.removed) continue;
    try {
      const { args } = decodeEventLog({ abi: REGISTRY_ABI, eventName: 'Logged', data: log.data, topics: log.topics, strict: true });
      if (same(args.contentHash, '0x' + certificate.recordSha256) && args.step === REGISTRY.step && args.metadataURI === '' && same(args.submitter, receipt.from)) matches.push(args);
    } catch { /* Unrelated or malformed logs cannot establish an anchor. */ }
  }
  if (matches.length !== 1) throw new Error('No unique registry event matches this passport, step and submitter.');
  const event = matches[0];
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (!same(block.hash, receipt.blockHash) || event.timestamp !== block.timestamp) throw new Error('Receipt is not in the current canonical block, or its timestamp differs.');
  const head = await client.getBlockNumber({ cacheTime: 0 });
  const confirmations = head >= receipt.blockNumber ? head - receipt.blockNumber + 1n : 0n;
  if (confirmations < BigInt(REGISTRY.confirmations)) throw new Error(`Anchor has ${confirmations} confirmations; ${REGISTRY.confirmations} required. Keep the transaction hash and verify again later.`);
  const entry = await client.readContract({ address: REGISTRY.address, abi: REGISTRY_ABI, functionName: 'entries', args: [event.id] });
  if (!same(entry[0], event.submitter) || !same(entry[1], event.contentHash) || entry[2] !== REGISTRY.step || entry[3] !== '' || entry[4] !== block.timestamp) throw new Error('Registry entry differs from the transaction event.');
  return { schemaVersion: PROOF_VERSION, chainId: REGISTRY.chainId, contractAddress: REGISTRY.address,
    recordSha256: certificate.recordSha256, transactionHash: receipt.transactionHash, submitter: event.submitter,
    entryId: event.id.toString(), blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash,
    blockTimestamp: block.timestamp.toString(), step: REGISTRY.step, metadataURI: '' };
}
export function validateChainProofShape(certificate, proof) {
  if (!proof || proof.schemaVersion !== PROOF_VERSION || proof.chainId !== REGISTRY.chainId || !same(proof.contractAddress, REGISTRY.address) || proof.recordSha256 !== certificate.recordSha256 || !txPattern.test(proof.transactionHash || '') || !isAddress(proof.submitter || '') || !decimal(proof.entryId) || !decimal(proof.blockNumber) || !decimal(proof.blockTimestamp) || !txPattern.test(proof.blockHash || '') || proof.step !== REGISTRY.step || proof.metadataURI !== '') throw new Error('Invalid chain proof, unsupported network/registry, or proof belongs to another passport.');
  return proof;
}
export async function verifyChainProof(certificate, proof, client = publicRegistryClient()) {
  await checkPassport(certificate);
  validateChainProofShape(certificate, proof);
  const verified = await createChainProof(certificate, proof.transactionHash, client);
  for (const field of Object.keys(verified)) {
    const matches = ['contractAddress', 'transactionHash', 'submitter', 'blockHash'].includes(field) ? same(verified[field], proof[field]) : verified[field] === proof[field];
    if (!matches) throw new Error(`Chain proof field ${field} differs from the verified transaction.`);
  }
  return verified;
}
