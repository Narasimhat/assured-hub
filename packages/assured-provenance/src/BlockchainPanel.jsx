import { useState } from 'react';
import { connectSepoliaWallet, createChainProof, REGISTRY, submitPassportAnchor, verifyChainProof } from './blockchain.js';

function downloadJson(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function BlockchainPanel({ certificate, initialProofs = [], initialSubmission = '', onProofCreated, onSubmitted }) {
  const saved = initialProofs.find(p => p.recordSha256 === certificate.recordSha256);
  const [wallet, setWallet] = useState('');
  const [transactionHash, setTransactionHash] = useState(saved?.transactionHash || initialSubmission);
  const [proof, setProof] = useState(saved || null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(saved ? 'Saved proof loaded. Recheck on-chain before relying on it.' : '');
  const [verified, setVerified] = useState(false);
  async function run(action) {
    setBusy(true); setMessage(''); setVerified(false);
    try { await action(); } catch (error) { setMessage(error.shortMessage || error.message || 'Blockchain request failed.'); } finally { setBusy(false); }
  }
  function acceptProof(value) {
    setProof(value); setTransactionHash(value.transactionHash); setVerified(true);
    if (onProofCreated) onProofCreated(value);
    setMessage('On-chain anchor verified on Sepolia with at least 12 confirmations. The submitting wallet is recorded; laboratory identity and biological claims are not verified.');
  }
  return <section aria-label="Sepolia passport anchor" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #b9ceca' }}>
    <h4>ASSUREDChain · Sepolia testnet</h4>
    <p>Anchor only this passport’s SHA-256 fingerprint using your wallet. No sequences, clone identifiers, metadata links or private keys are sent by the app. Your wallet shows the transaction and testnet fee before you approve.</p>
    <p style={{ overflowWrap: 'anywhere' }}>Network: Sepolia (11155111) · Registry: <a href={`https://sepolia.etherscan.io/address/${REGISTRY.address}`} target="_blank" rel="noopener noreferrer">{REGISTRY.address}</a></p>
    <fieldset disabled={busy} style={{ border: 0, padding: 0 }}><legend>Anchor and verify the selected passport</legend>
      <button type="button" onClick={() => run(async () => { setWallet(await connectSepoliaWallet(window.ethereum)); setMessage('Wallet connected. Review the registry and passport fingerprint, then approve anchoring in your wallet.'); })}>Connect Sepolia wallet</button>
      {wallet && <p style={{ overflowWrap: 'anywhere' }}>Connected wallet: {wallet}. Use a fresh wallet; do not reuse the key formerly committed to ASSUREDChain.</p>}
      <button type="button" disabled={!wallet || !!transactionHash} onClick={() => run(async () => {
        await submitPassportAnchor(certificate, { provider: window.ethereum, expectedAccount: wallet, onSubmitted: hash => {
          setTransactionHash(hash); if (onSubmitted) onSubmitted(hash);
        } });
        setMessage('Transaction submitted. Keep its hash. Once mined with 12 confirmations, use Verify transaction to generate the proof. No transaction is automatically retried.');
      })}>Anchor passport hash on Sepolia</button>
      <label style={{ display: 'grid', margin: '12px 0', gap: 4 }}>Sepolia transaction hash
        <input value={transactionHash} onChange={e => { setTransactionHash(e.target.value.trim()); setVerified(false); setProof(null); setMessage(''); }} spellCheck={false} />
      </label>
      <button type="button" disabled={!transactionHash} onClick={() => run(async () => acceptProof(await createChainProof(certificate, transactionHash)))}>Verify transaction and generate proof</button>
      <label style={{ display: 'block', margin: '12px 0' }}>Import blockchain proof JSON
        <input type="file" accept=".json,application/json" onChange={e => {
          const file = e.target.files[0]; setVerified(false); setProof(null); setMessage('');
          if (file) run(async () => {
            if (file.size > 65536) throw new Error('Chain proof limit is 64 KB.');
            acceptProof(await verifyChainProof(certificate, JSON.parse(await file.text())));
          });
        }} />
      </label>
      {transactionHash && <p style={{ overflowWrap: 'anywhere' }}><a href={`https://sepolia.etherscan.io/tx/${/^0x[0-9a-fA-F]{64}$/.test(transactionHash) ? transactionHash : ''}`} target="_blank" rel="noopener noreferrer">View transaction in Sepolia explorer</a></p>}
      {transactionHash && <button type="button" onClick={() => downloadJson('assured-anchor-submission.json', { schemaVersion: 'assured-anchor-submission/1', chainId: REGISTRY.chainId, contractAddress: REGISTRY.address, recordSha256: certificate.recordSha256, transactionHash })}>Download transaction reference</button>}
      {proof && <button type="button" onClick={() => downloadJson('assured-passport.chainproof.json', proof)}>Download blockchain proof</button>}
    </fieldset>
    <p role="status" aria-live="polite">{busy ? 'Checking wallet or chain. Network failures leave the anchor unverified…' : message}</p>
    <p>{verified ? 'Verification succeeded in this session.' : 'No current on-chain verification for this selection.'} The proof is a separate file; the original passport remains unchanged and self-issued. Sepolia is a test network, and 12 confirmations are not a finality guarantee. The registry is public: any wallet can submit a hash. Proof verification contacts a public RPC service, which sees your IP and the requested transaction/contract.</p>
  </section>;
}
