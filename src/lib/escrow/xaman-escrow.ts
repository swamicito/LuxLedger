/**
 * Xaman-signed XRPL escrow creation.
 *
 * The buyer signs a real EscrowCreate on the configured XRPL network
 * (testnet via VITE_XRPL_NETWORK=testnet). Account is left unset in the
 * txjson so Xaman fills it with the signing account — the buyer's wallet,
 * never a LuxLedger house wallet. After the signed tx validates on-chain
 * we return the real chain identifiers (tx hash + offer sequence) that
 * get persisted on escrow_transactions.
 */

import { convertUsdToXrp } from '@/lib/xrpl';

// Seconds between the Ripple epoch (2000-01-01) and the Unix epoch.
const RIPPLE_EPOCH_OFFSET = 946684800;

const NETWORKS = {
  testnet: {
    jsonRpc: 'https://s.altnet.rippletest.net:51234',
    explorer: 'https://testnet.xrpl.org',
  },
  mainnet: {
    jsonRpc: 'https://xrplcluster.com',
    explorer: 'https://livenet.xrpl.org',
  },
} as const;

type NetworkName = keyof typeof NETWORKS;

export function escrowNetwork(): NetworkName {
  return import.meta.env.VITE_XRPL_NETWORK === 'testnet' ? 'testnet' : 'mainnet';
}

export interface XamanEscrowResult {
  buyerAddress: string;
  sellerAddress: string;
  txHash: string;
  escrowSequence: number;
  amountXrp: number;
  explorerUrl: string;
}

interface XummPayloadCreateResponse {
  uuid: string;
  next?: { always?: string };
  refs?: { qr_png?: string };
}

interface XummPayloadStatus {
  meta: { resolved: boolean; signed: boolean; expired: boolean; cancelled: boolean };
  response: { account?: string; txid?: string; dispatched_result?: string };
}

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/;
const SIGN_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

async function createPayload(txjson: Record<string, unknown>): Promise<XummPayloadCreateResponse> {
  const res = await fetch('/api/xumm/create-payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txjson }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Payload service error (${res.status})`);
  }
  if (!data?.uuid) {
    throw new Error('Xaman did not return a payload id');
  }
  return data as XummPayloadCreateResponse;
}

async function getPayload(uuid: string): Promise<XummPayloadStatus> {
  const res = await fetch(`/api/xumm/get-payload?uuid=${encodeURIComponent(uuid)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Payload status error (${res.status})`);
  }
  return data as XummPayloadStatus;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForSignature(uuid: string): Promise<XummPayloadStatus> {
  const deadline = Date.now() + SIGN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await getPayload(uuid);
    if (status.meta.resolved) {
      return status;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('Signing request timed out — no response from Xaman.');
}

interface VerifiedEscrowTx {
  account: string;
  sequence: number;
  amountDrops: string;
  destination: string;
}

async function verifyEscrowCreateOnChain(txHash: string): Promise<VerifiedEscrowTx> {
  const { jsonRpc } = NETWORKS[escrowNetwork()];
  const res = await fetch(jsonRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'tx',
      params: [{ transaction: txHash, binary: false }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  const tx = data?.result;
  if (!res.ok || tx?.status !== 'success') {
    throw new Error('Could not fetch the signed transaction from the ledger.');
  }
  if (!tx.validated) {
    throw new Error('Escrow transaction is not validated on the ledger yet. Try again in a few seconds.');
  }
  if (tx.meta?.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`EscrowCreate failed on-chain: ${tx.meta?.TransactionResult ?? 'unknown'}`);
  }
  if (tx.TransactionType !== 'EscrowCreate') {
    throw new Error('Signed transaction was not an EscrowCreate.');
  }
  const sequence = Number(tx.Sequence);
  if (!Number.isInteger(sequence)) {
    throw new Error('Ledger response did not include the escrow sequence.');
  }
  return {
    account: tx.Account,
    sequence,
    amountDrops: typeof tx.Amount === 'string' ? tx.Amount : '0',
    destination: tx.Destination ?? '',
  };
}

function toHex(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Create a real EscrowCreate via a Xaman payload the buyer signs.
 * Throws on any failure — callers must not record an escrow row when this rejects.
 */
export async function createEscrowViaXaman(params: {
  amountUsd: number;
  sellerAddress: string;
  assetId: string;
  assetTitle?: string;
  buyerUserId: string;
  expirationDays?: number;
}): Promise<XamanEscrowResult> {
  const { amountUsd, sellerAddress, assetId, assetTitle, buyerUserId, expirationDays = 7 } = params;
  const network = NETWORKS[escrowNetwork()];

  if (!XRPL_ADDRESS_RE.test(sellerAddress)) {
    throw new Error('Seller has no XRPL wallet address on file — cannot create an on-chain escrow.');
  }
  if (!(amountUsd > 0)) {
    throw new Error('Escrow amount must be greater than zero.');
  }

  const amountXrp = await convertUsdToXrp(amountUsd);
  const amountDrops = String(Math.round(amountXrp * 1_000_000));
  if (amountDrops === '0') {
    throw new Error('Escrow amount converts to zero XRP.');
  }

  const nowRipple = Math.floor(Date.now() / 1000) - RIPPLE_EPOCH_OFFSET;
  const txjson: Record<string, unknown> = {
    TransactionType: 'EscrowCreate',
    // Account intentionally omitted — Xaman sets it to the buyer's signing account.
    Destination: sellerAddress,
    Amount: amountDrops,
    FinishAfter: nowRipple + 3600,
    CancelAfter: nowRipple + expirationDays * 86400,
    Memos: [
      {
        Memo: {
          MemoType: toHex('luxledger/escrow'),
          MemoData: toHex(JSON.stringify({ assetId, assetTitle, buyer: buyerUserId })),
        },
      },
    ],
  };

  const payload = await createPayload(txjson);
  const deepLink = payload.next?.always;
  if (!deepLink) {
    throw new Error('Xaman did not return a signing link.');
  }

  window.open(deepLink, '_blank');

  const status = await waitForSignature(payload.uuid);
  if (!status.meta.signed || !status.response.txid) {
    throw new Error('Escrow signing was declined or expired in Xaman.');
  }

  const txHash = status.response.txid;
  const onChain = await verifyEscrowCreateOnChain(txHash);

  return {
    buyerAddress: onChain.account || status.response.account || '',
    sellerAddress: onChain.destination || sellerAddress,
    txHash,
    escrowSequence: onChain.sequence,
    amountXrp: Number(onChain.amountDrops) / 1_000_000 || amountXrp,
    explorerUrl: `${network.explorer}/transactions/${txHash}`,
  };
}
