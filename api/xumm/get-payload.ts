import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Server-side XUMM payload status retrieval
 * Keeps XUMM_API_SECRET on the server, never exposed to the browser.
 * 
 * GET /api/xumm/get-payload?uuid=<payload_uuid>
 * Returns: { response: { account, txid, signer_pubkey }, meta: { resolved, signed } }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.XUMM_API_KEY;
  const apiSecret = process.env.XUMM_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'XUMM credentials not configured on server' });
  }

  try {
    const { uuid } = req.query;

    if (!uuid || typeof uuid !== 'string') {
      return res.status(400).json({ error: 'Missing uuid parameter' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({ error: 'Invalid uuid format' });
    }

    const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('XUMM API error:', response.status, errorData);
      return res.status(502).json({ error: 'Failed to get XUMM payload' });
    }

    const data = await response.json();

    // Only return what the client needs
    return res.status(200).json({
      meta: {
        resolved: data.meta?.resolved,
        signed: data.meta?.signed,
        expired: data.meta?.expired,
      },
      response: {
        account: data.response?.account,
        txid: data.response?.txid,
        signer_pubkey: data.response?.signer_pubkey,
      },
    });
  } catch (error) {
    console.error('XUMM payload retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
