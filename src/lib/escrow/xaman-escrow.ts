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
  meta?: { resolved: boolean; signed: boolean; expired: boolean; cancelled: boolean };
  response?: { account?: string; txid?: string; dispatched_result?: string };
  error?: string;
}

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,33}$/;
const SIGN_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

// A pending payload survives an app-switch reload: on mobile the page can be
// fully reloaded when the user returns from Xaman, destroying the async chain.
// Persisting the uuid lets the purchase page resume and still write the row.
const PENDING_KEY = 'luxledger_pending_xaman_escrow';
const PENDING_TTL_MS = 30 * 60 * 1000;

export interface PendingXamanEscrow {
  uuid: string;
  assetId: string;
  buyerUserId: string;
  sellerAddress: string;
  amountUsd: number;
  createdAt: number;
}

export function savePendingEscrow(pending: Omit<PendingXamanEscrow, 'createdAt'>): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...pending, createdAt: Date.now() }));
  } catch {
    // storage unavailable — flow still works while the tab stays alive
  }
}

export function readPendingEscrow(): PendingXamanEscrow | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingXamanEscrow;
    if (!pending?.uuid || Date.now() - pending.createdAt > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

export function clearPendingEscrow(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

async function createPayload(txjson: Record<string, unknown>): Promise<XummPayloadCreateResponse> {
  const res = await fetch('/api/xumm/create-payload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txjson }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] create-payload response', { status: res.status, keys: Object.keys(data ?? {}), error: data?.error });
    throw new Error(data?.error || `Payload service error (${res.status})`);
  }
  if (!data?.uuid) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] create-payload missing uuid', { keys: Object.keys(data ?? {}) });
    throw new Error('Xaman did not return a payload id');
  }
  return data as XummPayloadCreateResponse;
}

