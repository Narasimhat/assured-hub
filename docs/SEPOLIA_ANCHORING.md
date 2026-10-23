# ASSUREDChain anchoring in Hub FAIR

This release adds an optional Sepolia testnet adapter in Bench's FAIR Passport step. It reuses the existing ASSUREDChain registry interface and deployed contract, rather than deploying another contract or copying the Python app and its credentials.

## Registry provenance

- Network: Sepolia, chain ID `11155111` only.
- Contract: `0x18AD270faa80527Bb81f2a488C51c686E42936d2`.
- Runtime bytecode Keccak-256: `0x5fa817d80b7647a5c2d9b9b16bd178efa4796354e4e60881a96ec22bf0c95f5f`.
- Source: ASSUREDChain `contracts/AssuredRegistry.sol`, SPDX MIT; Git blob `fb503e1dd27cc8944d156f34f4c225c97729b8f7`.
- Sourcify reports exact creation/runtime matches, verified `2025-10-29T21:05:29Z`. The verified source matches the repository source after CRLF/LF normalization.
- Verification record: https://sourcify.dev/server/v2/contract/11155111/0x18AD270faa80527Bb81f2a488C51c686E42936d2?fields=all
- Deployment transaction: `0x867c8c174db9ecd13260400ff00c5023511a77ad055e7174d2ff6e998aead765`.

The test fixture `packages/assured-provenance/test/fixtures/assured-registry-runtime.hex` contains the verified runtime bytes from that record. No RPC credentials, wallet keys or private .env files are copied. Read-only explorer/public RPC requests were blocked in the development environment; live transaction verification and wallet signing still require an integration smoke test on Sepolia.

## Creator workflow

1. In Bench's **FAIR Passport** step, create or select a passport. Imported passports can also be selected in Auditor mode.
2. Scroll to **ASSUREDChain · Sepolia testnet**. Select Sepolia in an installed browser wallet, then click **Connect Sepolia wallet**. No network is silently added or switched.
3. Review the passport fingerprint and registry address. Click **Anchor passport hash on Sepolia** and approve the transaction in the wallet. Simulation, chain and runtime-bytecode checks run before the wallet submission; account/network changes during preflight abort it.
4. The transaction calls `log(bytes32, string, string)` with the passport `recordSha256`, fixed step `FAIR Passport`, and an empty metadata URI. No sequences, clone IDs, uploaded evidence or project metadata are sent on-chain. The wallet handles gas and signing.
5. Keep the returned transaction hash. Save or Export the Bench experiment, or download the transaction-reference JSON. The app does not automatically resubmit a transaction.
6. After mining and at least 12 confirmations, click **Verify transaction and generate proof**. Download the separate `.chainproof.json` and the original passport. Recheck later if the transaction is still pending or lacks confirmations.

The transaction-reference JSON is an unverified recovery note (`assured-anchor-submission/1`), not a chain proof. To resume, copy its transaction hash into the transaction-hash field. Dropped or replaced transactions require the actual mined hash. A rejected wallet request never becomes an anchored record.

Use a fresh wallet. ASSUREDChain previously committed API credentials and a wallet private key; rotate affected credentials and never use the exposed key for this integration. Neither private-key input nor server-side signing is supported.

## Auditor workflow

Select/import the passport, then either import its chain proof or enter a transaction hash. Wallet connection is not needed for read-only verification. All checks must succeed:

- Passport record integrity and chain-proof shape/record linkage.
- RPC chain ID and exact pinned registry runtime bytecode.
- Successful receipt, expected destination and transaction hash.
- A unique `Logged` event emitted by that registry with the expected passport digest, fixed step, empty metadata URI and receipt sender.
- Canonical block hash and matching event/block timestamp.
- At least 12 confirmations at the time of verification.
- Matching `entries(id)` ledger values for submitter, digest, step, URI and timestamp.
- For an imported proof, agreement of every declared on-chain field with the recomputed proof.

The proof is ordinary JSON with schema `assured-chainproof/1`. Chain ID, contract, passport digest, transaction hash, submitter, entry ID, block number/hash, timestamp, step and URI are checked. RPC outages, failed transactions, wrong networks/contracts, changed fields, missing/ambiguous events and insufficient confirmations leave verification unsuccessful.

## Storage and trust

The original passport is never rewritten: its `anchorStatus: unanchored` field describes the original self-issued record. Anchoring evidence lives in a separate proof, avoiding a circular hash. Bench keeps proofs and pending transaction references beside passport history; Save and .assured Export/Import preserve them. Imports perform schema checks only and make no automatic external requests. Loaded proofs explicitly require a fresh chain check and never inherit a saved 'verified' flag.

Verification confirms that a particular wallet submitted this digest in the matching transaction/block. The contract permits anyone to log a hash. There is no trusted-laboratory allowlist or identity credential, and a matching anchor does not establish cell identity, scientific results, QC acceptance or regulatory compliance. Twelve confirmations are a configurable application policy pinned in code, not Ethereum finality. Sepolia is a test network and not a permanent production audit archive.

RPC reads use `https://ethereum-sepolia-rpc.publicnode.com` without an API key; the provider sees the visitor IP and contract/transaction queries. Merely loading a passport does not contact it. The selected network, registry and code hash are fixed; changing them requires a reviewed code release. No mainnet network or automatic fallback is enabled.

## Validation and release

- Shared package tests use the verified runtime fixture and mocked wallet/RPC clients. They cover hash-only calldata, network/account changes, simulation errors, failed receipts, mismatched events, reorgs, confirmation boundaries, registry-entry mismatches and proof tampering.
- Browser QA mocks injected wallet requests and public RPC responses. It covers wrong-network rejection, explicit submission, 11/12 confirmations, proof download/import, altered-proof rejection, preserved original passport, export and Save/reload with a required recheck.
- No test sends a real transaction or requires a private key.
- Before treating the feature as live-tested, use a fresh wallet funded with Sepolia test ETH, anchor a non-sensitive test passport, and verify it through the actual RPC endpoint. Then test Auditor mode in a second browser using only the passport, proof and evidence files.

Deploy only to the FAIR Hub project from `fair-production`. The original Hub main branch and its production project are outside this release.
