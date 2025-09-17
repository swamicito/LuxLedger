import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('content-type', 'application/json');
  res.status(200).send({ ok: true, service: 'LuxBroker API', ping: Date.now() });
}