async function getPayload(uuid: string): Promise<XummPayloadStatus> {
  const res = await fetch(`/api/xumm/get-payload?uuid=${encodeURIComponent(uuid)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] get-payload response', { status: res.status, keys: Object.keys(data ?? {}), error: data?.error });
    throw new Error(data?.error || `Payload status error (${res.status})`);
  }
  if (!data?.meta) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] get-payload missing meta', { keys: Object.keys(data ?? {}) });
  }
  return data as XummPayloadStatus;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitForSignature(uuid: string): Promise<XummPayloadStatus> {
  // Background tabs throttle setTimeout to ~1/min or suspend it entirely
  // (mobile app-switch to Xaman). Re-check immediately when the tab wakes.
  let wakeNow: (() => void) | null = null;
  const onWake = () => {
    wakeNow?.();
  };
  document.addEventListener('visibilitychange', onWake);
  window.addEventListener('focus', onWake);

  try {
    const deadline = Date.now() + SIGN_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const status = await getPayload(uuid);
      if (status.meta?.resolved) {
        return status;
      }
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          wakeNow = null;
          resolve();
        }, POLL_INTERVAL_MS);
        wakeNow = () => {
          clearTimeout(timer);
          wakeNow = null;
          resolve();
        };
      });
    }
    throw new Error('Signing request timed out — no response from Xaman.');
  } finally {
    document.removeEventListener('visibilitychange', onWake);
    window.removeEventListener('focus', onWake);
  }
}

interface LedgerTx {
  validated?: boolean;
  status?: string;
  TransactionType?: string;
  Account?: string;
  Destination?: string;
  Sequence?: number;
  Amount?: string | { value?: string };
  meta?: {
    TransactionResult?: string;
    AffectedNodes?: Array<{
      DeletedNode?: { LedgerEntryType?: string };
      CreatedNode?: { LedgerEntryType?: string };
      ModifiedNode?: { LedgerEntryType?: string };
    }>;
  };
}

interface VerifiedEscrowTx {
  account: string;
  sequence: number;
  amountDrops: string;
  destination: string;
}

async function fetchValidatedTx(jsonRpc: string, txHash: string): Promise<LedgerTx> {
  const res = await fetch(jsonRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'tx',
      params: [{ transaction: txHash, binary: false }],
    }),
  });
  const data = await res.json().catch(() => ({}));
  const tx = data?.result as LedgerTx | undefined;
  if (!res.ok || tx?.status !== 'success') {
    throw new Error('Could not fetch the signed transaction from the ledger.');
  }
  if (!tx.validated) {
    throw new Error('Escrow transaction is not validated on the ledger yet. Try again in a few seconds.');
  }
  if (tx.meta?.TransactionResult !== 'tesSUCCESS') {
    throw new Error(`Escrow transaction failed on-chain: ${tx.meta?.TransactionResult ?? 'unknown'}`);
  }
  return tx;
}

async function verifyEscrowCreateOnChain(txHash: string): Promise<VerifiedEscrowTx> {
  const { jsonRpc } = NETWORKS[escrowNetwork()];
  // A freshly-signed tx can take a ledger close or two to validate.
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tx = await fetchValidatedTx(jsonRpc, txHash);
      if (tx.TransactionType !== 'EscrowCreate') {
        throw new Error('Signed transaction was not an EscrowCreate.');
      }
      const sequence = Number(tx.Sequence);
      if (!Number.isInteger(sequence)) {
        throw new Error('Ledger response did not include the escrow sequence.');
      }
      return {
        account: tx.Account ?? '',
        sequence,
        amountDrops: typeof tx.Amount === 'string' ? tx.Amount : '0',
        destination: tx.Destination ?? '',
      };
    } catch (error) {
      lastError = error as Error;
      await sleep(2000);
    }
  }
  throw lastError ?? new Error('Could not verify the escrow transaction on-chain.');
}

async function verifyEscrowFinishOnChain(txHash: string): Promise<LedgerTx> {
  const { jsonRpc } = NETWORKS[escrowNetwork()];
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tx = await fetchValidatedTx(jsonRpc, txHash);
      if (tx.TransactionType !== 'EscrowFinish') {
        throw new Error('Signed transaction was not an EscrowFinish.');
      }
      // A real finish deletes the Escrow ledger object.
      const deletedEscrow = (tx.meta?.AffectedNodes ?? []).some(
        (n) => n.DeletedNode?.LedgerEntryType === 'Escrow'
      );
      if (!deletedEscrow) {
        throw new Error('EscrowFinish validated but no escrow object was finished.');
      }
      return tx;
    } catch (error) {
      lastError = error as Error;
      await sleep(2000);
    }
  }
  throw lastError ?? new Error('Could not verify the EscrowFinish transaction on-chain.');
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

  // Persist before the app-switch: if the tab reloads in the background the
  // purchase page can resume from this uuid instead of creating a second escrow.
  savePendingEscrow({
    uuid: payload.uuid,
    assetId,
    buyerUserId,
    sellerAddress,
    amountUsd,
  });

  window.open(deepLink, '_blank');

  try {
    const status = await waitForSignature(payload.uuid);
    return await finishSignedPayload(status, sellerAddress, amountXrp, network);
  } finally {
    clearPendingEscrow();
  }
}

/**
 * Resume a Xaman sign that survived a tab reload. Returns the verified on-chain
 * escrow result, or null when there is nothing pending to resume.
 * Throws with a user-facing message when the payload resolved unsigned/failed.
 */
export async function resumePendingEscrow(): Promise<XamanEscrowResult | null> {
  const pending = readPendingEscrow();
  if (!pending) return null;

  const network = NETWORKS[escrowNetwork()];
  try {
    const status = await waitForSignature(pending.uuid);
    return await finishSignedPayload(status, pending.sellerAddress, null, network);
  } finally {
    clearPendingEscrow();
  }
}

async function finishSignedPayload(
  status: XummPayloadStatus,
  sellerAddress: string,
  amountXrp: number | null,
  network: (typeof NETWORKS)[NetworkName]
): Promise<XamanEscrowResult> {
  if (!status.meta?.signed || !status.response?.txid) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] payload resolved unsigned', {
      meta: status.meta,
      hasTxid: Boolean(status.response?.txid),
      dispatched_result: status.response?.dispatched_result,
    });
    throw new Error(
      status.response?.dispatched_result
        ? `EscrowCreate failed on-chain: ${status.response.dispatched_result}`
        : 'Escrow signing was declined or expired in Xaman.'
    );
  }

  const txHash = status.response.txid;
  const onChain = await verifyEscrowCreateOnChain(txHash);

  return {
    buyerAddress: onChain.account || status.response?.account || '',
    sellerAddress: onChain.destination || sellerAddress,
    txHash,
    escrowSequence: onChain.sequence,
    amountXrp: Number(onChain.amountDrops) / 1_000_000 || amountXrp || 0,
    explorerUrl: `${network.explorer}/transactions/${txHash}`,
  };
}

// ---------------------------------------------------------------------------
// EscrowFinish — called after evaluate_escrow_release marks the row released.
// Any account may submit a time-held EscrowFinish (FinishAfter already elapsed);
// Account is omitted so Xaman fills it with whoever signs (buyer or seller).
// ---------------------------------------------------------------------------

const PENDING_FINISH_KEY = 'luxledger_pending_xaman_finish';

export interface PendingXamanFinish {
  uuid: string;
  escrowId: string;
  ownerAddress: string;
  offerSequence: number;
  createdAt: number;
}

export interface XamanFinishResult {
  txHash: string;
  signerAddress: string;
  ownerAddress: string;
  offerSequence: number;
  explorerUrl: string;
}

export function savePendingFinish(pending: Omit<PendingXamanFinish, 'createdAt'>): void {
  try {
    localStorage.setItem(PENDING_FINISH_KEY, JSON.stringify({ ...pending, createdAt: Date.now() }));
  } catch {
    // storage unavailable — flow still works while the tab stays alive
  }
}

export function readPendingFinish(): PendingXamanFinish | null {
  try {
    const raw = localStorage.getItem(PENDING_FINISH_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingXamanFinish;
    if (!pending?.uuid || Date.now() - pending.createdAt > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_FINISH_KEY);
      return null;
    }
    return pending;
  } catch {
    return null;
  }
}

export function clearPendingFinish(): void {
  try {
    localStorage.removeItem(PENDING_FINISH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Submit a real EscrowFinish via a Xaman payload. Throws on any failure —
 * callers must surface the message and must not mark the escrow finished.
 */
export async function finishEscrowViaXaman(params: {
  escrowId: string;
  ownerAddress: string;
  offerSequence: number;
}): Promise<XamanFinishResult> {
  const { escrowId, ownerAddress, offerSequence } = params;
  const network = NETWORKS[escrowNetwork()];

  if (!XRPL_ADDRESS_RE.test(ownerAddress)) {
    throw new Error('Missing the XRPL owner address that created the escrow.');
  }
  if (!Number.isInteger(offerSequence)) {
    throw new Error('Missing the on-chain escrow sequence.');
  }

  const txjson: Record<string, unknown> = {
    TransactionType: 'EscrowFinish',
    // Account intentionally omitted — Xaman sets it to the signing account.
    Owner: ownerAddress,
    OfferSequence: offerSequence,
    Memos: [
      {
        Memo: {
          MemoType: toHex('luxledger/escrow-finish'),
          MemoData: toHex(JSON.stringify({ escrowId })),
        },
      },
    ],
  };

  const payload = await createPayload(txjson);
  const deepLink = payload.next?.always;
  if (!deepLink) {
    throw new Error('Xaman did not return a signing link.');
  }

  savePendingFinish({ uuid: payload.uuid, escrowId, ownerAddress, offerSequence });
  window.open(deepLink, '_blank');

  try {
    const status = await waitForSignature(payload.uuid);
    return await finishSignedFinish(status, params, network);
  } finally {
    clearPendingFinish();
  }
}

/**
 * Resume a pending EscrowFinish signature after a mobile tab reload.
 * Returns null when there is no pending finish for the given escrow.
 */
export async function resumePendingFinish(escrowId: string): Promise<XamanFinishResult | null> {
  const pending = readPendingFinish();
  if (!pending || pending.escrowId !== escrowId) return null;

  const network = NETWORKS[escrowNetwork()];
  try {
    const status = await waitForSignature(pending.uuid);
    return await finishSignedFinish(status, pending, network);
  } finally {
    clearPendingFinish();
  }
}

async function finishSignedFinish(
  status: XummPayloadStatus,
  params: { escrowId: string; ownerAddress: string; offerSequence: number },
  network: (typeof NETWORKS)[NetworkName]
): Promise<XamanFinishResult> {
  if (!status.meta?.signed || !status.response?.txid) {
    // eslint-disable-next-line no-console
    console.error('[xaman-escrow] finish payload resolved unsigned', {
      meta: status.meta,
      hasTxid: Boolean(status.response?.txid),
      dispatched_result: status.response?.dispatched_result,
    });
    throw new Error(
      status.response?.dispatched_result
        ? `EscrowFinish failed on-chain: ${status.response.dispatched_result}`
        : 'EscrowFinish signing was declined or expired in Xaman.'
    );
  }

  const txHash = status.response.txid;
  const tx = await verifyEscrowFinishOnChain(txHash);

  return {
    txHash,
    signerAddress: tx.Account || status.response?.account || '',
    ownerAddress: params.ownerAddress,
    offerSequence: params.offerSequence,
    explorerUrl: `${network.explorer}/transactions/${txHash}`,
  };
}
