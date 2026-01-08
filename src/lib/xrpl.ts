/**
 * XRPL/XUMM Integration for LuxLedger
 * Real implementation using XUMM SDK and XRPL APIs
 */

// ============================================================================
// TYPES
// ============================================================================

export interface XummPaymentRequest {
  amountXrp: number;
  memo?: string;
  destinationAddress?: string;
  destinationTag?: number;
}

export interface XummPaymentResponse {
  paymentId: string;
  qrCode: string;
  deepLink: string;
  websocketUrl?: string;
  status: 'pending' | 'signed' | 'rejected' | 'expired';
  txHash?: string;
}

export interface XrpPaymentVerification {
  txHash: string;
  verified: boolean;
  amount: number;
  fee: number;
  destination: string;
  source: string;
  timestamp: Date;
  ledgerIndex: number;
}

export interface XrplAccountInfo {
  address: string;
  balance: number; // in drops
  balanceXrp: number;
  sequence: number;
  ownerCount: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const XRPL_MAINNET = 'wss://xrplcluster.com';
const XRPL_TESTNET = 'wss://s.altnet.rippletest.net:51233';
const XUMM_API_URL = 'https://xumm.app/api/v1';

// Price feed APIs
const PRICE_FEEDS = {
  COINGECKO: 'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd',
  BINANCE: 'https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT',
};

// Get network based on environment
const getXrplNetwork = () => {
  const isTestnet = import.meta.env.VITE_XRPL_NETWORK === 'testnet';
  return isTestnet ? XRPL_TESTNET : XRPL_MAINNET;
};

// Cache for XRP rate (5 minute TTL)
let cachedRate: { rate: number; timestamp: number } | null = null;
const RATE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// XUMM SDK INTEGRATION
// ============================================================================

/**
 * Request a payment through XUMM wallet
 * Creates a payment request that user can sign with XUMM app
 */
export async function requestXummPayment(
  amountXrp: number,
  memo?: string,
  destinationAddress?: string
): Promise<XummPaymentResponse> {
  const xummApiKey = import.meta.env.VITE_XUMM_API_KEY;
  const xummApiSecret = import.meta.env.VITE_XUMM_API_SECRET;
  const platformWallet = import.meta.env.VITE_XRP_ADDRESS;

  if (!xummApiKey || !xummApiSecret) {
    console.warn('XUMM API credentials not configured, using demo mode');
    return createDemoPaymentResponse(amountXrp);
  }

  const destination = destinationAddress || platformWallet;
  if (!destination) {
    throw new Error('No destination address configured');
  }

  try {
    // Convert XRP to drops (1 XRP = 1,000,000 drops)
    const amountDrops = Math.floor(amountXrp * 1_000_000).toString();

    const payload = {
      txjson: {
        TransactionType: 'Payment',
        Destination: destination,
        Amount: amountDrops,
        ...(memo && {
          Memos: [{
            Memo: {
              MemoType: Buffer.from('luxledger', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase(),
            }
          }]
        })
      },
      options: {
        submit: true,
        expire: 10, // 10 minutes
        return_url: {
          web: `${window.location.origin}/payment/callback`
        }
      }
    };

    const response = await fetch(`${XUMM_API_URL}/platform/payload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': xummApiKey,
        'X-API-Secret': xummApiSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create XUMM payment');
    }

    const data = await response.json();

    return {
      paymentId: data.uuid,
      qrCode: data.refs.qr_png,
      deepLink: data.next.always,
      websocketUrl: data.refs.websocket_status,
      status: 'pending',
    };
  } catch (error) {
    console.error('XUMM payment request failed:', error);
    throw error;
  }
}

/**
 * Check the status of a XUMM payment
 */
export async function checkXummPaymentStatus(
  paymentId: string
): Promise<XummPaymentResponse> {
  const xummApiKey = import.meta.env.VITE_XUMM_API_KEY;
  const xummApiSecret = import.meta.env.VITE_XUMM_API_SECRET;

  if (!xummApiKey || !xummApiSecret) {
    return createDemoPaymentResponse(0, paymentId);
  }

  try {
    const response = await fetch(`${XUMM_API_URL}/platform/payload/${paymentId}`, {
      headers: {
        'X-API-Key': xummApiKey,
        'X-API-Secret': xummApiSecret,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    const data = await response.json();

    let status: XummPaymentResponse['status'] = 'pending';
    if (data.meta.expired) status = 'expired';
    else if (data.meta.signed) status = 'signed';
    else if (data.meta.cancelled) status = 'rejected';

    return {
      paymentId: data.meta.uuid,
      qrCode: data.refs?.qr_png || '',
      deepLink: data.next?.always || '',
      status,
      txHash: data.response?.txid,
    };
  } catch (error) {
    console.error('Failed to check XUMM payment status:', error);
    throw error;
  }
}

// ============================================================================
// XRPL TRANSACTION VERIFICATION
// ============================================================================

/**
 * Verify an XRP payment by transaction hash using XRPL
 */
export async function verifyXrpPayment(txHash: string): Promise<XrpPaymentVerification> {
  const network = getXrplNetwork();

  try {
    // Use XRPL JSON-RPC API
    const response = await fetch(network.replace('wss://', 'https://'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tx',
        params: [{
          transaction: txHash,
          binary: false,
        }],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }

    const data = await response.json();

    if (data.result.status !== 'success' || !data.result.validated) {
      return {
        txHash,
        verified: false,
        amount: 0,
        fee: 0,
        destination: '',
        source: '',
        timestamp: new Date(),
        ledgerIndex: 0,
      };
    }

    const tx = data.result;
    const amountDrops = typeof tx.Amount === 'string' ? parseInt(tx.Amount) : 0;
    const feeDrops = parseInt(tx.Fee || '0');

    return {
      txHash,
      verified: tx.validated && tx.meta?.TransactionResult === 'tesSUCCESS',
      amount: amountDrops / 1_000_000, // Convert drops to XRP
      fee: feeDrops / 1_000_000,
      destination: tx.Destination || '',
      source: tx.Account || '',
      timestamp: tx.date ? new Date((tx.date + 946684800) * 1000) : new Date(), // XRPL epoch
      ledgerIndex: tx.ledger_index || 0,
    };
  } catch (error) {
    console.error('Transaction verification failed:', error);
    // Return unverified result on error
    return {
      txHash,
      verified: false,
      amount: 0,
      fee: 0,
      destination: '',
      source: '',
      timestamp: new Date(),
      ledgerIndex: 0,
    };
  }
}

/**
 * Get account info from XRPL
 */
export async function getAccountInfo(address: string): Promise<XrplAccountInfo | null> {
  const network = getXrplNetwork();

  try {
    const response = await fetch(network.replace('wss://', 'https://'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{
          account: address,
          ledger_index: 'validated',
        }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.result.status !== 'success') return null;

    const account = data.result.account_data;
    const balanceDrops = parseInt(account.Balance || '0');

    return {
      address: account.Account,
      balance: balanceDrops,
      balanceXrp: balanceDrops / 1_000_000,
      sequence: account.Sequence,
      ownerCount: account.OwnerCount,
    };
  } catch (error) {
    console.error('Failed to get account info:', error);
    return null;
  }
}

// ============================================================================
// PRICE FEED
// ============================================================================

/**
 * Get current XRP to USD exchange rate
 * Uses multiple price feeds with fallback
 */
export async function getXrpUsdRate(): Promise<number> {
  // Check cache first
  if (cachedRate && Date.now() - cachedRate.timestamp < RATE_CACHE_TTL) {
    return cachedRate.rate;
  }

  // Try CoinGecko first
  try {
    const response = await fetch(PRICE_FEEDS.COINGECKO);
    if (response.ok) {
      const data = await response.json();
      const rate = data.ripple?.usd;
      if (rate && typeof rate === 'number') {
        cachedRate = { rate, timestamp: Date.now() };
        return rate;
      }
    }
  } catch (error) {
    console.warn('CoinGecko price feed failed:', error);
  }

  // Fallback to Binance
  try {
    const response = await fetch(PRICE_FEEDS.BINANCE);
    if (response.ok) {
      const data = await response.json();
      const rate = parseFloat(data.price);
      if (rate && !isNaN(rate)) {
        cachedRate = { rate, timestamp: Date.now() };
        return rate;
      }
    }
  } catch (error) {
    console.warn('Binance price feed failed:', error);
  }

  // Return cached rate if available, otherwise fallback
  if (cachedRate) {
    console.warn('Using stale cached rate');
    return cachedRate.rate;
  }

  // Last resort fallback
  console.warn('All price feeds failed, using fallback rate');
  return 0.50; // Conservative fallback
}

/**
 * Convert USD amount to XRP
 */
export async function convertUsdToXrp(usdAmount: number): Promise<number> {
  const rate = await getXrpUsdRate();
  return usdAmount / rate;
}

/**
 * Convert XRP amount to USD
 */
export async function convertXrpToUsd(xrpAmount: number): Promise<number> {
  const rate = await getXrpUsdRate();
  return xrpAmount * rate;
}

// ============================================================================
// DEMO MODE HELPERS
// ============================================================================

function createDemoPaymentResponse(
  amountXrp: number,
  paymentId?: string
): XummPaymentResponse {
  const id = paymentId || `demo_${Date.now()}`;
  return {
    paymentId: id,
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=xumm://demo/${id}`,
    deepLink: `xumm://demo/${id}`,
    status: 'pending',
  };
}

/**
 * Check if running in demo mode (no XUMM credentials)
 */
export function isXummDemoMode(): boolean {
  return !import.meta.env.VITE_XUMM_API_KEY || !import.meta.env.VITE_XUMM_API_SECRET;
}
