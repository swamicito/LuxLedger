import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Server-side XUMM payload creation
 * Keeps XUMM_API_SECRET on the server, never exposed to the browser.
 * 
 * POST /api/xumm/create-payload
 * Body: { txjson: { TransactionType: string, ... } }
 * Returns: { uuid: string, next: { always: string } }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.XUMM_API_KEY;
  const apiSecret = process.env.XUMM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'XUMM credentials not configured on server' });
  }

  try {
    const { txjson } = req.body;

    if (!txjson || !txjson.TransactionType) {
      return res.status(400).json({ error: 'Missing txjson with TransactionType' });
    }

    // Allowlist of safe transaction types
    const allowedTypes = ['SignIn', 'TrustSet', 'Payment', 'EscrowCreate', 'EscrowFinish', 'EscrowCancel', 'NFTokenMint', 'NFTokenCreateOffer', 'NFTokenAcceptOffer'];
    if (!allowedTypes.includes(txjson.TransactionType)) {
      return res.status(400).json({ error: `Transaction type '${txjson.TransactionType}' is not allowed` });
    }

    // Call XUMM API directly (no SDK needed server-side)
    const response = await fetch('https://xumm.app/api/v1/platform/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
      },
      body: JSON.stringify({ txjson }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('XUMM API error:', response.status, errorData);
      return res.status(502).json({ error: 'Failed to create XUMM payload' });
    }

    const data = await response.json();

    // Only return what the client needs — never leak the full response
    return res.status(200).json({
      uuid: data.uuid,
      next: data.next,
    });
  } catch (error) {
    console.error('XUMM payload creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
